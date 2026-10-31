import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from "jose";
import { execute, query } from "./db";
import type { Utilisateur } from "./types";

// Configuration web Firebase : ces valeurs sont publiques par nature (elles
// figurent dans le code envoyé au navigateur). Lues à l'exécution pour
// qu'un changement de variable sur Railway ne demande pas de rebuild.
export type ConfigFirebase = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  apple: boolean;
  emulateur: string | null;
};

export function configFirebase(): ConfigFirebase | null {
  const { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID } =
    process.env;
  if (!FIREBASE_API_KEY || !FIREBASE_AUTH_DOMAIN || !FIREBASE_PROJECT_ID || !FIREBASE_APP_ID) {
    return null;
  }
  return {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    appId: FIREBASE_APP_ID,
    // Apple demande un compte Apple Developer : bouton affiché seulement une
    // fois le fournisseur activé dans la console Firebase.
    apple: process.env.FIREBASE_APPLE === "1",
    emulateur: emulateur(),
  };
}

// Émulateur Firebase local, pour les tests uniquement : jamais sur un site https.
function emulateur(): string | null {
  const hote = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!hote || (process.env.SITE_URL ?? "").startsWith("https://")) return null;
  return `http://${hote}`;
}

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export type IdentiteFirebase = {
  uid: string;
  email: string | null;
  emailVerifie: boolean;
  nom: string | null;
  fournisseur: string;
};

// Vérification de l'ID token selon la documentation Firebase : signature
// Google, émetteur et audience = projet, date d'authentification passée.
export async function verifierJeton(idToken: string): Promise<IdentiteFirebase> {
  const config = configFirebase();
  if (!config) throw new Error("firebase-non-configure");

  let payload: JWTPayload;
  if (config.emulateur) {
    payload = decodeJwt(idToken); // l'émulateur émet des jetons non signés
  } else {
    ({ payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${config.projectId}`,
      audience: config.projectId,
      algorithms: ["RS256"],
    }));
    const authTime = Number(payload.auth_time);
    if (!authTime || authTime > Date.now() / 1000 + 60) throw new Error("auth_time invalide");
  }
  if (!payload.sub) throw new Error("sub absent");

  const firebase = payload.firebase as { sign_in_provider?: string } | undefined;
  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : null,
    emailVerifie: payload.email_verified === true,
    nom: typeof payload.name === "string" ? payload.name : null,
    fournisseur: firebase?.sign_in_provider ?? "inconnu",
  };
}

// Retrouve, relie ou crée le compte ArTova correspondant à l'identité Firebase.
export async function utilisateurPourIdentite(
  identite: IdentiteFirebase,
  nomSaisi?: string | null,
): Promise<Pick<Utilisateur, "id" | "role">> {
  const lies = await query<Pick<Utilisateur, "id" | "role">>(
    "SELECT id, role FROM utilisateurs WHERE firebase_uid = ? LIMIT 1",
    [identite.uid],
  );
  if (lies[0]) return lies[0];

  // Sans adresse vérifiée, n'importe qui pourrait réclamer le compte d'autrui.
  if (!identite.email || !identite.emailVerifie) throw new Error("email-non-verifie");

  const existants = await query<Pick<Utilisateur, "id" | "role">>(
    "SELECT id, role FROM utilisateurs WHERE email = ? LIMIT 1",
    [identite.email],
  );
  if (existants[0]) {
    await execute("UPDATE utilisateurs SET firebase_uid = ? WHERE id = ?", [
      identite.uid,
      existants[0].id,
    ]);
    return existants[0];
  }

  const nom = (nomSaisi?.trim() || identite.nom?.trim() || identite.email.split("@")[0]).slice(
    0,
    120,
  );
  const resultat = await execute(
    `INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, role, firebase_uid)
     VALUES (?, ?, NULL, NULL, 'client', ?)`,
    [nom, identite.email, identite.uid],
  );
  return { id: Number(resultat.insertId), role: "client" };
}

export function cheminSur(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

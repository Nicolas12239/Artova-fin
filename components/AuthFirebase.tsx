"use client";

import { useState, useSyncExternalStore } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { connecter } from "@/app/actions/auth";
import type { ConfigFirebase } from "@/lib/firebase-auth";

// Application iOS (Capacitor) : les fenêtres Google/Apple sont interdites dans
// une vue web intégrée, on passe par le SDK natif exposé par l'application.
type ResultatNatif = {
  credential?: { idToken?: string; accessToken?: string; nonce?: string } | null;
  user?: { displayName?: string | null } | null;
};
type AuthNative = {
  signInWithGoogle: () => Promise<ResultatNatif>;
  signInWithApple: () => Promise<ResultatNatif>;
};

function authNative(): AuthNative | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { FirebaseAuthentication?: AuthNative } };
  }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.FirebaseAuthentication ?? null;
}

export const CLE_EMAIL_LIEN = "artova_email_lien";
export const CLE_NOM_LIEN = "artova_nom_lien";

let emulateurConnecte = false;

export function authFirebase(config: ConfigFirebase): Auth {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        appId: config.appId,
      });
  const auth = getAuth(app);
  auth.languageCode = "fr";
  if (config.emulateur && !emulateurConnecte) {
    connectAuthEmulator(auth, config.emulateur, { disableWarnings: true });
    emulateurConnecte = true;
  }
  return auth;
}

// La session Firebase ne sert qu'à prouver l'identité : on l'échange contre la
// session ArTova, puis on la ferme pour n'avoir qu'une seule source de vérité.
export async function ouvrirSession(
  auth: Auth,
  utilisateur: User,
  next: string | undefined,
  nom?: string | null,
): Promise<void> {
  const reponse = await fetch("/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await utilisateur.getIdToken(), next, nom }),
  });
  const donnees = (await reponse.json()) as { redirection?: string; erreur?: string };
  await signOut(auth);
  if (!reponse.ok || !donnees.redirection) {
    throw new Error(donnees.erreur ?? "La connexion n'a pas abouti. Veuillez réessayer.");
  }
  window.location.assign(donnees.redirection);
}

const MESSAGES_FIREBASE: Record<string, string> = {
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/missing-email": "Saisissez votre adresse e-mail.",
  "auth/email-already-in-use":
    "Un compte existe déjà avec cette adresse : connectez-vous ou recevez un lien de connexion.",
  "auth/weak-password": "Mot de passe trop court : 8 caractères minimum.",
  "auth/popup-closed-by-user": "La fenêtre de connexion a été fermée.",
  "auth/cancelled-popup-request": "La fenêtre de connexion a été fermée.",
  "auth/popup-blocked":
    "Votre navigateur a bloqué la fenêtre de connexion. Autorisez les fenêtres pour ce site.",
  "auth/account-exists-with-different-credential":
    "Cette adresse est déjà liée à une autre méthode de connexion : utilisez celle-ci.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Connexion internet indisponible. Réessayez.",
  "auth/invalid-action-code": "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
  "auth/expired-action-code": "Ce lien a expiré. Demandez-en un nouveau.",
  "auth/operation-not-allowed": "Cette méthode de connexion n'est pas encore activée.",
};

export function messageErreur(erreur: unknown): string {
  const code = (erreur as { code?: string })?.code;
  if (code && MESSAGES_FIREBASE[code]) return MESSAGES_FIREBASE[code];
  if (erreur instanceof Error && !code) return erreur.message;
  return "La connexion n'a pas abouti. Veuillez réessayer.";
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LogoApple() {
  return (
    <svg viewBox="0 0 384 512" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

const champ =
  "w-full border-b border-encre/30 bg-transparent py-3 text-sm outline-none transition-colors focus:border-encre";
const libelle = "mb-1 block text-[11px] uppercase tracking-[0.18em] text-gris";
const boutonSocial =
  "flex h-12 w-full items-center justify-center gap-3 rounded-full text-[14px] font-medium transition-colors disabled:opacity-50";
const boutonPrincipal =
  "w-full bg-encre px-6 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:opacity-50";

type Etape = "formulaire" | "lien-envoye" | "verification-envoyee" | "reinitialisation-envoyee";

export function AuthFirebase({
  config,
  mode,
  next,
}: {
  config: ConfigFirebase;
  mode: "connexion" | "inscription";
  next?: string;
}) {
  const inscription = mode === "inscription";
  const appIos = useSyncExternalStore(
    () => () => {},
    () => authNative() !== null && /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );
  const [etape, setEtape] = useState<Etape>("formulaire");
  const [avecMotDePasse, setAvecMotDePasse] = useState(false);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  async function executer(action: string, tache: () => Promise<void>) {
    setErreur(null);
    setEnCours(action);
    try {
      await tache();
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(null);
    }
  }

  const avecFournisseur = (fournisseur: "google" | "apple") =>
    executer(fournisseur, async () => {
      const auth = authFirebase(config);
      const natif = authNative();
      if (natif) {
        const resultat =
          fournisseur === "google" ? await natif.signInWithGoogle() : await natif.signInWithApple();
        const jeton = resultat.credential?.idToken;
        if (!jeton) throw new Error("La connexion a été annulée.");
        const identifiant =
          fournisseur === "google"
            ? GoogleAuthProvider.credential(jeton, resultat.credential?.accessToken)
            : new OAuthProvider("apple.com").credential({
                idToken: jeton,
                rawNonce: resultat.credential?.nonce,
              });
        const { user } = await signInWithCredential(auth, identifiant);
        await ouvrirSession(auth, user, next, resultat.user?.displayName);
        return;
      }
      let provider: GoogleAuthProvider | OAuthProvider;
      if (fournisseur === "google") {
        provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
      } else {
        provider = new OAuthProvider("apple.com");
        provider.addScope("email");
        provider.addScope("name");
        provider.setCustomParameters({ locale: "fr_FR" });
      }
      const { user } = await signInWithPopup(auth, provider);
      await ouvrirSession(auth, user, next);
    });

  const envoyerLien = () =>
    executer("lien", async () => {
      const auth = authFirebase(config);
      const retour = new URL("/connexion/lien", window.location.origin);
      if (next) retour.searchParams.set("next", next);
      await sendSignInLinkToEmail(auth, email.trim(), {
        url: retour.toString(),
        handleCodeInApp: true,
      });
      try {
        window.localStorage.setItem(CLE_EMAIL_LIEN, email.trim());
        if (nom.trim()) window.localStorage.setItem(CLE_NOM_LIEN, nom.trim());
      } catch {
        // Stockage indisponible : l'adresse sera redemandée à l'ouverture du lien.
      }
      setEtape("lien-envoye");
      setEnCours(null);
    });

  const avecMdp = () =>
    executer("mdp", async () => {
      const auth = authFirebase(config);
      if (inscription) {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), motDePasse);
        if (nom.trim()) await updateProfile(user, { displayName: nom.trim() });
        const retour = new URL("/connexion", window.location.origin);
        retour.searchParams.set("verifie", "1");
        if (next) retour.searchParams.set("next", next);
        await sendEmailVerification(user, { url: retour.toString() });
        await signOut(auth);
        setEtape("verification-envoyee");
        setEnCours(null);
        return;
      }
      try {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), motDePasse);
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          await signOut(auth);
          setEtape("verification-envoyee");
          setEnCours(null);
          return;
        }
        await ouvrirSession(auth, user, next);
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code !== "auth/invalid-credential" && code !== "auth/user-not-found" && code !== "auth/wrong-password") {
          throw e;
        }
        // Comptes créés avant Firebase : mot de passe vérifié par ArTova.
        const formulaire = new FormData();
        formulaire.set("email", email.trim());
        formulaire.set("mot_de_passe", motDePasse);
        formulaire.set("next", next ?? "");
        const resultat = await connecter(null, formulaire);
        if (resultat?.erreur) throw new Error(resultat.erreur);
      }
    });

  const motDePasseOublie = () =>
    executer("reinitialisation", async () => {
      if (!email.trim()) throw new Error("Saisissez d'abord votre adresse e-mail.");
      await sendPasswordResetEmail(authFirebase(config), email.trim());
      setEtape("reinitialisation-envoyee");
      setEnCours(null);
    });

  if (etape !== "formulaire") {
    const contenu = {
      "lien-envoye": {
        titre: "Vérifiez votre boîte e-mail",
        texte: `Un lien de connexion vient d'être envoyé à ${email}. Ouvrez-le sur cet appareil pour accéder à ArTova. Pensez à regarder dans les spams.`,
      },
      "verification-envoyee": {
        titre: "Confirmez votre adresse",
        texte: `Un e-mail de confirmation vient d'être envoyé à ${email}. Cliquez sur le lien qu'il contient, puis connectez-vous.`,
      },
      "reinitialisation-envoyee": {
        titre: "E-mail envoyé",
        texte: `Si un mot de passe ArTova est associé à ${email}, un lien pour le réinitialiser vient d'être envoyé. Vous pouvez aussi vous connecter avec un lien e-mail, sans mot de passe.`,
      },
    }[etape];
    return (
      <div className="border border-fil bg-craie p-6 text-center" role="status">
        <p className="font-display text-2xl">{contenu.titre}</p>
        <p className="mt-3 text-sm leading-relaxed text-gris">{contenu.texte}</p>
        <button
          type="button"
          onClick={() => setEtape("formulaire")}
          className="mt-6 text-[12px] uppercase tracking-[0.16em] underline underline-offset-4"
        >
          Revenir
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => avecFournisseur("google")}
          disabled={enCours !== null}
          className={`${boutonSocial} border border-[#747775] bg-white text-[#1f1f1f] hover:bg-[#f2f2f2]`}
        >
          <LogoGoogle />
          {enCours === "google" ? "Connexion…" : "Continuer avec Google"}
        </button>
        {/* Dans l'app iOS, Apple impose « Se connecter avec Apple » dès qu'une
            connexion Google est proposée (règle 4.8). */}
        {(config.apple || appIos) && (
          <button
            type="button"
            onClick={() => avecFournisseur("apple")}
            disabled={enCours !== null}
            className={`${boutonSocial} bg-black text-white hover:bg-[#2b2b2b]`}
          >
            <LogoApple />
            {enCours === "apple" ? "Connexion…" : "Continuer avec Apple"}
          </button>
        )}
      </div>

      <div className="my-8 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-gris">
        <span className="h-px flex-1 bg-fil" />
        ou avec votre e-mail
        <span className="h-px flex-1 bg-fil" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (avecMotDePasse) avecMdp();
          else envoyerLien();
        }}
        className="space-y-6"
      >
        {inscription && (
          <div>
            <label htmlFor="fb-nom" className={libelle}>Nom complet</label>
            <input
              id="fb-nom"
              type="text"
              autoComplete="name"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className={champ}
            />
          </div>
        )}
        <div>
          <label htmlFor="fb-email" className={libelle}>Adresse e-mail</label>
          <input
            id="fb-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={champ}
          />
        </div>
        {avecMotDePasse && (
          <div>
            <label htmlFor="fb-mdp" className={libelle}>
              {inscription ? "Choisissez un mot de passe (8 caractères min.)" : "Mot de passe"}
            </label>
            <input
              id="fb-mdp"
              type="password"
              autoComplete={inscription ? "new-password" : "current-password"}
              minLength={inscription ? 8 : undefined}
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={champ}
            />
            {!inscription && (
              <button
                type="button"
                onClick={motDePasseOublie}
                className="mt-2 text-xs text-gris underline underline-offset-4 hover:text-encre"
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>
        )}

        {erreur && (
          <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            {erreur}
          </p>
        )}

        <button type="submit" disabled={enCours !== null} className={boutonPrincipal}>
          {avecMotDePasse
            ? enCours === "mdp"
              ? "Patientez…"
              : inscription
                ? "Créer mon compte ↗"
                : "Se connecter ↗"
            : enCours === "lien"
              ? "Envoi du lien…"
              : "Recevoir un lien de connexion ↗"}
        </button>
        {!avecMotDePasse && (
          <p className="-mt-2 text-center text-xs text-gris">
            Sans mot de passe : un clic sur le lien reçu par e-mail suffit.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setAvecMotDePasse((v) => !v);
            setErreur(null);
          }}
          className="block w-full text-center text-[12px] uppercase tracking-[0.14em] text-gris underline-offset-4 hover:text-encre hover:underline"
        >
          {avecMotDePasse ? "Plutôt recevoir un lien par e-mail" : "Utiliser un mot de passe"}
        </button>
      </form>
    </div>
  );
}

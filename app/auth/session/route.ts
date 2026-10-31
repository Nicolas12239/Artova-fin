import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, optionsCookieSession, signSession } from "@/lib/auth";
import { cheminSur, utilisateurPourIdentite, verifierJeton } from "@/lib/firebase-auth";
import { estSousLimite } from "@/lib/rate-limit";

// Échange un ID token Firebase (Google, Apple, lien e-mail ou mot de passe)
// contre la session ArTova habituelle.
export async function POST(request: NextRequest) {
  // Derrière le proxy Railway, l'hôte public peut n'apparaître que dans
  // x-forwarded-host ou SITE_URL.
  const origine = request.headers.get("origin");
  const hotesAutorises = new Set(
    [
      request.headers.get("host"),
      request.headers.get("x-forwarded-host"),
      process.env.SITE_URL ? new URL(process.env.SITE_URL).host : null,
    ].filter(Boolean),
  );
  if (origine && !hotesAutorises.has(new URL(origine).host)) {
    return NextResponse.json({ erreur: "Origine refusée." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!estSousLimite(`session-firebase:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { erreur: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  let corps: { idToken?: unknown; next?: unknown; nom?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête invalide." }, { status: 400 });
  }
  if (typeof corps.idToken !== "string") {
    return NextResponse.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  try {
    const identite = await verifierJeton(corps.idToken);
    const utilisateur = await utilisateurPourIdentite(
      identite,
      typeof corps.nom === "string" ? corps.nom : null,
    );
    const next = cheminSur(corps.next);
    const redirection =
      next === "/" && utilisateur.role === "artiste" ? "/espace-artiste" : next;

    const reponse = NextResponse.json({ redirection });
    reponse.cookies.set(COOKIE_SESSION, await signSession(utilisateur), optionsCookieSession());
    return reponse;
  } catch (erreur) {
    const code = erreur instanceof Error ? erreur.message : "";
    if (code === "email-non-verifie") {
      return NextResponse.json(
        { erreur: "Confirmez d'abord votre adresse e-mail grâce au lien reçu.", code },
        { status: 403 },
      );
    }
    console.error("[ArTova] Session Firebase refusée :", erreur);
    return NextResponse.json(
      { erreur: "La connexion n'a pas abouti. Veuillez réessayer." },
      { status: 401 },
    );
  }
}

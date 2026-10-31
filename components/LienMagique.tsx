"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import {
  CLE_EMAIL_LIEN,
  CLE_NOM_LIEN,
  authFirebase,
  messageErreur,
  ouvrirSession,
} from "./AuthFirebase";
import type { ConfigFirebase } from "@/lib/firebase-auth";

function lireStockage(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

type Diagnostic = "verification" | "email-requis" | "invalide" | "automatique";

const sansAbonnement = () => () => {};

export function LienMagique({ config, next }: { config: ConfigFirebase; next?: string }) {
  // L'URL et le stockage local ne changent pas pendant la visite : lecture
  // directe côté navigateur, « verification » pendant le rendu serveur.
  const diagnostic = useSyncExternalStore<Diagnostic>(
    sansAbonnement,
    () => {
      if (!isSignInWithEmailLink(authFirebase(config), window.location.href)) return "invalide";
      // Lien ouvert sur un autre appareil : Firebase exige de ressaisir l'adresse.
      return lireStockage(CLE_EMAIL_LIEN) ? "automatique" : "email-requis";
    },
    () => "verification",
  );
  const [echec, setEchec] = useState(false);
  const etat = echec
    ? "erreur"
    : diagnostic === "automatique"
      ? "verification"
      : diagnostic;
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const lance = useRef(false);

  async function finaliser(adresse: string) {
    setEnCours(true);
    setErreur(null);
    try {
      const auth = authFirebase(config);
      const { user } = await signInWithEmailLink(auth, adresse, window.location.href);
      const nom = lireStockage(CLE_NOM_LIEN);
      try {
        window.localStorage.removeItem(CLE_EMAIL_LIEN);
        window.localStorage.removeItem(CLE_NOM_LIEN);
      } catch {
        // sans conséquence
      }
      await ouvrirSession(auth, user, next, nom);
    } catch (e) {
      setErreur(messageErreur(e));
      setEchec(true);
      setEnCours(false);
    }
  }

  useEffect(() => {
    if (diagnostic !== "automatique" || lance.current) return;
    lance.current = true;
    void finaliser(lireStockage(CLE_EMAIL_LIEN) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnostic]);

  if (etat === "verification") {
    return <p className="text-center text-sm text-gris" role="status">Connexion en cours…</p>;
  }

  if (etat === "invalide" || (etat === "erreur" && !email)) {
    return (
      <div className="text-center">
        <p role="alert" className="text-sm text-terracotta">
          {erreur ?? "Ce lien de connexion n'est pas valide ou a expiré."}
        </p>
        <Link
          href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}
          className="mt-6 inline-block text-[12px] uppercase tracking-[0.16em] underline underline-offset-4"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void finaliser(email.trim());
      }}
      className="space-y-6"
    >
      <p className="text-sm leading-relaxed text-gris">
        Pour des raisons de sécurité, confirmez l&apos;adresse e-mail à laquelle
        vous avez reçu ce lien.
      </p>
      <div>
        <label htmlFor="email-lien" className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-gris">
          Adresse e-mail
        </label>
        <input
          id="email-lien"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-encre/30 bg-transparent py-3 text-sm outline-none focus:border-encre"
        />
      </div>
      {erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {erreur}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="w-full bg-encre px-6 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:opacity-50"
      >
        {enCours ? "Connexion…" : "Me connecter ↗"}
      </button>
    </form>
  );
}

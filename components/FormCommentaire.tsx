"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { commenter } from "@/app/actions/actualites";

export function FormCommentaire({
  actualiteId,
  connecte,
  chemin,
}: {
  actualiteId: number;
  connecte: boolean;
  chemin: string;
}) {
  const [etat, action, enCours] = useActionState(commenter.bind(null, actualiteId), null);
  const formulaire = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (etat?.succes) formulaire.current?.reset();
  }, [etat]);

  if (!connecte) {
    return (
      <p className="border border-fil bg-craie p-5 text-sm leading-relaxed text-encre/80">
        La lecture est libre. Pour commenter et aimer une actualité,{" "}
        <Link href={`/connexion?next=${encodeURIComponent(chemin)}`} className="underline underline-offset-4 hover:text-terracotta">
          connectez-vous
        </Link>{" "}
        ou{" "}
        <Link href={`/inscription?next=${encodeURIComponent(chemin)}`} className="underline underline-offset-4 hover:text-terracotta">
          créez un compte
        </Link>
        , c&apos;est gratuit.
      </p>
    );
  }

  return (
    <form ref={formulaire} action={action} className="space-y-3">
      <label htmlFor="texte-commentaire" className="block text-sm text-encre/80">
        Votre commentaire
      </label>
      <textarea
        id="texte-commentaire"
        name="texte"
        rows={4}
        required
        minLength={2}
        maxLength={1000}
        placeholder="Qu'en pensez-vous ? Restez courtois : les propos injurieux sont retirés."
        className="w-full border border-encre/25 bg-creme px-4 py-3 text-sm outline-none transition-colors focus:border-terracotta"
      />
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      {etat?.succes && (
        <p role="status" className="border-l-2 border-[#3f7d4e] pl-3 text-sm">
          {etat.succes}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="bg-encre px-6 py-3 text-sm tracking-wide text-creme transition-colors hover:bg-terracotta disabled:opacity-50"
      >
        {enCours ? "Publication…" : "Publier le commentaire"}
      </button>
    </form>
  );
}

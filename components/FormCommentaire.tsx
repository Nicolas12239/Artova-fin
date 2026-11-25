"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { commenter } from "@/app/actions/actualites";
import type { Langue, TextesActualites } from "@/lib/actualites-i18n";

export function FormCommentaire({
  actualiteId,
  connecte,
  chemin,
  textes,
  langue = "fr",
}: {
  actualiteId: number;
  connecte: boolean;
  chemin: string;
  textes: Pick<
    TextesActualites,
    "commentaireLabel" | "commentairePlaceholder" | "commentairePublier" | "commentairePublication" | "invite" | "seConnecter" | "creerCompte"
  >;
  langue?: Langue;
}) {
  const [etat, action, enCours] = useActionState(commenter.bind(null, actualiteId, langue), null);
  const formulaire = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (etat?.succes) formulaire.current?.reset();
  }, [etat]);

  if (!connecte) {
    const [avant, reste] = textes.invite.split("{connexion}");
    const [milieu, fin] = (reste ?? "").split("{inscription}");
    return (
      <p className="border border-fil bg-craie p-5 text-sm leading-relaxed text-encre/80">
        {avant}
        <Link href={`/connexion?next=${encodeURIComponent(chemin)}`} className="underline underline-offset-4 hover:text-terracotta">
          {textes.seConnecter}
        </Link>
        {milieu}
        <Link href={`/inscription?next=${encodeURIComponent(chemin)}`} className="underline underline-offset-4 hover:text-terracotta">
          {textes.creerCompte}
        </Link>
        {fin}
      </p>
    );
  }

  return (
    <form ref={formulaire} action={action} className="space-y-3">
      <label htmlFor="texte-commentaire" className="block text-sm text-encre/80">
        {textes.commentaireLabel}
      </label>
      <textarea
        id="texte-commentaire"
        name="texte"
        rows={4}
        required
        minLength={2}
        maxLength={1000}
        placeholder={textes.commentairePlaceholder}
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
        {enCours ? textes.commentairePublication : textes.commentairePublier}
      </button>
    </form>
  );
}

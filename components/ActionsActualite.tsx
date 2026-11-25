"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerLike } from "@/app/actions/actualites";
import { IconeBulle, IconeCoeur } from "./IconesActualite";
import { nombre, type Langue, type TextesActualites } from "@/lib/actualites-i18n";

const bouton =
  "inline-flex items-center gap-2 border border-fil px-4 py-2.5 text-sm text-encre/85 transition-colors hover:border-encre hover:text-encre";

const peutPartagerNatif = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const jamais = () => () => {};

export function ActionsActualite({
  id,
  titre,
  resume,
  chemin,
  connecte,
  aimeInitial,
  likesInitial,
  nbCommentaires,
  textes,
  langue = "fr",
}: {
  id: number;
  titre: string;
  resume: string;
  chemin: string;
  connecte: boolean;
  aimeInitial: boolean;
  likesInitial: number;
  nbCommentaires: number;
  textes: Pick<TextesActualites, "jaime" | "vous_aimez" | "partager" | "partagerNatif" | "copierLien" | "lienCopie" | "nbCommentaires">;
  langue?: Langue;
}) {
  const router = useRouter();
  const [aime, setAime] = useState(aimeInitial);
  const [likes, setLikes] = useState(likesInitial);
  const [, demarrer] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  // Faux côté serveur, vrai sur les navigateurs qui ouvrent la feuille de partage.
  const natif = useSyncExternalStore(jamais, peutPartagerNatif, () => false);

  // Vide côté serveur : les liens de partage sont complétés dès l'affichage dans le
  // navigateur, sans écart entre le rendu serveur et le rendu client.
  const origine = useSyncExternalStore(jamais, () => window.location.origin, () => "");
  const vers = `/connexion?next=${encodeURIComponent(chemin)}`;
  const adresse = () => new URL(chemin, window.location.origin).toString();

  function aimer() {
    if (!connecte) {
      router.push(vers);
      return;
    }
    const avant = { aime, likes };
    setAime(!aime);
    setLikes(likes + (aime ? -1 : 1));
    setInfo(null);
    demarrer(async () => {
      const r = await basculerLike(id, langue);
      if (r.erreur === "connexion") {
        setAime(avant.aime);
        setLikes(avant.likes);
        router.push(vers);
      } else if (r.erreur) {
        setAime(avant.aime);
        setLikes(avant.likes);
        setInfo(r.erreur);
      } else {
        setAime(Boolean(r.aime));
        setLikes(r.total ?? 0);
      }
    });
  }

  async function partagerNatif() {
    try {
      await navigator.share({ title: titre, text: resume, url: adresse() });
    } catch {
      // partage annulé
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(adresse());
      setInfo(textes.lienCopie);
    } catch {
      setInfo(adresse());
    }
  }

  const texte = encodeURIComponent(titre);
  const lien = (cible: "wa" | "fb" | "x") => {
    if (!origine) return "#";
    const u = encodeURIComponent(new URL(chemin, origine).toString());
    if (cible === "wa") return `https://wa.me/?text=${texte}%20${u}`;
    if (cible === "fb") return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    return `https://twitter.com/intent/tweet?text=${texte}&url=${u}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={aimer}
          aria-pressed={aime}
          className={`${bouton} ${aime ? "border-terracotta text-terracotta hover:border-terracotta hover:text-terracotta" : ""}`}
        >
          <IconeCoeur plein={aime} className="h-[18px] w-[18px]" />
          {aime ? textes.vous_aimez : textes.jaime} · {likes}
        </button>
        <a href="#commentaires" className={bouton}>
          <IconeBulle className="h-[18px] w-[18px]" />
          {nombre(textes.nbCommentaires, nbCommentaires)}
        </a>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="text-gris">{textes.partager}</span>
        {natif && (
          <button type="button" onClick={partagerNatif} className="underline underline-offset-4 hover:text-terracotta">
            {textes.partagerNatif}
          </button>
        )}
        <a href={lien("wa")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-terracotta">
          WhatsApp
        </a>
        <a href={lien("fb")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-terracotta">
          Facebook
        </a>
        <a href={lien("x")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-terracotta">
          X
        </a>
        <button type="button" onClick={copier} className="underline underline-offset-4 hover:text-terracotta">
          {textes.copierLien}
        </button>
      </div>
      {info && (
        <p role="status" className="mt-4 border-l-2 border-terracotta pl-3 text-sm text-encre/80">
          {info}
        </p>
      )}
    </div>
  );
}

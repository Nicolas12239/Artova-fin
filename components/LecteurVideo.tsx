"use client";

import { useState } from "react";
import type { VideoIntegree } from "@/lib/actualites-commun";

const NOMS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;

function taille(v: VideoIntegree): string {
  if (v.plateforme === "tiktok") return "h-[740px] w-[325px] max-w-full";
  if (v.plateforme === "instagram" && v.profil) return "h-[780px] w-[540px] max-w-full";
  if (v.plateforme === "instagram") return "h-[640px] w-[400px] max-w-full";
  return "aspect-video w-full";
}

// Lecteur « à la demande » : une vignette avec bouton de lecture, et l'intégration
// (lourde) ne se charge qu'au clic. La page s'ouvre plus vite, surtout sur mobile.
export function LecteurVideo({ video, titre, libelleLire, titreIframe }: { video: VideoIntegree; titre: string; libelleLire: string; titreIframe: string }) {
  const [actif, setActif] = useState(false);
  const identifiant = video.plateforme === "youtube" ? /embed\/([\w-]+)/.exec(video.lecteur)?.[1] : null;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-encre ${taille(video)}`}>
      {actif ? (
        <iframe
          src={video.lecteur}
          title={titreIframe}
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0 bg-panel"
        />
      ) : (
        <button type="button" onClick={() => setActif(true)} aria-label={`${libelleLire} : ${titre}`} className="group absolute inset-0 flex items-center justify-center">
          {identifiant && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://i.ytimg.com/vi/${identifiant}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            />
          )}
          {!identifiant && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-terracotta via-encre to-encre" />}
          <span className="relative flex flex-col items-center gap-3 text-craie">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-craie text-encre transition-transform duration-200 ease-out group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 translate-x-0.5" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
            </span>
            <span className="text-sm font-medium">{NOMS[video.plateforme]}</span>
          </span>
        </button>
      )}
    </div>
  );
}

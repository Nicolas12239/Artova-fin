"use client";

import { useEffect, useRef } from "react";

// Motion design « Comment ça marche » (rendu avec Remotion, sans son).
// Lecture automatique en sourdine, sauf si le visiteur préfère réduire les animations.
export function VideoExplication() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {
      // Lecture refusée (économie de données, navigateur) : les contrôles restent disponibles.
    });
  }, []);

  return (
    <figure className="mx-auto w-full max-w-[560px]">
      <video
        ref={ref}
        src="/videos/comment-ca-marche.mp4"
        poster="/videos/comment-ca-marche.jpg"
        muted
        loop
        playsInline
        controls
        preload="metadata"
        width={1080}
        height={1080}
        className="aspect-square w-full bg-creme shadow-[0_24px_60px_rgba(70,45,30,0.18)]"
        aria-label="Animation : comment découvrir et commander une œuvre sur ArTova"
      />
      <figcaption className="mt-3 text-[13px] text-gris">
        Comment découvrir et commander une œuvre sur ArTova, en 20 secondes.
      </figcaption>
    </figure>
  );
}

"use client";

import { useEffect, useRef } from "react";

// Fine barre de lecture collée en haut de l'écran : elle se remplit avec le défilement.
export function ProgressionLecture() {
  const barre = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let image = 0;
    const maj = () => {
      image = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
      if (barre.current) barre.current.style.transform = `scaleX(${p})`;
    };
    const defile = () => {
      if (!image) image = requestAnimationFrame(maj);
    };
    maj();
    window.addEventListener("scroll", defile, { passive: true });
    window.addEventListener("resize", defile);
    return () => {
      window.removeEventListener("scroll", defile);
      window.removeEventListener("resize", defile);
      if (image) cancelAnimationFrame(image);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div ref={barre} className="h-full origin-left scale-x-0 bg-terracotta" />
    </div>
  );
}

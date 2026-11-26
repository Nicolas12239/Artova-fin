"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Lien du menu principal : page courante soulignée, soulignement qui s'anime au survol.
export function LienNav({ href, children }: { href: string; children: ReactNode }) {
  const chemin = usePathname();
  const base = href.split("#")[0].split("?")[0] || "/";
  const actif = href.includes("#") ? false : base === "/" ? chemin === "/" : chemin === base || chemin.startsWith(`${base}/`);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`group relative inline-flex min-h-11 items-center font-display text-[18px] font-medium transition-colors ${actif ? "text-encre" : "text-encre/90 hover:text-encre"}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-2 h-px origin-left bg-terracotta transition-transform duration-200 ease-out ${actif ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
      />
    </Link>
  );
}

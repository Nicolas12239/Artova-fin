"use client";

import { useState } from "react";
import Link from "next/link";
import { deconnecter } from "@/app/actions/auth";

export function MenuMobile({
  liens,
  connecte = false,
  contact,
}: {
  liens: { href: string; label: string }[];
  connecte?: boolean;
  contact?: { email: string; tiktok: string; instagram: string };
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-encre/25 bg-craie"
      >
        <span
          className={`block h-px w-5 bg-encre transition-transform ${ouvert ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-5 bg-encre transition-transform ${ouvert ? "-translate-y-[3px] -rotate-45" : ""}`}
        />
      </button>
      {ouvert && (
        <nav
          aria-label="Navigation mobile"
          className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto overscroll-contain bg-craie"
        >
          <ul className="flex flex-col px-6 pb-6 pt-10">
            {liens.map((lien) => (
              <li key={`${lien.href}-${lien.label}`}>
                <Link
                  href={lien.href}
                  onClick={() => setOuvert(false)}
                  className="block border-b border-fil py-4 font-display text-2xl"
                >
                  {lien.label}
                </Link>
              </li>
            ))}
            {connecte && (
              <li>
                <form action={deconnecter}>
                  <button
                    type="submit"
                    className="block w-full border-b border-fil py-4 text-left font-display text-2xl"
                  >
                    Se déconnecter
                  </button>
                </form>
              </li>
            )}
          </ul>
          {contact && (
            <div className="space-y-3 px-6 pb-10 text-sm text-gris">
              <a href={`mailto:${contact.email}`} className="block break-all underline underline-offset-4">
                {contact.email}
              </a>
              <div className="flex gap-6 text-[12px] uppercase tracking-[0.16em] text-encre">
                <a href={contact.tiktok} target="_blank" rel="noopener noreferrer">TikTok ↗</a>
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
              </div>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

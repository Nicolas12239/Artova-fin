"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InvitationInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CLE_REFUS = "artova_installation_refusee";

export function EnregistrerServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Sans service worker, le site fonctionne normalement.
    });
  }, []);
  return null;
}

const sansAbonnement = () => () => {};

function plateforme(): "ios" | "autre" | "installee" {
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    return "installee";
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "autre";
}

function refusRecent(): boolean {
  try {
    const date = Number(window.localStorage.getItem(CLE_REFUS));
    return Boolean(date) && Date.now() - date < 14 * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

// Bandeau discret en bas d'écran, sur mobile uniquement : bouton
// d'installation (Android, Chrome) ou marche à suivre (iPhone, Safari).
export function BandeauInstallation() {
  const environnement = useSyncExternalStore(
    sansAbonnement,
    () => (refusRecent() ? "masque" : plateforme()),
    () => "masque" as const,
  );
  const [invitation, setInvitation] = useState<InvitationInstallation | null>(null);
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    const capter = (e: Event) => {
      e.preventDefault();
      setInvitation(e as InvitationInstallation);
    };
    window.addEventListener("beforeinstallprompt", capter);
    return () => window.removeEventListener("beforeinstallprompt", capter);
  }, []);

  const fermer = () => {
    try {
      window.localStorage.setItem(CLE_REFUS, String(Date.now()));
    } catch {
      // sans conséquence
    }
    setFerme(true);
  };

  if (ferme || environnement === "masque" || environnement === "installee") return null;
  if (environnement === "autre" && !invitation) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application ArTova"
      className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-4 border border-fil bg-craie p-4 shadow-[0_12px_32px_rgba(27,26,23,0.18)] md:hidden"
    >
      <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 border border-fil" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight">L&apos;application ArTova</p>
        {environnement === "ios" ? (
          <p className="mt-1 text-xs leading-snug text-gris">
            Touchez <span aria-label="Partager">⎋ Partager</span> puis « Sur l&apos;écran
            d&apos;accueil ».
          </p>
        ) : (
          <p className="mt-1 text-xs text-gris">Accès direct depuis votre écran d&apos;accueil.</p>
        )}
      </div>
      {environnement !== "ios" && invitation && (
        <button
          type="button"
          onClick={async () => {
            await invitation.prompt();
            await invitation.userChoice;
            setInvitation(null);
            setFerme(true);
          }}
          className="shrink-0 bg-encre px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-craie"
        >
          Installer
        </button>
      )}
      <button
        type="button"
        onClick={fermer}
        aria-label="Fermer"
        className="shrink-0 px-1 text-xl leading-none text-gris"
      >
        ×
      </button>
    </div>
  );
}

export function BoutonReessayer() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-8 bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie"
    >
      Réessayer
    </button>
  );
}

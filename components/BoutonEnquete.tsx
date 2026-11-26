"use client";

import { useActionState } from "react";
import { approfondirActualite, type EtatActualite } from "@/app/actions/actualites";

// Réservé à l'administration : relance la recherche (noms, rôles, photos, vidéos).
export function BoutonEnquete({ id }: { id: number }) {
  const [etat, action, enCours] = useActionState<EtatActualite>(() => approfondirActualite(id), null);
  return (
    <form action={action} className="mb-8 rounded-2xl border border-dashed border-terracotta/50 bg-craie p-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-encre px-5 py-2.5 text-sm font-medium text-creme transition-colors hover:bg-terracotta disabled:opacity-50"
        >
          {enCours ? "Recherche en cours (jusqu'à une minute)…" : "Approfondir l'enquête de cet article"}
        </button>
        <span className="text-xs text-gris">Administration : cherche les noms, rôles, photos et vidéos de l&apos;événement.</span>
      </div>
      {etat?.erreur && <p role="alert" className="mt-3 text-terracotta">{etat.erreur}</p>}
      {etat?.succes && <p role="status" className="mt-3">{etat.succes}</p>}
    </form>
  );
}

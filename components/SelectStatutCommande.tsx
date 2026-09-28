"use client";

import { changerStatutCommande } from "@/app/actions/admin";
import { LIBELLE_STATUT_COMMANDE } from "@/lib/types";

export function SelectStatutCommande({
  commandeId,
  statut,
}: {
  commandeId: number;
  statut: string;
}) {
  return (
    <form
      action={changerStatutCommande.bind(null, commandeId)}
      className="flex items-center gap-2"
    >
      <select
        name="statut"
        defaultValue={statut}
        aria-label={`Statut de la commande ${commandeId}`}
        className="border border-encre/25 bg-creme px-2 py-1 text-xs outline-none focus:border-terracotta"
      >
        {Object.entries(LIBELLE_STATUT_COMMANDE).map(([valeur, label]) => (
          <option key={valeur} value={valeur}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="border border-encre/30 px-2 py-1 text-xs tracking-wide transition-colors hover:border-terracotta hover:text-terracotta"
      >
        OK
      </button>
    </form>
  );
}

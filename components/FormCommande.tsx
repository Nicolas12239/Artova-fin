"use client";

import { useActionState } from "react";
import { passerCommande } from "@/app/actions/commande";

const champ =
  "w-full border-b border-encre/30 bg-transparent py-3 text-sm outline-none transition-colors focus:border-encre";
const libelle = "mb-1 block text-[11px] uppercase tracking-[0.18em] text-gris";

export function FormCommande({
  oeuvreId,
  telephoneInitial,
}: {
  oeuvreId: number;
  telephoneInitial?: string | null;
}) {
  const [etat, action, enCours] = useActionState(
    passerCommande.bind(null, oeuvreId),
    null,
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="telephone" className={libelle}>Téléphone de contact</label>
        <input
          id="telephone"
          name="telephone"
          type="tel"
          autoComplete="tel"
          required
          defaultValue={telephoneInitial ?? ""}
          className={champ}
        />
      </div>
      <div>
        <label htmlFor="ville" className={libelle}>Ville</label>
        <input id="ville" name="ville" type="text" required defaultValue="" className={champ} />
      </div>
      <div>
        <label htmlFor="adresse" className={libelle}>Adresse de livraison (facultatif)</label>
        <textarea id="adresse" name="adresse" rows={3} defaultValue="" className={champ} />
      </div>
      <div>
        <label htmlFor="message" className={libelle}>Message à l'artiste (facultatif)</label>
        <textarea id="message" name="message" rows={3} defaultValue="" className={champ} />
      </div>
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="w-full bg-encre px-6 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:opacity-50"
      >
        {enCours ? "Envoi…" : "Confirmer la commande ↗"}
      </button>
    </form>
  );
}

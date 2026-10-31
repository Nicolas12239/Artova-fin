"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { supprimerArtiste } from "@/app/actions/admin";

function BoutonConfirmer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-terracotta px-3 py-1 text-xs tracking-wide text-creme hover:bg-encre disabled:opacity-50"
    >
      {pending ? "Suppression…" : "Supprimer définitivement"}
    </button>
  );
}

// Suppression en deux temps : un clic involontaire ne supprime rien.
export function SupprimerArtiste({ id, nom }: { id: number; nom: string }) {
  const [confirmation, setConfirmation] = useState(false);
  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="text-xs tracking-wide text-terracotta/80 underline-offset-4 hover:text-terracotta hover:underline"
      >
        Supprimer
      </button>
    );
  }
  return (
    <form
      action={supprimerArtiste.bind(null, id)}
      className="flex w-full flex-wrap items-center justify-end gap-3 border-t border-terracotta/30 pt-3"
    >
      <span className="text-xs text-terracotta">
        Supprimer {nom}, ses œuvres et son compte ?
      </span>
      <BoutonConfirmer />
      <button
        type="button"
        onClick={() => setConfirmation(false)}
        className="text-xs tracking-wide text-encre/60 hover:text-encre"
      >
        Annuler
      </button>
    </form>
  );
}

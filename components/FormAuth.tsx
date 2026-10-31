"use client";

import { useActionState } from "react";
import { connecter, inscrire } from "@/app/actions/auth";
import { COMMISSION_ARTOVA } from "@/lib/types";

const champ =
  "w-full border-b border-encre/30 bg-transparent py-3 text-sm outline-none transition-colors focus:border-encre";
const libelle = "mb-1 block text-[11px] uppercase tracking-[0.18em] text-gris";
const bouton =
  "w-full bg-encre px-6 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:opacity-50";

export function FormConnexion({ next }: { next?: string }) {
  const [etat, action, enCours] = useActionState(connecter, null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className={libelle}>Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={champ}
        />
      </div>
      <div>
        <label htmlFor="mot_de_passe" className={libelle}>Mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
          className={champ}
        />
      </div>
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Connexion…" : "Se connecter ↗"}
      </button>
    </form>
  );
}

export function FormInscription({ next }: { next?: string }) {
  const [etat, action, enCours] = useActionState(inscrire, null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="nom" className={libelle}>Nom complet</label>
        <input id="nom" name="nom" type="text" autoComplete="name" required className={champ} />
      </div>
      <div>
        <label htmlFor="email" className={libelle}>Adresse e-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={champ} />
      </div>
      <div>
        <label htmlFor="telephone" className={libelle}>Téléphone (facultatif)</label>
        <input id="telephone" name="telephone" type="tel" autoComplete="tel" className={champ} />
      </div>
      <div>
        <label htmlFor="mot_de_passe" className={libelle}>Mot de passe (8 caractères min.)</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={champ}
        />
      </div>
      <div>
        <label htmlFor="confirmation" className={libelle}>Confirmer le mot de passe</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={champ}
        />
      </div>
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Création…" : "Créer mon compte ↗"}
      </button>
    </form>
  );
}

export function EncartCommission({ avecAcceptation = false }: { avecAcceptation?: boolean }) {
  return (
    <div className="border border-fil bg-craie p-5">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-4xl leading-none text-terracotta">
          {COMMISSION_ARTOVA} %
        </span>
        <p className="text-[11px] uppercase tracking-[0.18em] text-gris">
          Commission ArTova
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-encre/80">
        ArTova prélève une commission de {COMMISSION_ARTOVA} % sur le prix de
        chaque œuvre vendue via la plateforme. Vous percevez{" "}
        {100 - COMMISSION_ARTOVA} % du prix affiché : promotion, mise en
        relation avec les collectionneurs et suivi des commandes sont inclus.
      </p>
      {avecAcceptation && (
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="commission"
            value="1"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#a65a41]"
          />
          <span>
            J&apos;ai pris connaissance de la commission de {COMMISSION_ARTOVA} %
            et je l&apos;accepte.
          </span>
        </label>
      )}
    </div>
  );
}

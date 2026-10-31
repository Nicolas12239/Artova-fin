"use client";

import { useEnvoiAvecImages } from "./envoiImages";
import { enregistrerArtiste, enregistrerOeuvre } from "@/app/actions/admin";

const champ =
  "w-full border border-encre/25 bg-creme px-4 py-3 text-sm outline-none transition-colors focus:border-terracotta";
const libelle = "mb-1 block text-xs tracking-wide text-encre/70";
const bouton =
  "bg-encre px-6 py-3 text-sm tracking-wide text-creme transition-colors hover:bg-terracotta disabled:opacity-50";

export type ArtisteInitial = {
  id: number;
  nom: string;
  discipline: string;
  ville: string | null;
  histoire: string;
  note_univers: string | null;
  theme_primaire: string;
  theme_accent: string;
  theme_fond: string;
  motif: string;
};

export function FormAdminArtiste({ initial }: { initial?: ArtisteInitial }) {
  const { etat, onSubmit, enCours } = useEnvoiAvecImages(enregistrerArtiste, { viderApresSucces: !initial });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className={libelle}>Nom de l'artiste</label>
          <input id="nom" name="nom" type="text" required defaultValue={initial?.nom} className={champ} />
        </div>
        <div>
          <label htmlFor="discipline" className={libelle}>Discipline</label>
          <select
            id="discipline"
            name="discipline"
            required
            defaultValue={initial?.discipline ?? "peintre"}
            className={champ}
          >
            <option value="peintre">Peintre</option>
            <option value="plasticien">Plasticien·ne</option>
            <option value="sculpteur">Sculpteur</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="ville" className={libelle}>Ville</label>
        <input id="ville" name="ville" type="text" defaultValue={initial?.ville ?? ""} className={champ} />
      </div>
      <div>
        <label htmlFor="histoire" className={libelle}>Son histoire</label>
        <textarea id="histoire" name="histoire" rows={6} required defaultValue={initial?.histoire} className={champ} />
      </div>
      <div>
        <label htmlFor="note_univers" className={libelle}>Note d'univers (une phrase)</label>
        <input
          id="note_univers"
          name="note_univers"
          type="text"
          maxLength={255}
          defaultValue={initial?.note_univers ?? ""}
          className={champ}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="theme_primaire" className={libelle}>Couleur principale</label>
          <input
            id="theme_primaire"
            name="theme_primaire"
            type="color"
            defaultValue={initial?.theme_primaire ?? "#1E2A78"}
            className="h-11 w-full cursor-pointer border border-encre/25 bg-creme p-1"
          />
        </div>
        <div>
          <label htmlFor="theme_accent" className={libelle}>Couleur d'accent</label>
          <input
            id="theme_accent"
            name="theme_accent"
            type="color"
            defaultValue={initial?.theme_accent ?? "#D9A441"}
            className="h-11 w-full cursor-pointer border border-encre/25 bg-creme p-1"
          />
        </div>
        <div>
          <label htmlFor="theme_fond" className={libelle}>Fond de page</label>
          <input
            id="theme_fond"
            name="theme_fond"
            type="color"
            defaultValue={initial?.theme_fond ?? "#F4F0E6"}
            className="h-11 w-full cursor-pointer border border-encre/25 bg-creme p-1"
          />
        </div>
        <div>
          <label htmlFor="motif" className={libelle}>Motif décoratif</label>
          <select id="motif" name="motif" required defaultValue={initial?.motif ?? "pinceau"} className={champ}>
            <option value="pinceau">Pinceau</option>
            <option value="collage">Collage</option>
            <option value="pierre">Pierre</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="portrait" className={libelle}>
          Portrait {initial ? "(laisser vide pour conserver l'actuel)" : "(requis)"}
        </label>
        <input
          id="portrait"
          name="portrait"
          type="file"
          accept="image/*,.heic,.heif"
          required={!initial}
          className="block w-full text-xs"
        />
      </div>
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      {etat?.succes && <p className="border-l-2 border-encre pl-3 text-sm">{etat.succes}</p>}
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Enregistrement…" : initial ? "Mettre à jour l'artiste" : "Ajouter l'artiste"}
      </button>
    </form>
  );
}

export type OeuvreInitiale = {
  id: number;
  artiste_id: number;
  titre: string;
  type: string;
  prix_fcfa: number;
  annee: number | null;
  dimensions: string | null;
  technique: string | null;
  description: string;
  oeuvre_maitre: number;
  statut: string;
};

export function FormAdminOeuvre({
  artistes,
  initial,
}: {
  artistes: { id: number; nom: string }[];
  initial?: OeuvreInitiale;
}) {
  const { etat, onSubmit, enCours } = useEnvoiAvecImages(enregistrerOeuvre, { viderApresSucces: !initial });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="artiste_id" className={libelle}>Artiste</label>
          <select
            id="artiste_id"
            name="artiste_id"
            required
            defaultValue={initial?.artiste_id ?? ""}
            className={champ}
          >
            <option value="" disabled>Choisir…</option>
            {artistes.map((artiste) => (
              <option key={artiste.id} value={artiste.id}>
                {artiste.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="titre" className={libelle}>Titre de l'œuvre</label>
          <input id="titre" name="titre" type="text" required defaultValue={initial?.titre} className={champ} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className={libelle}>Type</label>
          <select id="type" name="type" required defaultValue={initial?.type ?? "toile"} className={champ}>
            <option value="toile">Toile</option>
            <option value="sculpture">Sculpture</option>
          </select>
        </div>
        <div>
          <label htmlFor="prix_fcfa" className={libelle}>Prix (FCFA)</label>
          <input
            id="prix_fcfa"
            name="prix_fcfa"
            type="number"
            min={1}
            required
            defaultValue={initial?.prix_fcfa}
            className={champ}
          />
        </div>
        <div>
          <label htmlFor="annee" className={libelle}>Année</label>
          <input
            id="annee"
            name="annee"
            type="number"
            min={1900}
            max={2100}
            defaultValue={initial?.annee ?? ""}
            className={champ}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dimensions" className={libelle}>Dimensions</label>
          <input
            id="dimensions"
            name="dimensions"
            type="text"
            defaultValue={initial?.dimensions ?? ""}
            className={champ}
          />
        </div>
        <div>
          <label htmlFor="technique" className={libelle}>Technique</label>
          <input
            id="technique"
            name="technique"
            type="text"
            defaultValue={initial?.technique ?? ""}
            className={champ}
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={libelle}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={initial?.description}
          className={champ}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="statut" className={libelle}>Statut</label>
          <select id="statut" name="statut" defaultValue={initial?.statut ?? "disponible"} className={champ}>
            <option value="disponible">Disponible</option>
            <option value="reserve">Réservée</option>
            <option value="vendu">Vendue</option>
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="oeuvre_maitre"
              value="1"
              defaultChecked={Boolean(initial?.oeuvre_maitre)}
              className="h-4 w-4 accent-[#A65A41]"
            />
            Œuvre maîtresse de l'artiste
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="image" className={libelle}>
          Image {initial ? "(laisser vide pour conserver l'actuelle)" : "(requise)"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*,.heic,.heif"
          required={!initial}
          className="block w-full text-xs"
        />
      </div>
      {etat?.erreur && (
        <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
          {etat.erreur}
        </p>
      )}
      {etat?.succes && <p className="border-l-2 border-encre pl-3 text-sm">{etat.succes}</p>}
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Enregistrement…" : initial ? "Mettre à jour l'œuvre" : "Ajouter l'œuvre"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useEnvoiAvecImages } from "./envoiImages";
import { ajouterSource, collecterMaintenant, publierManuellement } from "@/app/actions/actualites";
import { CATEGORIES, LIBELLE_PORTEE, lirePersonnes, lireTraductions } from "@/lib/actualites-commun";

const champ =
  "w-full border border-encre/25 bg-creme px-4 py-3 text-sm outline-none transition-colors focus:border-terracotta";
const libelle = "mb-1 block text-xs tracking-wide text-encre/70";
const bouton =
  "bg-encre px-6 py-3 text-sm tracking-wide text-creme transition-colors hover:bg-terracotta disabled:opacity-50";

function Retour({ etat }: { etat: { erreur?: string; succes?: string } | null }) {
  if (!etat) return null;
  return etat.erreur ? (
    <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
      {etat.erreur}
    </p>
  ) : etat.succes ? (
    <p role="status" className="border-l-2 border-[#3f7d4e] pl-3 text-sm">
      {etat.succes}
    </p>
  ) : null;
}

export function BoutonCollecte() {
  const [etat, action, enCours] = useActionState(collecterMaintenant, null);
  return (
    <form action={action} className="space-y-3">
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Collecte en cours, jusqu'à une minute…" : "Lancer la collecte maintenant"}
      </button>
      <Retour etat={etat} />
    </form>
  );
}

export interface PublicationInitiale {
  id: number;
  titre: string;
  resume: string;
  contenu: string | null;
  portee: string;
  categorie: string;
  source_nom: string;
  url_source: string | null;
  evenement_debut: string | null;
  evenement_fin: string | null;
  lieu: string | null;
  videos: string | null;
  artiste_slug: string | null;
  images: string | null;
  credit_image: string | null;
  personnes: string | null;
  traductions: string | null;
  a_la_une: number;
}

export function FormPublication({
  initial,
  artistes = [],
}: {
  initial?: PublicationInitiale;
  artistes?: { slug: string; nom: string }[];
}) {
  const { etat, onSubmit, enCours } = useEnvoiAvecImages(publierManuellement, { viderApresSucces: !initial });
  const tr = lireTraductions(initial?.traductions);
  return (
    <form key={initial?.id ?? "nouveau"} onSubmit={onSubmit} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <label htmlFor="pub-titre" className={libelle}>Titre</label>
        <input id="pub-titre" name="titre" type="text" required maxLength={300} defaultValue={initial?.titre} className={champ} />
      </div>
      <div>
        <label htmlFor="pub-resume" className={libelle}>L&apos;essentiel (2 phrases, 600 caractères au plus)</label>
        <textarea id="pub-resume" name="resume" rows={3} required minLength={20} maxLength={600} defaultValue={initial?.resume} className={champ} />
      </div>
      <div>
        <label htmlFor="pub-contenu" className={libelle}>Texte complet (facultatif, séparez les paragraphes par une ligne vide)</label>
        <textarea id="pub-contenu" name="contenu" rows={6} maxLength={20000} defaultValue={initial?.contenu ?? ""} className={champ} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pub-portee" className={libelle}>Zone</label>
          <select id="pub-portee" name="portee" defaultValue={initial?.portee ?? "togo"} className={champ}>
            {Object.entries(LIBELLE_PORTEE).map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>{nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pub-categorie" className={libelle}>Rubrique</label>
          <select id="pub-categorie" name="categorie" defaultValue={initial?.categorie ?? "general"} className={champ}>
            {Object.entries(CATEGORIES).map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>{nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pub-source" className={libelle}>Source (nom)</label>
          <input id="pub-source" name="source_nom" type="text" defaultValue={initial?.source_nom ?? "ArTova"} maxLength={120} className={champ} />
        </div>
        <div>
          <label htmlFor="pub-url" className={libelle}>Lien de la source (Instagram, TikTok, site…)</label>
          <input id="pub-url" name="url_source" type="url" placeholder="https://" defaultValue={initial?.url_source ?? ""} className={champ} />
        </div>
      </div>
      <fieldset className="space-y-4 border border-fil p-4">
        <legend className="px-2 text-xs tracking-wide text-encre/70">Rendez-vous (pour l&apos;agenda de Lomé, facultatif)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pub-debut" className={libelle}>Du</label>
            <input id="pub-debut" name="evenement_debut" type="date" defaultValue={initial?.evenement_debut ?? ""} className={champ} />
          </div>
          <div>
            <label htmlFor="pub-fin" className={libelle}>Au (laisser vide pour un seul jour)</label>
            <input id="pub-fin" name="evenement_fin" type="date" defaultValue={initial?.evenement_fin ?? ""} className={champ} />
          </div>
        </div>
        <div>
          <label htmlFor="pub-lieu" className={libelle}>Lieu</label>
          <input id="pub-lieu" name="lieu" type="text" maxLength={160} placeholder="Galerie, musée, quartier…" defaultValue={initial?.lieu ?? ""} className={champ} />
        </div>
      </fieldset>
      <div>
        <label htmlFor="pub-noms" className={libelle}>
          Noms cités (un par ligne) : chaque nom devient un tag cliquable, relié à la page de l&apos;artiste s&apos;il est sur ArTova
        </label>
        <textarea
          id="pub-noms"
          name="noms"
          rows={4}
          placeholder={"A. Sika\nEli Dush"}
          defaultValue={lirePersonnes(initial?.personnes).map((p) => p.nom).join("\n")}
          className={champ}
        />
      </div>
      <div>
        <label htmlFor="pub-images" className={libelle}>
          Photos supplémentaires (un lien https:// par ligne, jusqu&apos;à huit)
        </label>
        <textarea id="pub-images" name="images" rows={3} placeholder="https://…" defaultValue={initial?.images ?? ""} className={champ} />
      </div>
      <div>
        <label htmlFor="pub-credit" className={libelle}>Crédit des images (nom du média ou du photographe)</label>
        <input id="pub-credit" name="credit_image" type="text" maxLength={160} defaultValue={initial?.credit_image ?? ""} className={champ} />
      </div>
      <details className="border border-fil p-4" open={Boolean(tr.en || tr.de)}>
        <summary className="cursor-pointer text-xs tracking-wide text-encre/70">
          Traductions anglaise et allemande (facultatif : sans traduction, le texte français est affiché)
        </summary>
        <div className="mt-4 space-y-4">
          {(["en", "de"] as const).map((l) => (
            <fieldset key={l} className="space-y-3">
              <legend className="text-xs font-medium tracking-wide">{l === "en" ? "English" : "Deutsch"}</legend>
              <input name={`titre_${l}`} type="text" maxLength={300} placeholder="Titre" defaultValue={tr[l]?.titre ?? ""} className={champ} />
              <textarea name={`resume_${l}`} rows={2} maxLength={600} placeholder="Résumé" defaultValue={tr[l]?.resume ?? ""} className={champ} />
              <textarea name={`contenu_${l}`} rows={4} maxLength={20000} placeholder="Texte complet" defaultValue={tr[l]?.contenu ?? ""} className={champ} />
            </fieldset>
          ))}
        </div>
      </details>
      <div>
        <label htmlFor="pub-videos" className={libelle}>
          Vidéos (un lien par ligne : TikTok, Instagram ou YouTube, jusqu&apos;à six)
        </label>
        <textarea
          id="pub-videos"
          name="videos"
          rows={3}
          placeholder={"https://www.tiktok.com/@artova.corp/video/…\nhttps://www.instagram.com/reel/…"}
          defaultValue={initial?.videos ?? ""}
          className={champ}
        />
      </div>
      <div>
        <label htmlFor="pub-artiste" className={libelle}>Artiste ArTova concerné (affiche un lien vers sa page)</label>
        <select id="pub-artiste" name="artiste_slug" defaultValue={initial?.artiste_slug ?? ""} className={champ}>
          <option value="">Aucun</option>
          {artistes.map((a) => (
            <option key={a.slug} value={a.slug}>{a.nom}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pub-image" className={libelle}>
          Image{initial ? " (laisser vide pour garder l'actuelle)" : ""}
        </label>
        <input id="pub-image" name="image" type="file" accept="image/*" className="block w-full text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="a_la_une" value="1" defaultChecked={initial?.a_la_une === 1} className="h-4 w-4 accent-[#a65a41]" />
        Mettre à la une
      </label>
      <Retour etat={etat} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Enregistrement…" : initial ? "Enregistrer les modifications" : "Publier"}
      </button>
    </form>
  );
}

export function FormSource() {
  const [etat, action, enCours] = useActionState(ajouterSource, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="src-nom" className={libelle}>Nom du média</label>
          <input id="src-nom" name="nom" type="text" required maxLength={120} className={champ} />
        </div>
        <div>
          <label htmlFor="src-url" className={libelle}>Adresse du flux RSS</label>
          <input id="src-url" name="url_flux" type="url" required placeholder="https://monmedia.tg/feed" className={champ} />
        </div>
        <div>
          <label htmlFor="src-portee" className={libelle}>Zone par défaut</label>
          <select id="src-portee" name="portee" defaultValue="togo" className={champ}>
            {Object.entries(LIBELLE_PORTEE).map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>{nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="src-langue" className={libelle}>Langue</label>
          <select id="src-langue" name="langue" defaultValue="fr" className={champ}>
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="filtrer" value="1" defaultChecked className="mt-0.5 h-4 w-4 accent-[#a65a41]" />
        <span>
          Média généraliste : ne garder que ce qui parle d&apos;arts visuels
          <span className="block text-xs text-gris">Décochez pour un média entièrement consacré à l&apos;art.</span>
        </span>
      </label>
      <Retour etat={etat} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Ajout…" : "Ajouter la source"}
      </button>
    </form>
  );
}

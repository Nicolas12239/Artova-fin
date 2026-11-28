"use client";

import { useActionState } from "react";
import { ajouterSourceSociale, importerPublications } from "@/app/actions/actualites";
import { LIBELLE_PORTEE } from "@/lib/actualites-commun";

const champ = "w-full rounded-xl border border-encre/25 bg-creme px-4 py-3 text-[16px] outline-none transition-colors focus:border-terracotta md:text-sm";
const libelle = "mb-1 block text-xs tracking-wide text-encre/70";
const bouton = "min-h-11 rounded-full bg-encre px-6 text-sm font-medium text-creme transition-colors hover:bg-terracotta disabled:opacity-50";

function Retour({ etat }: { etat: { erreur?: string; succes?: string } | null }) {
  if (!etat) return null;
  const texte = etat.erreur ?? etat.succes;
  if (!texte) return null;
  return (
    <ul role={etat.erreur ? "alert" : "status"} className={`space-y-1 border-l-2 pl-3 text-sm ${etat.erreur ? "border-terracotta text-terracotta" : "border-[#3f7d4e]"}`}>
      {texte.split(" · ").map((l) => (
        <li key={l} className="break-words">{l}</li>
      ))}
    </ul>
  );
}

// Reprendre des publications par leur lien : YouTube (et souvent TikTok) donnent
// le titre et la vignette ; pour Instagram et Facebook, coller la légende.
export function FormImport({ liens = "", texte = "" }: { liens?: string; texte?: string }) {
  const [etat, action, enCours] = useActionState(importerPublications, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="imp-liens" className={libelle}>Liens des publications (un par ligne)</label>
        <textarea id="imp-liens" name="liens" rows={3} required defaultValue={liens} placeholder={"https://www.instagram.com/p/…\nhttps://www.tiktok.com/@compte/video/…"} className={champ} />
      </div>
      <div>
        <label htmlFor="imp-texte" className={libelle}>Légende (facultative, pour un seul lien)</label>
        <textarea id="imp-texte" name="texte" rows={5} maxLength={5000} defaultValue={texte} placeholder="Collez ici le texte de la publication : les noms, les dates et les mots importants en seront tirés." className={champ} />
      </div>
      <div className="max-w-xs">
        <label htmlFor="imp-portee" className={libelle}>Zone</label>
        <select id="imp-portee" name="portee" defaultValue="togo" className={champ}>
          {Object.entries(LIBELLE_PORTEE).map(([valeur, nom]) => (
            <option key={valeur} value={valeur}>{nom}</option>
          ))}
        </select>
      </div>
      <Retour etat={etat} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Publication…" : "Publier dans Actu art"}
      </button>
    </form>
  );
}

export function FormSourceSociale() {
  const [etat, action, enCours] = useActionState(ajouterSourceSociale, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-plateforme" className={libelle}>Réseau</label>
          <select id="rs-plateforme" name="plateforme" defaultValue="instagram" className={champ}>
            <option value="instagram">Compte Instagram professionnel</option>
            <option value="instagram_hashtag">Mot-dièse Instagram</option>
            <option value="facebook">Page Facebook</option>
            <option value="youtube">Chaîne YouTube</option>
          </select>
        </div>
        <div>
          <label htmlFor="rs-id" className={libelle}>Compte, mot-dièse ou adresse</label>
          <input id="rs-id" name="identifiant" required maxLength={160} placeholder="@galerie, #arttogolais, adresse…" className={champ} />
        </div>
        <div>
          <label htmlFor="rs-nom" className={libelle}>Nom affiché (facultatif)</label>
          <input id="rs-nom" name="nom" maxLength={120} className={champ} />
        </div>
        <div>
          <label htmlFor="rs-portee" className={libelle}>Zone par défaut</label>
          <select id="rs-portee" name="portee" defaultValue="togo" className={champ}>
            {Object.entries(LIBELLE_PORTEE).map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>{nom}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="filtrer" value="1" className="mt-0.5 h-4 w-4 accent-[#a65a41]" />
        <span>Compte généraliste : ne garder que ce qui parle d&apos;arts visuels</span>
      </label>
      <Retour etat={etat} />
      <button type="submit" disabled={enCours} className={bouton}>{enCours ? "Ajout…" : "Suivre ce compte"}</button>
    </form>
  );
}

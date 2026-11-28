"use client";

import { useRef, useState } from "react";
import {
  ACCEPT_DOCUMENTS,
  genreDocument,
  LONGUEUR_MAX,
  TAILLE_MAX_DOCUMENT,
  type DocumentArtiste,
  type RubriqueDocument,
} from "@/lib/documents";
import { lireTexteDocument } from "@/lib/lecture-document";

type Retour = { ton: "attente" | "bien" | "attention"; texte: string } | null;

const poids = (octets: number) => (octets >= 1_048_576 ? `${(octets / 1_048_576).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`);

// « Écrire » ou « Téléverser un fichier » : le texte du fichier est repris dans le
// champ (que l'artiste relit et corrige) et le fichier est joint à sa page.
export function DocumentOuTexte({
  rubrique,
  texteActuel,
  onTexte,
  onJoint,
  existant,
}: {
  rubrique: RubriqueDocument;
  texteActuel: string;
  onTexte: (texte: string) => void;
  // Signale qu'un fichier (nouveau ou déjà enregistré) accompagne la rubrique.
  onJoint: (joint: boolean) => void;
  existant: DocumentArtiste | null;
}) {
  const [mode, setMode] = useState<"ecrire" | "fichier">("ecrire");
  const [joint, setJoint] = useState<{ nom: string; taille: number } | null>(null);
  const [retour, setRetour] = useState<Retour>(null);
  const [retirer, setRetirer] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  const detacher = () => {
    if (champ.current) champ.current.value = "";
    setJoint(null);
    onJoint(Boolean(existant) && !retirer);
  };

  const choisir = async (fichier: File) => {
    const genre = genreDocument(fichier.name) ?? (fichier.type.startsWith("image/") ? "jpg" : null);
    if (!genre) {
      detacher();
      setRetour({ ton: "attention", texte: "Format non pris en charge : PDF, Word, ODT, texte, RTF ou photo du document." });
      return;
    }
    const image = ["jpg", "png", "webp", "heic"].includes(genre);
    setRetour({ ton: "attente", texte: "Lecture du fichier…" });
    let texte: string | null = null;
    try {
      texte = await lireTexteDocument(fichier, rubrique);
    } catch (erreur) {
      console.warn("[ArTova] Document illisible :", erreur);
    }
    // Les photos sont réduites avant l'envoi : leur poids d'origine ne compte pas.
    const joignable = image || fichier.size <= TAILLE_MAX_DOCUMENT;
    if (joignable) {
      setJoint({ nom: fichier.name, taille: fichier.size });
      onJoint(true);
    } else {
      detacher();
    }

    let repris = false;
    let coupe = false;
    if (texte && (!texteActuel.trim() || window.confirm("Remplacer le texte déjà saisi par celui du fichier ?"))) {
      const max = LONGUEUR_MAX[rubrique];
      if (texte.length > max) {
        const fin = texte.lastIndexOf("\n", max);
        texte = texte.slice(0, fin > max * 0.6 ? fin : max).trim();
        coupe = true;
      }
      onTexte(texte);
      repris = true;
    }

    if (repris) {
      setRetour({
        ton: coupe || !joignable ? "attention" : "bien",
        texte: `Texte repris dans le champ ci-dessous : relisez-le et corrigez-le.${coupe ? " Il dépassait la limite : la fin a été coupée." : ""}${joignable ? "" : " Le fichier, trop lourd (plus de 2 Mo), n'est pas joint."}`,
      });
    } else if (texte) {
      setRetour({ ton: "bien", texte: joignable ? "Votre texte est conservé ; le fichier est joint." : "Votre texte est conservé. Le fichier, trop lourd (plus de 2 Mo), n'est pas joint." });
    } else if (joignable) {
      setRetour({
        ton: "attention",
        texte: "Le texte ne peut pas être lu automatiquement (document scanné, photo ou ancien format). Le fichier est joint ; vous pouvez aussi écrire le texte ci-dessous.",
      });
    } else {
      setRetour({ ton: "attention", texte: "Fichier trop lourd (plus de 2 Mo) et sans texte lisible : choisissez une version plus légère, ou écrivez le texte." });
    }
  };

  const onglet = (valeur: "ecrire" | "fichier", libelle: string) => (
    <button
      type="button"
      aria-pressed={mode === valeur}
      onClick={() => setMode(valeur)}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-medium transition-colors sm:flex-none ${mode === valeur ? "bg-encre text-craie" : "text-encre/70 hover:text-encre"}`}
    >
      {libelle}
    </button>
  );

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Façon de renseigner cette partie" className="flex w-full gap-1 rounded-full border border-fil bg-craie p-1 sm:w-fit">
        {onglet("ecrire", "Écrire")}
        {onglet("fichier", "Téléverser un fichier")}
      </div>

      {/* Le champ fichier reste dans le formulaire quel que soit l'onglet. */}
      <div className={mode === "fichier" ? "" : "hidden"}>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-encre/35 bg-panel px-4 py-5 text-center transition-colors focus-within:border-encre hover:border-encre">
          <span className="text-sm font-medium">{joint ? "Choisir un autre fichier" : "Choisir un fichier"}</span>
          <span className="text-xs text-gris">PDF, Word, texte ou photo du document · 2 Mo au plus pour le joindre</span>
          <input
            ref={champ}
            type="file"
            name={`doc_${rubrique}`}
            accept={ACCEPT_DOCUMENTS}
            className="sr-only"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (fichier) void choisir(fichier);
              else detacher();
            }}
          />
        </label>
      </div>

      {retour && (
        <p
          role="status"
          className={`border-l-2 pl-3 text-sm ${retour.ton === "attention" ? "border-terracotta text-terracotta" : retour.ton === "bien" ? "border-[#3f7d4e]" : "border-fil text-gris"}`}
        >
          {retour.texte}
        </p>
      )}

      {existant && !joint && (
        <div className="space-y-2 rounded-2xl border border-fil bg-craie p-4 text-sm">
          <p className="break-words">
            Fichier enregistré :{" "}
            <a href={`/documents/${existant.id}`} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-terracotta">
              {existant.nom}
            </a>
          </p>
          <label className="flex min-h-9 items-center gap-2">
            <input type="checkbox" name={`retirer_doc_${rubrique}`} value="1" checked={retirer} onChange={(e) => { setRetirer(e.target.checked); onJoint(!e.target.checked); }} className="h-4 w-4 accent-[#a65a41]" />
            Retirer ce fichier
          </label>
        </div>
      )}

      {(joint || existant) && !retirer && (
        <div className="space-y-2">
          {joint && (
            <p className="flex flex-wrap items-center gap-x-3 break-all text-sm">
              <span>Joint : {joint.nom} ({poids(joint.taille)})</span>
              <button type="button" onClick={() => { detacher(); setRetour(null); }} className="min-h-9 text-gris underline underline-offset-4 hover:text-terracotta">
                Retirer
              </button>
            </p>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              key={joint ? "nouveau" : "ancien"}
              type="checkbox"
              name={`doc_${rubrique}_public`}
              value="1"
              defaultChecked={!joint && Boolean(existant?.public)}
              className="mt-0.5 h-4 w-4 accent-[#a65a41]"
            />
            <span>
              Proposer ce fichier au téléchargement sur ma page publique
              <span className="block text-xs text-gris">
                Sans cette case, seuls vous et l&apos;équipe ArTova le voyez. Avant de la cocher, vérifiez qu&apos;il ne contient ni téléphone ni adresse.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

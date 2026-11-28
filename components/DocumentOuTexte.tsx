"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCEPT_DOCUMENTS,
  genreDocument,
  LONGUEUR_MAX,
  TAILLE_MAX_DOCUMENT,
  type DocumentArtiste,
  type RubriqueDocument,
} from "@/lib/documents";
import { lireTexteDocument } from "@/lib/lecture-document";
import { cleMemoire, ecrireMemoire, lireMemoire } from "@/lib/brouillon";

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
  memoire,
}: {
  // Clé du brouillon d'inscription, pour retrouver le texte venu du fichier.
  memoire?: string;
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
  // Ce qui vient d'un fichier : le texte inséré, et ce qu'il y avait avant lui.
  const [venu, setVenu] = useState<{ texte: string; avant: string } | null>(null);
  const memorise = memoire ? cleMemoire(memoire, `doc_${rubrique}`) : null;
  const retenu = useRef<File | null>(null);
  const retireAvecLeFichier = useRef<string | null>(null);

  useEffect(() => {
    if (!memorise) return;
    const garde = lireMemoire<{ texte: string; avant: string }>(memorise);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reprise du brouillon au montage
    if (garde) setVenu(garde);
  }, [memorise]);

  const noter = (valeur: { texte: string; avant: string } | null) => {
    setVenu(valeur);
    if (memorise) ecrireMemoire(memorise, valeur);
    // Le texte du champ vient de changer sans saisie : le brouillon doit le savoir.
    champ.current?.form?.dispatchEvent(new Event("brouillon:sauver"));
  };

  // Retire du champ le texte qui venait du fichier et rend ce qu'il y avait avant.
  // Si la personne l'a corrigé, on le lui demande d'abord.
  const retirerLeTexte = (): boolean => {
    if (!venu) return false;
    const intact = texteActuel.trim() === venu.texte.trim();
    if (!intact && texteActuel.trim() !== "" && !window.confirm("Retirer aussi le texte repris du fichier, avec vos corrections ?")) {
      noter(null);
      return false;
    }
    onTexte(venu.avant);
    noter(null);
    return true;
  };

  const detacher = () => {
    retenu.current = null;
    if (champ.current?.value) {
      champ.current.value = "";
      // Prévient le brouillon que le fichier n'est plus là.
      champ.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setJoint(null);
    onJoint(Boolean(existant) && !retirer);
  };

  const retirerTout = () => {
    const texteRetire = retirerLeTexte();
    detacher();
    setRetour(texteRetire ? { ton: "bien", texte: "Fichier retiré, ainsi que le texte qui en venait." } : null);
  };

  const choisir = async (fichier: File, restauration = false) => {
    if (restauration) {
      // Fichier retrouvé après un rechargement : le texte est déjà dans le brouillon.
      retenu.current = fichier;
      setJoint({ nom: fichier.name, taille: fichier.size });
      setMode("fichier");
      onJoint(true);
      return;
    }
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
      retenu.current = fichier;
      setJoint({ nom: fichier.name, taille: fichier.size });
      onJoint(true);
    } else {
      detacher();
    }

    let repris = false;
    let coupe = false;
    // Le texte d'un fichier précédent se remplace sans question ; celui que la
    // personne a écrit ou corrigé, seulement avec son accord.
    const remplacable = !texteActuel.trim() || texteActuel.trim() === venu?.texte.trim();
    if (texte && (remplacable || window.confirm("Remplacer le texte déjà saisi par celui du fichier ?"))) {
      const max = LONGUEUR_MAX[rubrique];
      if (texte.length > max) {
        const fin = texte.lastIndexOf("\n", max);
        texte = texte.slice(0, fin > max * 0.6 ? fin : max).trim();
        coupe = true;
      }
      onTexte(texte);
      noter({ texte, avant: venu ? venu.avant : texteActuel });
      repris = true;
    } else if (!texte && venu) {
      // Nouveau fichier sans texte : celui de l'ancien fichier ne doit pas rester.
      retirerLeTexte();
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
              if (fichier) {
                void choisir(fichier, Boolean(e.target.dataset.restauration));
              } else if (retenu.current) {
                // Sélection annulée : le fichier déjà choisi reste en place.
                const transfert = new DataTransfer();
                transfert.items.add(retenu.current);
                e.target.files = transfert.files;
              }
            }}
          />
        </label>
      </div>

      <input type="hidden" name={`doc_${rubrique}_texte`} value={venu?.texte ?? ""} />

      {venu && !joint && (
        <button type="button" onClick={retirerTout} className="min-h-9 text-sm text-gris underline underline-offset-4 hover:text-terracotta">
          Retirer le texte repris du fichier
        </button>
      )}

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
            <input
              type="checkbox"
              name={`retirer_doc_${rubrique}`}
              value="1"
              checked={retirer}
              onChange={(e) => {
                const coche = e.target.checked;
                setRetirer(coche);
                onJoint(!coche);
                const origine = existant.texte?.trim();
                if (!origine) return;
                if (coche) {
                  const intact = texteActuel.trim() === origine;
                  // Corrigé depuis ? on ne le supprime qu'avec l'accord de la personne.
                  if (intact || (texteActuel.trim() !== "" && window.confirm("Retirer aussi le texte repris de ce fichier, avec vos corrections ?"))) {
                    retireAvecLeFichier.current = texteActuel;
                    onTexte("");
                  }
                } else if (retireAvecLeFichier.current !== null) {
                  onTexte(retireAvecLeFichier.current);
                  retireAvecLeFichier.current = null;
                }
              }}
              className="h-4 w-4 accent-[#a65a41]"
            />
            Retirer ce fichier et le texte qui en venait
          </label>
        </div>
      )}

      {(joint || existant) && !retirer && (
        <div className="space-y-2">
          {joint && (
            <p className="flex flex-wrap items-center gap-x-3 break-all text-sm">
              <span>Joint : {joint.nom} ({poids(joint.taille)})</span>
              <button type="button" onClick={retirerTout} className="min-h-9 text-gris underline underline-offset-4 hover:text-terracotta">
                {venu ? "Retirer le fichier et son texte" : "Retirer"}
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

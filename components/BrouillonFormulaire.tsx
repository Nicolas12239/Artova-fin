"use client";

import { useEffect, useRef, useState } from "react";
import { reduireImage } from "./envoiImages";
import { cleMemoire, ecrireFichier, ecrireMemoire, effacerBrouillon, lireFichiers, lireMemoire, type Champs } from "@/lib/brouillon";

// Ce qui n'est jamais gardé sur l'appareil.
const EXCLUS = new Set(["mot_de_passe", "confirmation", "next"]);

type Saisie = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Vrai quand la personne efface son brouillon : plus rien n'est réécrit ni retenu.
let abandon = false;

function saisies(formulaire: HTMLFormElement): Saisie[] {
  return Array.from(formulaire.elements).filter(
    (e): e is Saisie =>
      (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement) &&
      e.name !== "" &&
      !EXCLUS.has(e.name) &&
      !["file", "password", "hidden", "submit", "button"].includes(e.type),
  );
}

// Écrit une valeur comme le ferait la personne, pour que React en tienne compte.
function remplir(element: Saisie, valeur: string | boolean) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    if (element.checked !== valeur) element.click();
    return;
  }
  if (typeof valeur !== "string" || element.value === valeur) return;
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, valeur);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

// Protège un formulaire d'inscription : saisie et fichiers gardés au fil de l'eau
// et retrouvés après un rechargement ; avertissement avant de quitter la page ;
// geste « tirer pour actualiser » neutralisé tant que le formulaire est ouvert.
export function useBrouillon(cle: string) {
  const ref = useRef<HTMLFormElement>(null);
  const [retrouve, setRetrouve] = useState(false);

  useEffect(() => {
    const formulaire = ref.current;
    if (!formulaire) return;
    let actif = true;
    let minuterie = 0;
    let commence = false;
    // Instant du dernier envoi : la redirection de fin ne doit pas déclencher d'alerte.
    let envoi = 0;
    const envoyer = () => {
      envoi = Date.now();
    };
    const differer = () => {
      window.clearTimeout(minuterie);
      minuterie = window.setTimeout(sauver, 250);
    };

    const sauver = () => {
      window.clearTimeout(minuterie);
      if (!commence || abandon) return;
      const champs: Champs = {};
      for (const e of saisies(formulaire)) champs[e.name] = e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value;
      ecrireMemoire(cleMemoire(cle), champs);
    };
    const saisie = (evenement: Event) => {
      const cible = evenement.target;
      commence = true;
      if (cible instanceof HTMLInputElement && cible.type === "file") {
        // Un fichier repris du brouillon n'a pas à être réécrit.
        if (cible.dataset.restauration) return;
        const champ = cible.name;
        const fichier = cible.files?.[0] ?? null;
        void (fichier ? reduireImage(fichier) : Promise.resolve(null)).then((f) => ecrireFichier(cle, champ, f));
      }
      differer();
    };
    // Le téléphone peut fermer l'onglet dès qu'il passe en arrière-plan.
    const masquee = () => document.visibilityState === "hidden" && sauver();
    const quitter = (e: BeforeUnloadEvent) => {
      sauver();
      if (commence && !abandon && Date.now() - envoi > 60_000) e.preventDefault();
    };

    const reprendre = async () => {
      const [champs, fichiers] = [lireMemoire<Champs>(cleMemoire(cle)), await lireFichiers(cle)];
      if (!actif) return;
      for (const [nom, fichier] of fichiers) {
        const champ = formulaire.querySelector<HTMLInputElement>(`input[type="file"][name="${CSS.escape(nom)}"]`);
        if (!champ) continue;
        const transfert = new DataTransfer();
        transfert.items.add(fichier);
        champ.files = transfert.files;
        champ.dataset.restauration = "1";
        champ.dispatchEvent(new Event("change", { bubbles: true }));
        delete champ.dataset.restauration;
      }
      // Les champs apparus avec les fichiers sont là au tour suivant.
      await new Promise((ok) => setTimeout(ok, 80));
      if (!actif) return;
      if (champs) {
        const parNom = new Map(saisies(formulaire).map((e) => [e.name, e]));
        for (const [nom, valeur] of Object.entries(champs)) {
          const e = parNom.get(nom);
          if (e) remplir(e, valeur);
        }
      }
      const quelqueChose = fichiers.size > 0 || Boolean(champs && Object.values(champs).some((v) => typeof v === "string" && v.trim() !== "" && !v.startsWith("#")));
      if (quelqueChose) {
        setRetrouve(true);
        commence = true;
      }
    };

    void reprendre().finally(() => {
      if (!actif) return;
      formulaire.addEventListener("input", saisie);
      formulaire.addEventListener("change", saisie);
      // Texte inséré ou retiré par un composant (lecture d'un fichier).
      formulaire.addEventListener("brouillon:sauver", differer);
      formulaire.addEventListener("submit", envoyer);
    });
    document.addEventListener("visibilitychange", masquee);
    window.addEventListener("pagehide", sauver);
    window.addEventListener("beforeunload", quitter);
    const avant = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "contain";
    document.body.style.overscrollBehaviorY = "contain";

    return () => {
      sauver();
      actif = false;
      window.clearTimeout(minuterie);
      formulaire.removeEventListener("input", saisie);
      formulaire.removeEventListener("change", saisie);
      formulaire.removeEventListener("brouillon:sauver", differer);
      formulaire.removeEventListener("submit", envoyer);
      document.removeEventListener("visibilitychange", masquee);
      window.removeEventListener("pagehide", sauver);
      window.removeEventListener("beforeunload", quitter);
      document.documentElement.style.overscrollBehaviorY = avant;
      document.body.style.overscrollBehaviorY = avant;
    };
  }, [cle]);

  return { ref, retrouve };
}

export function BandeauBrouillon({ cle, visible }: { cle: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3f7d4e]/50 bg-craie p-4 text-sm">
      <p>Votre saisie a été retrouvée (gardée sur cet appareil). Les mots de passe sont à retaper.</p>
      <button
        type="button"
        onClick={() => {
          if (!window.confirm("Effacer tout ce qui a été saisi et recommencer ?")) return;
          abandon = true;
          void effacerBrouillon(cle).then(() => window.location.reload());
        }}
        className="min-h-11 text-gris underline underline-offset-4 hover:text-terracotta"
      >
        Effacer et recommencer
      </button>
    </div>
  );
}

// À la fin d'une inscription (personne connectée), le brouillon n'a plus lieu d'être.
export function NettoyerBrouillons({ role }: { role: string | null }) {
  useEffect(() => {
    if (!role) return;
    void effacerBrouillon("inscription");
    if (role === "artiste" || role === "admin") void effacerBrouillon("inscription-artiste");
  }, [role]);
  return null;
}

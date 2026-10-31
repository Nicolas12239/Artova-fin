"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

const FORMATS_WEB = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS_IMAGES = /\.(jpe?g|png|webp|heic|heif|avif|gif|tiff?|bmp)$/i;

// Les photos (téléphone, appareil photo, scans) peuvent peser 10 à 50 Mo et
// arriver en HEIC : on les ramène à 2400 px en JPEG dans le navigateur avant
// l'envoi. Le serveur redimensionne de toute façon ; cette étape rend surtout
// l'envoi rapide sur réseau mobile. Si le navigateur ne sait pas lire le
// format, le fichier part tel quel et le serveur le convertit.
export async function reduireImage(fichier: File, coteMax = 2400): Promise<File> {
  const image = fichier.type.startsWith("image/") || EXTENSIONS_IMAGES.test(fichier.name);
  if (!image || fichier.size === 0) return fichier;
  const formatWeb = FORMATS_WEB.has(fichier.type);
  if (formatWeb && fichier.size < 1_500_000) return fichier;

  try {
    const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
    const echelle = Math.min(1, coteMax / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * echelle));
    canvas.height = Math.max(1, Math.round(bitmap.height * echelle));
    const ctx = canvas.getContext("2d");
    if (!ctx) return fichier;
    // Fond blanc : sans lui, la transparence d'un PNG deviendrait noire en JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.88));
    if (!blob || (formatWeb && blob.size >= fichier.size)) return fichier;
    return new File([blob], fichier.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return fichier;
  }
}

export async function reduireImagesDuFormulaire(formData: FormData): Promise<void> {
  for (const [cle, valeur] of [...formData.entries()]) {
    if (valeur instanceof File && valeur.size > 0) formData.set(cle, await reduireImage(valeur));
  }
}

type Etat = { erreur?: string; succes?: string } | null;

// Envoi d'un formulaire avec images : réduction préalable, et pas de remise à
// zéro du formulaire en cas d'erreur (l'utilisateur garde sa saisie).
export function useEnvoiAvecImages(
  actionServeur: (prev: Etat, formData: FormData) => Promise<Etat>,
  { viderApresSucces = false }: { viderApresSucces?: boolean } = {},
) {
  const [etat, action, enCours] = useActionState(actionServeur, null);
  const [preparation, setPreparation] = useState(false);
  const formulaire = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (viderApresSucces && etat?.succes) formulaire.current?.reset();
  }, [etat, viderApresSucces]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formulaire.current = e.currentTarget;
    const formData = new FormData(e.currentTarget);
    setPreparation(true);
    try {
      await reduireImagesDuFormulaire(formData);
    } finally {
      setPreparation(false);
    }
    startTransition(() => action(formData));
  };
  return { etat, onSubmit, enCours: enCours || preparation };
}

// Lecture du texte d'un document DANS LE NAVIGATEUR de l'artiste : le fichier
// n'est pas envoyé pour être lu. PDF, Word (.docx), OpenDocument (.odt) et texte.
// Un scan ou une photo n'a pas de texte à reprendre : la fonction renvoie null.
import { genreDocument, type RubriqueDocument } from "./documents";

const decoder = new TextDecoder("utf-8");

// Extrait un fichier d'une archive ZIP (format des .docx et .odt).
async function entreeZip(tampon: ArrayBuffer, nom: string): Promise<string | null> {
  const vue = new DataView(tampon);
  const octets = new Uint8Array(tampon);
  let fin = -1;
  for (let i = octets.length - 22; i >= Math.max(0, octets.length - 65_557); i--) {
    if (vue.getUint32(i, true) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) return null;
  const nombre = vue.getUint16(fin + 10, true);
  let p = vue.getUint32(fin + 16, true);
  for (let k = 0; k < nombre && p + 46 <= octets.length; k++) {
    if (vue.getUint32(p, true) !== 0x02014b50) break;
    const methode = vue.getUint16(p + 10, true);
    const taille = vue.getUint32(p + 20, true);
    const longueurNom = vue.getUint16(p + 28, true);
    const extra = vue.getUint16(p + 30, true);
    const commentaire = vue.getUint16(p + 32, true);
    const local = vue.getUint32(p + 42, true);
    if (decoder.decode(octets.subarray(p + 46, p + 46 + longueurNom)) === nom) {
      const debut = local + 30 + vue.getUint16(local + 26, true) + vue.getUint16(local + 28, true);
      const donnees = octets.slice(debut, debut + taille);
      if (methode === 0) return decoder.decode(donnees);
      if (methode !== 8) return null;
      const flux = new Blob([donnees]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Response(flux).text();
    }
    p += 46 + longueurNom + extra + commentaire;
  }
  return null;
}

function paragraphesXml(xml: string, balises: string[]): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const lignes: string[] = [];
  for (const element of Array.from(doc.getElementsByTagName("*"))) {
    if (!balises.includes(element.nodeName)) continue;
    if (element.nodeName === "w:p") {
      let texte = "";
      for (const n of Array.from(element.getElementsByTagName("*"))) {
        if (n.nodeName === "w:t") texte += n.textContent ?? "";
        else if (n.nodeName === "w:tab") texte += " ";
        else if (n.nodeName === "w:br") texte += "\n";
      }
      lignes.push(texte);
    } else {
      lignes.push(element.textContent ?? "");
    }
  }
  return lignes;
}

interface Morceau {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
}

// Lignes d'une page PDF, reconstituées d'après la position de chaque morceau de
// texte. Avec « recoller », les lignes d'un même paragraphe sont réunies : on
// change de paragraphe quand l'interligne s'élargit ou qu'une phrase finit bien
// avant la marge de droite.
export function lignesPdf(morceaux: Morceau[], recoller: boolean): string[] {
  const lignes: { texte: string; y: number; droite: number; taille: number }[] = [];
  for (const m of morceaux) {
    if (!m.str) continue;
    const ligne = lignes[lignes.length - 1];
    if (ligne && Math.abs(ligne.y - m.y) < Math.max(2, m.fontSize * 0.5)) {
      const trou = m.x - ligne.droite > m.fontSize * 0.2 && !/\s$/.test(ligne.texte) && !/^\s/.test(m.str);
      ligne.texte += (trou ? " " : "") + m.str;
      ligne.droite = Math.max(ligne.droite, m.x + m.width);
    } else {
      lignes.push({ texte: m.str, y: m.y, droite: m.x + m.width, taille: m.fontSize });
    }
  }
  const utiles = lignes.filter((l) => l.texte.trim());
  if (!recoller) return utiles.map((l) => l.texte.trim());
  const interlignes = utiles.slice(1).map((l, k) => utiles[k].y - l.y).filter((d) => d > 0).sort((a, b) => a - b);
  const courant = interlignes[Math.floor(interlignes.length / 3)] ?? 0;
  const marge = Math.max(...utiles.map((l) => l.droite), 0);
  const paragraphes: string[] = [];
  utiles.forEach((l, k) => {
    const texte = l.texte.trim();
    const avant = utiles[k - 1];
    const suite =
      avant !== undefined &&
      avant.y - l.y > 0 &&
      avant.y - l.y <= courant * 1.35 &&
      !/^([•\-–*]|(19|20)\d\d\b)/.test(texte) &&
      !(/[.!?…:»]$/.test(avant.texte.trim()) && avant.droite < marge * 0.85) &&
      avant.droite >= marge * 0.6;
    if (suite) {
      const debut = paragraphes[paragraphes.length - 1];
      paragraphes[paragraphes.length - 1] = debut.endsWith("-") ? debut.slice(0, -1) + texte : `${debut} ${texte}`;
    } else {
      paragraphes.push(texte);
    }
  });
  return paragraphes;
}

export async function lireTexteDocument(fichier: File, rubrique: RubriqueDocument): Promise<string | null> {
  const genre = genreDocument(fichier.name);
  let lignes: string[];
  if (genre === "txt") {
    const tampon = await fichier.arrayBuffer();
    let texte: string;
    try {
      texte = new TextDecoder("utf-8", { fatal: true }).decode(tampon);
    } catch {
      texte = new TextDecoder("windows-1252").decode(tampon);
    }
    lignes = texte.split(/\r?\n/);
  } else if (genre === "docx" || genre === "odt") {
    const xml = await entreeZip(await fichier.arrayBuffer(), genre === "docx" ? "word/document.xml" : "content.xml");
    if (!xml) return null;
    lignes = paragraphesXml(xml, genre === "docx" ? ["w:p"] : ["text:p", "text:h"]).flatMap((l) => l.split("\n"));
  } else if (genre === "pdf") {
    // Chargé seulement quand un PDF est choisi.
    const { extractTextItems, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await fichier.arrayBuffer()));
    const { items } = await extractTextItems(pdf);
    lignes = items.flatMap((page) => lignesPdf(page, rubrique === "histoire"));
  } else {
    return null;
  }
  const propres = lignes.map((l) => l.replace(/[\u0000-\u0008\u000B-\u001F­]/g, "").replace(/[ \t ]+/g, " ").trim()).filter(Boolean);
  // Une histoire se lit en paragraphes, un parcours en liste.
  const texte = propres.join(rubrique === "histoire" ? "\n\n" : "\n").trim();
  return texte.replace(/\s/g, "").length >= 20 ? texte : null;
}

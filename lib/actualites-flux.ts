import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { lireVideo, type Categorie } from "./actualites-commun";
import type { Portee } from "./actualites-sources";

export interface EntreeFlux {
  titre: string;
  lien: string;
  date: Date | null;
  extrait: string;
  image: string | null;
}

// ─── Téléchargement ──────────────────────────────────────────────────────────

const NOMS_INTERDITS = /^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i;

function adressePrivee(hote: string): boolean {
  if (NOMS_INTERDITS.test(hote)) return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hote);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return hote.includes(":"); // adresses IPv6 : jamais utiles pour un flux public
}

// Seules les adresses http(s) vers un hôte public sont suivies.
export function adresseSure(url: string): URL | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (adressePrivee(u.hostname.replace(/^\[|\]$/g, ""))) return null;
    return u;
  } catch {
    return null;
  }
}

function agentUtilisateur(): string {
  const site = process.env.SITE_URL || "https://artova-fin.vercel.app";
  return `Mozilla/5.0 (compatible; ArTovaBot/1.0; +${site})`;
}

// Certains médias (Artdaily, par exemple) publient en windows-1252 : on lit le
// jeu de caractères dans l'en-tête HTTP, le prologue XML ou la balise meta.
function decoder(octets: Buffer, typeContenu: string): string {
  const entete = /charset=["']?([\w-]+)/i.exec(typeContenu)?.[1];
  const debut = octets.subarray(0, 600).toString("latin1");
  const interne = /<\?xml[^>]*encoding=["']([\w-]+)/i.exec(debut)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(debut)?.[1];
  for (const nom of [entete, interne]) {
    if (!nom) continue;
    try {
      return new TextDecoder(nom).decode(octets);
    } catch {
      // jeu de caractères inconnu : on essaie le suivant
    }
  }
  return new TextDecoder("utf-8").decode(octets);
}

async function lireCorps(res: Response, maxOctets: number): Promise<string> {
  const typeContenu = res.headers.get("content-type") ?? "";
  const lecteur = res.body?.getReader();
  if (!lecteur) return (await res.text()).slice(0, maxOctets);
  const morceaux: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    morceaux.push(value);
    total += value.length;
    if (total >= maxOctets) {
      await lecteur.cancel();
      break;
    }
  }
  return decoder(Buffer.concat(morceaux), typeContenu);
}

export async function telecharger(
  url: string,
  { delaiMs = 8000, maxOctets = 1_500_000 }: { delaiMs?: number; maxOctets?: number } = {},
): Promise<string> {
  const cible = adresseSure(url);
  if (!cible) throw new Error("Adresse non autorisée");
  const res = await fetch(cible, {
    headers: {
      "User-Agent": agentUtilisateur(),
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
      "Accept-Language": "fr,en;q=0.7",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(delaiMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return lireCorps(res, maxOctets);
}

// ─── Nettoyage de texte ──────────────────────────────────────────────────────

const ENTITES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç",
  icirc: "î", iuml: "ï", ocirc: "ô", ugrave: "ù", ucirc: "û", oelig: "œ", copy: "©",
};

export function decoderEntites(texte: string): string {
  return texte.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTITES[code.toLowerCase()] ?? m;
  });
}

export function nettoyerHtml(html: string): string {
  const sansBalises = html
    .replace(/<(script|style|figure|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return decoderEntites(decoderEntites(sansBalises))
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tronquer(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max - 1);
  const dernierEspace = coupe.lastIndexOf(" ");
  return `${(dernierEspace > max * 0.6 ? coupe.slice(0, dernierEspace) : coupe).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

// Formes comparables : sans accents, sans casse, sans ponctuation.
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Identité d'une publication ──────────────────────────────────────────────

export function empreinteUrl(url: string): string {
  let canonique = url.trim();
  try {
    const u = new URL(url);
    u.hash = "";
    for (const cle of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$|ref_)/i.test(cle)) u.searchParams.delete(cle);
    }
    u.hostname = u.hostname.replace(/^www\./, "");
    canonique = u.toString().replace(/\/$/, "");
  } catch {
    // adresse déjà invalide : on hache telle quelle
  }
  return createHash("sha1").update(canonique).digest("hex");
}

export function empreinteTitre(titre: string): string {
  return createHash("sha1").update(`t:${normaliser(titre)}`).digest("hex");
}

// ─── Lecture des flux RSS / Atom ─────────────────────────────────────────────

const analyseur = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
});

type Noeud = unknown;

function liste<T>(valeur: T | T[] | undefined | null): T[] {
  if (valeur === undefined || valeur === null) return [];
  return Array.isArray(valeur) ? valeur : [valeur];
}

function texteDe(noeud: Noeud): string {
  if (noeud === undefined || noeud === null) return "";
  if (typeof noeud === "string") return noeud;
  if (typeof noeud === "number") return String(noeud);
  if (Array.isArray(noeud)) return texteDe(noeud[0]);
  if (typeof noeud === "object") return texteDe((noeud as Record<string, unknown>)["#text"]);
  return "";
}

function attribut(noeud: Noeud, nom: string): string {
  if (Array.isArray(noeud)) return attribut(noeud[0], nom);
  if (noeud && typeof noeud === "object") {
    const v = (noeud as Record<string, unknown>)[`@_${nom}`];
    return typeof v === "string" ? v : "";
  }
  return "";
}

function lienDe(item: Record<string, unknown>): string {
  const brut = item.link;
  if (typeof brut === "string") return brut.trim();
  const candidats = liste(brut as Noeud[]);
  const alterne = candidats.find((c) => !attribut(c, "rel") || attribut(c, "rel") === "alternate") ?? candidats[0];
  const href = attribut(alterne, "href");
  if (href) return href.trim();
  const texte = texteDe(alterne).trim();
  if (texte) return texte;
  const guid = texteDe(item.guid ?? item.id).trim();
  return /^https?:\/\//.test(guid) ? guid : "";
}

function imageDansHtml(html: string): string | null {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

export function urlImageValide(brut: string | null | undefined, base?: string): string | null {
  if (!brut) return null;
  try {
    const u = new URL(decoderEntites(brut.trim()), base);
    if (u.protocol === "http:") u.protocol = "https:"; // évite le contenu mixte
    if (u.protocol !== "https:" || adressePrivee(u.hostname)) return null;
    if (/\.(svg|gif)(\?|$)/i.test(u.pathname) || /(pixel|spacer|1x1|blank|logo|favicon|avatar)/i.test(u.pathname)) return null;
    const s = u.toString();
    return s.length <= 1000 ? s : null;
  } catch {
    return null;
  }
}

function imageDe(item: Record<string, unknown>, html: string): string | null {
  const medias = [...liste(item["media:content"] as Noeud[]), ...liste(item["media:thumbnail"] as Noeud[])];
  for (const m of medias) {
    const type = attribut(m, "type");
    if (type && !type.startsWith("image/")) continue;
    if (attribut(m, "medium") && attribut(m, "medium") !== "image") continue;
    const u = urlImageValide(attribut(m, "url"));
    if (u) return u;
  }
  for (const e of liste(item.enclosure as Noeud[])) {
    if (attribut(e, "type").startsWith("image/")) {
      const u = urlImageValide(attribut(e, "url"));
      if (u) return u;
    }
  }
  return urlImageValide(imageDansHtml(html));
}

export function lireFlux(xml: string): EntreeFlux[] {
  const doc = analyseur.parse(xml) as Record<string, unknown>;
  const canal = (doc.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  const rdf = doc["rdf:RDF"] as Record<string, unknown> | undefined;
  const atom = doc.feed as Record<string, unknown> | undefined;
  const items = canal?.item ?? rdf?.item ?? atom?.entry;

  const entrees: EntreeFlux[] = [];
  for (const brut of liste(items as Record<string, unknown> | Record<string, unknown>[] | undefined)) {
    if (!brut || typeof brut !== "object") continue;
    const titre = nettoyerHtml(texteDe(brut.title));
    const lien = lienDe(brut);
    if (!titre || !lien || !adresseSure(lien)) continue;

    const html = texteDe(brut["content:encoded"] ?? brut.content ?? brut.description ?? brut.summary);
    const dateBrute = texteDe(brut.pubDate ?? brut.published ?? brut.updated ?? brut["dc:date"]);
    const date = dateBrute ? new Date(dateBrute) : null;

    entrees.push({
      titre,
      lien,
      date: date && !Number.isNaN(date.getTime()) ? date : null,
      extrait: tronquer(nettoyerHtml(texteDe(brut.description ?? brut.summary ?? brut.content ?? html)), 700),
      image: imageDe(brut, html),
    });
  }
  return entrees;
}

// Image de couverture d'une page d'article (Open Graph), quand le flux n'en donne pas.
export async function imageDePage(url: string): Promise<string | null> {
  try {
    const html = await telecharger(url, { delaiMs: 5000, maxOctets: 250_000 });
    const metas = html.match(/<meta[^>]+>/gi) ?? [];
    for (const cle of ["og:image:secure_url", "og:image", "twitter:image"]) {
      for (const meta of metas) {
        const propriete = /(?:property|name)=["']([^"']+)["']/i.exec(meta)?.[1]?.toLowerCase();
        if (propriete !== cle) continue;
        const contenu = /content=["']([^"']+)["']/i.exec(meta)?.[1];
        const valide = urlImageValide(contenu, url);
        if (valide) return valide;
      }
    }
  } catch {
    // page injoignable ou protégée : la publication aura sa couverture graphique
  }
  return null;
}

// ─── Pertinence et classement sans IA ────────────────────────────────────────

// Mots qui désignent sans ambiguïté les arts visuels. « Artiste » seul est
// exclu exprès : dans la presse togolaise il désigne surtout les musiciens.
const MOTS_ARTS_VISUELS = new RegExp(
  [
    "peintre", "peinture", "peintures", "sculpt", "plasticien", "arts? plastiques?", "arts? visuels?",
    "art contemporain", "art moderne", "art africain", "arts? urbains?", "street art", "graffiti",
    "fresque", "vernissage", "biennale", "triennale", "dak'?art", "oeuvre d'art", "oeuvres d'art",
    "galerie d'art", "musee d'art", "exposition (collective|personnelle|solo|individuelle)", "expose (ses|ses oeuvres|ses toiles)", "musee des beaux", "beaux-arts", "exposition (de|d'|sur|consacree)",
    "ceramiste", "ceramique d'art", "photographe plasticien", "installation artistique",
    "painting", "painter", "sculpture", "contemporary art", "visual art", "artwork", "exhibition",
    "art gallery", "biennial", "art fair", "auction house", "art market", "museum of art",
  ].join("|"),
  "i",
);

export function parleArtsVisuels(texte: string): boolean {
  return MOTS_ARTS_VISUELS.test(normaliser(texte));
}

// Filtre d'entrée plus large pour la presse togolaise, où l'art visuel est rare
// et rarement nommé précisément : l'IA décide ensuite de ce qui est vraiment pertinent.
const MOTS_CULTURE = /\b(art|arts|artiste|artistes|artisan|artisanat|culture|culturel|culturelle|exposition|expose|festival|musee|galerie|patrimoine|photographe|photographie|atelier|creation|createur|creatrice|designer|mode|vernissage|biennale)\b/;

export function parleCulture(texte: string): boolean {
  const t = normaliser(texte);
  return MOTS_ARTS_VISUELS.test(t) || MOTS_CULTURE.test(t);
}

const MOTS_TOGO = /\b(togo|togolais|togolaise|togolaises|lome|kpalime|aneho|sokode|atakpame|tsevie|dapaong)\b/;
const MOTS_AFRIQUE = /\b(afrique|africain|africaine|africains|africa|african|dakar|dak'?art|abidjan|lagos|accra|kinshasa|nairobi|johannesburg|cotonou|ouagadougou|bamako|casablanca|marrakech|le caire|cairo|addis|kigali|diaspora)\b/;

export function devinerPortee(texte: string, parDefaut: Portee): Portee {
  const t = normaliser(texte);
  if (MOTS_TOGO.test(t)) return "togo";
  if (parDefaut === "togo") return "togo";
  if (MOTS_AFRIQUE.test(t)) return "afrique";
  return parDefaut;
}

export function devinerCategorie(texte: string): Categorie {
  const t = normaliser(texte);
  if (/(encheres?|auction|sotheby|christie|market|marche de l'art|prix record|vente|collectionneur|collector|foire|art fair)/.test(t)) return "marche";
  if (/(restitution|patrimoine|heritage|trésor|tresor|archeolog|monument)/.test(t)) return "patrimoine";
  if (/(festival|biennale|biennial|triennale|salon|residence|rencontres?)/.test(t)) return "evenements";
  if (/(exposition|exhibition|vernissage|retrospective|show\b)/.test(t)) return "expositions";
  if (/(musee|museum|galerie|gallery|fondation|foundation|directeur|directrice|curator|commissaire)/.test(t)) return "institutions";
  if (/(portrait|interview|entretien|deces|mort de|hommage|laureat|lauréat|prix|award|nomm|artiste)/.test(t)) return "artistes";
  if (/(nouvelle œuvre|nouvelle oeuvre|installation|sculpture|peinture|painting|mural|fresque|street art)/.test(t)) return "creation";
  return "general";
}

// ─── Lecture d'une page d'article : texte, photos, vidéos ────────────────────

export interface PageArticle {
  // Texte principal (paragraphes séparés par une ligne vide) : sert de matière
  // à l'IA, jamais publié tel quel.
  texte: string;
  // Photos de l'article (hors couverture), adresses https.
  images: string[];
  // Adresses de vidéos TikTok, Instagram ou YouTube trouvées dans la page.
  videos: string[];
  // Image de couverture annoncée par la page (Open Graph), si elle existe.
  couverture: string | null;
}

const ZONES_ARTICLE = [
  /<article\b[^>]*>([\s\S]*?)<\/article>/i,
  /<div[^>]+class="[^"]*(?:entry-content|post-content|td-post-content|article-content|article__body|single-content|post-body|content-inner)[^"]*"[^>]*>([\s\S]{200,120000})/i,
  /<main\b[^>]*>([\s\S]*?)<\/main>/i,
];

const PARASITES = /(lire aussi|à lire aussi|partager sur|suivez-nous|abonnez-vous|newsletter|tous droits réservés|cookies|publicité|commentaires? \(|share on|follow us|subscribe|advertisement)/i;

function cleImage(url: string): string {
  return url.replace(/[?#].*$/, "").replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, "").replace(/\/(thumb|small|medium)\//, "/");
}

export async function lirePageArticle(url: string): Promise<PageArticle | null> {
  let html: string;
  try {
    html = await telecharger(url, { delaiMs: 6000, maxOctets: 700_000 });
  } catch {
    return null;
  }
  const sansScripts = html.replace(/<(script|style|noscript|nav|footer|aside|form)\b[\s\S]*?<\/\1>/gi, " ");
  let zone = sansScripts;
  for (const motif of ZONES_ARTICLE) {
    const m = motif.exec(sansScripts);
    if (m && m[1].length > 300) {
      zone = m[1];
      break;
    }
  }

  const paragraphes: string[] = [];
  for (const m of zone.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = nettoyerHtml(m[1]);
    if (t.length >= 50 && !PARASITES.test(t) && !paragraphes.includes(t)) paragraphes.push(t);
  }
  const texte = tronquer(paragraphes.join("\n\n"), 6000);

  const vues = new Set<string>();
  const images: string[] = [];
  for (const m of zone.matchAll(/<img\b[^>]*>/gi)) {
    const balise = m[0];
    const candidats = [
      /data-orig-file=["']([^"']+)["']/i.exec(balise)?.[1],
      /data-large-file=["']([^"']+)["']/i.exec(balise)?.[1],
      /data-(?:lazy-)?src=["']([^"']+)["']/i.exec(balise)?.[1],
      /\ssrc=["']([^"']+)["']/i.exec(balise)?.[1],
    ];
    const brut = candidats.find((c) => c && !c.startsWith("data:"));
    const u = urlImageValide(brut, url);
    if (!u) continue;
    const cle = cleImage(u);
    if (vues.has(cle)) continue;
    vues.add(cle);
    images.push(u);
    if (images.length >= 6) break;
  }

  const videos: string[] = [];
  for (const m of sansScripts.matchAll(/(?:src|href|data-src)=["'](https?:[^"']+)["']/gi)) {
    const adresse = decoderEntites(m[1]);
    const v = lireVideoAdresse(adresse);
    if (v && !videos.includes(v)) videos.push(v);
    if (videos.length >= 3) break;
  }
  return { texte, images, videos, couverture: couvertureDe(html, url) };
}

// Image Open Graph ou Twitter d'une page.
function couvertureDe(html: string, url: string): string | null {
  const metas = html.match(/<meta[^>]+>/gi) ?? [];
  for (const cle of ["og:image:secure_url", "og:image", "twitter:image"]) {
    for (const meta of metas) {
      const propriete = /(?:property|name)=["']([^"']+)["']/i.exec(meta)?.[1]?.toLowerCase();
      if (propriete !== cle) continue;
      const valide = urlImageValide(/content=["']([^"']+)["']/i.exec(meta)?.[1], url);
      if (valide) return valide;
    }
  }
  return null;
}

// Adresse de vidéo TikTok / Instagram / YouTube reconnue, sinon null.
function lireVideoAdresse(adresse: string): string | null {
  return lireVideo(adresse) ? adresse : null;
}

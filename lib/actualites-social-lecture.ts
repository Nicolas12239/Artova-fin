import { XMLParser } from "fast-xml-parser";
import { lireVideo } from "./actualites-commun";
import { adresseSure, telecharger } from "./actualites-flux";

// Lecture des réseaux sociaux par leurs voies officielles uniquement :
//  - Instagram : API Graph de Meta (comptes professionnels « business discovery »
//    et recherche par mot-dièse), avec le jeton de l'application ArTova ;
//  - Facebook : API Graph (publications des pages auxquelles le jeton donne accès) ;
//  - YouTube : flux publié par chaque chaîne (sans clé) ;
//  - TikTok : aucun accès aux comptes d'autrui ; une vidéo ajoutée par son lien
//    est décrite par le service d'intégration officiel (oEmbed).
// Aucune page n'est « aspirée » en contournant une connexion.

export const VERSION_GRAPH = "v27.0";

export type PlateformeSociale = "instagram" | "instagram_hashtag" | "facebook" | "youtube" | "tiktok";

export interface PublicationSociale {
  plateforme: PlateformeSociale;
  // Nom affiché du compte (« @artova.corp », « #arttogolais », nom de page ou de chaîne).
  compte: string;
  // Adresse publique de la publication.
  url: string;
  // Titre fourni par la plateforme (YouTube), sinon vide.
  titre: string;
  // Légende, message ou description, tels que publiés.
  texte: string;
  image: string | null;
  images: string[];
  date: Date;
}

export const NOMS_PLATEFORMES: Record<PlateformeSociale, string> = {
  instagram: "Instagram",
  instagram_hashtag: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function connexions(): { instagram: boolean; facebook: boolean; youtube: boolean } {
  return {
    instagram: Boolean(process.env.META_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ID),
    facebook: Boolean(process.env.FACEBOOK_PAGE_TOKEN || process.env.META_ACCESS_TOKEN),
    youtube: true,
  };
}

const https = (u: unknown): string | null => (typeof u === "string" && /^https:\/\//.test(u) ? u : null);
const date = (v: unknown): Date => {
  const d = new Date(typeof v === "string" ? v.replace(/\+0000$/, "Z") : NaN);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

// ─── API Graph (Instagram et Facebook) ───────────────────────────────────────

class ErreurGraph extends Error {}

async function graph<T>(chemin: string, parametres: Record<string, string>, jeton: string): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${VERSION_GRAPH}/${chemin}`);
  for (const [cle, valeur] of Object.entries(parametres)) url.searchParams.set(cle, valeur);
  url.searchParams.set("access_token", jeton);
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
  const corps = (await res.json().catch(() => null)) as (T & { error?: { message?: string; code?: number } }) | null;
  if (!res.ok || !corps || corps.error) {
    // L'adresse (qui contient le jeton) n'apparaît jamais dans le message.
    throw new ErreurGraph(`Meta : ${corps?.error?.message ?? `HTTP ${res.status}`}`.slice(0, 240));
  }
  return corps;
}

export interface MediaInstagram {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data?: { media_url?: string; thumbnail_url?: string; media_type?: string }[] };
}

export function depuisInstagram(m: MediaInstagram, compte: string, plateforme: PlateformeSociale = "instagram"): PublicationSociale | null {
  const url = https(m.permalink);
  if (!url) return null;
  const enfants = (m.children?.data ?? [])
    .map((e) => https(e.media_type === "VIDEO" ? e.thumbnail_url : e.media_url))
    .filter((u): u is string => Boolean(u));
  // Pour une vidéo, la couverture est sa vignette ; Meta n'envoie pas toujours
  // l'image (musique protégée) : la publication reste intégrée sous l'article.
  const principale = m.media_type === "VIDEO" ? https(m.thumbnail_url) : https(m.media_url);
  const image = principale ?? enfants[0] ?? null;
  return {
    plateforme,
    compte,
    url,
    titre: "",
    texte: (m.caption ?? "").trim(),
    image,
    images: enfants.filter((u) => u !== image).slice(0, 8),
    date: date(m.timestamp),
  };
}

const CHAMPS_MEDIA = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

export async function lireInstagram(identifiant: string): Promise<PublicationSociale[]> {
  const jeton = process.env.META_ACCESS_TOKEN!;
  const moi = process.env.INSTAGRAM_BUSINESS_ID!;
  const nom = identifiant.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(nom)) throw new Error("Nom de compte Instagram invalide");
  type Reponse = { business_discovery?: { media?: { data?: MediaInstagram[] } } };
  const demander = (champs: string) =>
    graph<Reponse>(moi, { fields: `business_discovery.username(${nom}){media.limit(12){${champs}}}` }, jeton);
  let r: Reponse;
  try {
    r = await demander(`${CHAMPS_MEDIA},children{media_url,thumbnail_url,media_type}`);
  } catch {
    r = await demander(CHAMPS_MEDIA);
  }
  return (r.business_discovery?.media?.data ?? []).flatMap((m) => depuisInstagram(m, `@${nom}`) ?? []);
}

// Publications des dernières 24 heures portant un mot-dièse (30 mots différents
// au plus par semaine : limite de Meta). Nécessite « Instagram Public Content Access ».
export async function lireHashtag(identifiant: string): Promise<PublicationSociale[]> {
  const jeton = process.env.META_ACCESS_TOKEN!;
  const moi = process.env.INSTAGRAM_BUSINESS_ID!;
  const mot = identifiant.replace(/^#/, "");
  if (!/^[\p{L}\p{N}_]{2,80}$/u.test(mot)) throw new Error("Mot-dièse invalide");
  const trouve = await graph<{ id?: string; data?: { id: string }[] }>("ig_hashtag_search", { user_id: moi, q: mot }, jeton);
  const id = trouve.data?.[0]?.id ?? trouve.id;
  if (!id) return [];
  const r = await graph<{ data?: MediaInstagram[] }>(
    `${id}/recent_media`,
    { user_id: moi, fields: "id,caption,media_type,media_url,permalink,timestamp,children{media_url,media_type}", limit: "25" },
    jeton,
  );
  return (r.data ?? []).flatMap((m) => depuisInstagram(m, `#${mot}`, "instagram_hashtag") ?? []);
}

export interface PostFacebook {
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
}

export function depuisFacebook(p: PostFacebook, compte: string): PublicationSociale | null {
  const url = https(p.permalink_url);
  if (!url) return null;
  return { plateforme: "facebook", compte, url, titre: "", texte: (p.message ?? "").trim(), image: https(p.full_picture), images: [], date: date(p.created_time) };
}

export async function lireFacebook(identifiant: string, nom: string): Promise<PublicationSociale[]> {
  const jeton = process.env.FACEBOOK_PAGE_TOKEN || process.env.META_ACCESS_TOKEN!;
  if (!/^[A-Za-z0-9.\-]{2,80}$/.test(identifiant)) throw new Error("Identifiant de page Facebook invalide");
  const r = await graph<{ data?: PostFacebook[] }>(
    `${identifiant}/posts`,
    { fields: "message,created_time,permalink_url,full_picture", limit: "10" },
    jeton,
  );
  return (r.data ?? []).flatMap((p) => depuisFacebook(p, nom) ?? []);
}

// ─── YouTube ─────────────────────────────────────────────────────────────────

export function lireFluxYouTube(xml: string, nom: string): PublicationSociale[] {
  const analyse = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: true }).parse(xml) as {
    feed?: { title?: string; entry?: unknown };
  };
  const entrees = [analyse.feed?.entry ?? []].flat() as {
    "yt:videoId"?: string;
    title?: string;
    published?: string;
    "media:group"?: { "media:description"?: string; "media:thumbnail"?: { "@_url"?: string } };
  }[];
  return entrees.flatMap((e) => {
    const id = String(e["yt:videoId"] ?? "");
    if (!/^[\w-]{6,20}$/.test(id)) return [];
    return [
      {
        plateforme: "youtube" as const,
        compte: nom || String(analyse.feed?.title ?? "YouTube"),
        url: `https://www.youtube.com/watch?v=${id}`,
        titre: String(e.title ?? "").trim(),
        texte: String(e["media:group"]?.["media:description"] ?? "").trim(),
        image: https(e["media:group"]?.["media:thumbnail"]?.["@_url"]) ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        images: [],
        date: date(e.published),
      },
    ];
  });
}

// Identifiant de chaîne (« UC… ») à partir de ce que l'administration a saisi :
// l'identifiant, une adresse /channel/UC…, ou l'adresse d'une chaîne « @nom ».
export async function identifiantChaine(saisie: string): Promise<string | null> {
  const direct = /(UC[\w-]{22})/.exec(saisie)?.[1];
  if (direct) return direct;
  const nom = /(?:youtube\.com\/)?(@[\w.-]{3,40})/.exec(saisie.trim())?.[1];
  if (!nom) return null;
  const page = await telecharger(`https://www.youtube.com/${nom}`, { delaiMs: 10_000, maxOctets: 2_500_000 }).catch(() => "");
  return /(?:channel_id=|"externalId":"|\/channel\/)(UC[\w-]{22})/.exec(page)?.[1] ?? null;
}

export async function lireYouTube(identifiant: string, nom: string): Promise<PublicationSociale[]> {
  const id = await identifiantChaine(identifiant);
  if (!id) throw new Error("Chaîne YouTube introuvable");
  return lireFluxYouTube(await telecharger(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { delaiMs: 10_000 }), nom);
}

// ─── Une publication ajoutée par son lien ────────────────────────────────────

export interface InfosLien {
  plateforme: "instagram" | "facebook" | "youtube" | "tiktok";
  url: string;
  compte: string;
  texte: string;
  // Vignette fournie par la plateforme (celle de TikTok expire : à copier).
  image: string | null;
}

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

// Reconnaît le lien et demande à la plateforme ce qu'elle publie sur lui. TikTok
// et YouTube répondent sans clé ; Instagram et Facebook ne donnent ni texte ni
// image sans autorisation : l'administration colle alors la légende.
export async function infosLien(brut: string): Promise<InfosLien | null> {
  let lien = brut.trim();
  // Liens courts de TikTok : on suit la redirection pour retrouver la vidéo.
  if (/^https:\/\/(vm|vt)\.tiktok\.com\//.test(lien) || /^https:\/\/www\.tiktok\.com\/t\//.test(lien)) {
    const cible = adresseSure(lien);
    if (cible) {
      const res = await fetch(cible, { redirect: "follow", signal: AbortSignal.timeout(10_000) }).catch(() => null);
      if (res) lien = res.url.split("?")[0];
      await res?.body?.cancel();
    }
  }
  const v = lireVideo(lien);
  if (!v || v.profil) return null;
  const base: InfosLien = { plateforme: v.plateforme, url: v.url, compte: "", texte: "", image: null };
  const service =
    v.plateforme === "tiktok"
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(v.url)}`
      : v.plateforme === "youtube"
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`
        : null;
  if (!service) {
    if (v.plateforme === "instagram") base.url = v.url.replace(/\?.*$/, "");
    return base;
  }
  try {
    const res = await fetch(service, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const o = (await res.json()) as OEmbed;
      base.compte = o.author_name ?? "";
      base.texte = o.title ?? "";
      base.image = https(o.thumbnail_url);
    }
  } catch {
    // service indisponible : la publication reste ajoutée, avec son lecteur
  }
  return base;
}

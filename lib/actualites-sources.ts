export type Portee = "togo" | "afrique" | "monde";

export interface SourceParDefaut {
  nom: string;
  url_flux: string;
  portee: Portee;
  langue: "fr" | "en";
  // Vrai pour un média généraliste : seules les publications qui parlent
  // d'arts visuels sont gardées. Faux pour un média entièrement dédié à l'art.
  filtrer: boolean;
}

// Flux RSS publics, vérifiés le 25/11/2026. Un flux RSS est publié par le média
// pour être repris : on en garde le titre, un résumé court et le lien vers
// l'article d'origine, toujours cité. Instagram et TikTok n'offrent pas de flux
// public (connexion obligatoire, conditions d'utilisation) : ils sont couverts
// par les médias ci-dessous et par la publication manuelle de l'administration.
export const SOURCES_PAR_DEFAUT: SourceParDefaut[] = [
  // Togo
  { nom: "Icilome", url_flux: "https://www.icilome.com/rss", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Togo-Presse", url_flux: "https://togopresse.tg/feed", portee: "togo", langue: "fr", filtrer: true },
  { nom: "24 Heure Info", url_flux: "https://www.24heureinfo.com/feed", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Togocultures", url_flux: "https://www.togocultures.com/feed", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Culture au pluriel", url_flux: "https://cultureaupluriel.wordpress.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Le Nouveau Reporter", url_flux: "https://lenouveaureporter.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  // Afrique
  { nom: "ART AFRICA", url_flux: "https://www.artafricamagazine.org/feed/", portee: "afrique", langue: "en", filtrer: false },
  { nom: "Africanews", url_flux: "https://www.africanews.com/feed/rss", portee: "afrique", langue: "en", filtrer: true },
  // Monde
  { nom: "Connaissance des Arts", url_flux: "https://www.connaissancedesarts.com/feed/", portee: "monde", langue: "fr", filtrer: false },
  { nom: "Beaux Arts", url_flux: "https://www.beauxarts.com/feed/", portee: "monde", langue: "fr", filtrer: false },
  { nom: "Le Journal des Arts", url_flux: "https://www.lejournaldesarts.fr/rss.xml", portee: "monde", langue: "fr", filtrer: false },
  { nom: "Artnet News", url_flux: "https://news.artnet.com/feed", portee: "monde", langue: "en", filtrer: false },
  { nom: "ARTnews", url_flux: "https://www.artnews.com/feed/", portee: "monde", langue: "en", filtrer: false },
  { nom: "The Art Newspaper", url_flux: "https://www.theartnewspaper.com/rss.xml", portee: "monde", langue: "en", filtrer: false },
  { nom: "Artsy", url_flux: "https://www.artsy.net/rss/news", portee: "monde", langue: "en", filtrer: false },
  { nom: "Artforum", url_flux: "https://www.artforum.com/feed/", portee: "monde", langue: "en", filtrer: false },
  { nom: "Colossal", url_flux: "https://www.thisiscolossal.com/feed/", portee: "monde", langue: "en", filtrer: false },
  { nom: "Designboom", url_flux: "https://www.designboom.com/art/feed/", portee: "monde", langue: "en", filtrer: false },
  { nom: "Artdaily", url_flux: "https://www.artdaily.com/rss.asp", portee: "monde", langue: "en", filtrer: false },
];

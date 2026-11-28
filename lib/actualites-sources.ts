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

// Comptes et mots-dièse des réseaux sociaux suivis au départ. Lus par les voies
// officielles uniquement (voir lib/actualites-social.ts) : ils attendent la
// connexion Meta pour Instagram ; l'administration en ajoute et en retire.
export const SOURCES_SOCIALES_PAR_DEFAUT: {
  plateforme: "instagram" | "instagram_hashtag" | "facebook" | "youtube";
  identifiant: string;
  nom: string;
  portee: Portee;
  filtrer: boolean;
}[] = [
  { plateforme: "instagram", identifiant: "artova.corp", nom: "ArTova", portee: "togo", filtrer: false },
  { plateforme: "instagram", identifiant: "ablasikaakpaloo", nom: "A. Sika", portee: "togo", filtrer: false },
  { plateforme: "instagram", identifiant: "agnassanmuseepaulahyi", nom: "Musée Agnassan Paul Ahyi", portee: "togo", filtrer: false },
  { plateforme: "instagram_hashtag", identifiant: "arttogolais", nom: "#arttogolais", portee: "togo", filtrer: false },
  { plateforme: "instagram_hashtag", identifiant: "artistetogolais", nom: "#artistetogolais", portee: "togo", filtrer: false },
  { plateforme: "instagram_hashtag", identifiant: "togoart", nom: "#togoart", portee: "togo", filtrer: true },
];

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
  { nom: "La Cinquième", url_flux: "https://www.lacinquieme.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Afrikelles", url_flux: "https://www.afrikelles.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Actu Togo", url_flux: "https://actu-togo.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "La Une Togo", url_flux: "https://launetogo.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Journal du Togo", url_flux: "https://www.journaldutogo.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "ActuBilan", url_flux: "https://actubilan.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Flash Info Togo", url_flux: "https://flashinfotogo.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Culture au pluriel", url_flux: "https://cultureaupluriel.wordpress.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Le Nouveau Reporter", url_flux: "https://lenouveaureporter.com/feed/", portee: "togo", langue: "fr", filtrer: true },
  // Rubriques culture (ajoutées le 28/11/2026) : plus d'actualité togolaise de l'art.
  { nom: "La Cinquième Culture", url_flux: "https://www.lacinquieme.tg/category/culture/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Icilome Culture", url_flux: "https://icilome.com/category/culture/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Gakogoe", url_flux: "https://www.gakogoe.tg/category/culture/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "AfreePress Culture", url_flux: "https://afreepress.net/category/culture/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "Le Clik", url_flux: "https://leclik.tg/feed/", portee: "togo", langue: "fr", filtrer: true },
  { nom: "L'émissaire", url_flux: "https://lemissaire.tg/category/culture/feed/", portee: "togo", langue: "fr", filtrer: true },
  // Afrique
  { nom: "ART AFRICA", url_flux: "https://www.artafricamagazine.org/feed/", portee: "afrique", langue: "en", filtrer: false },
  { nom: "Africa Blooming", url_flux: "https://africablooming.com/feed/", portee: "afrique", langue: "en", filtrer: true },
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

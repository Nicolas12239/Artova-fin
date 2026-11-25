import { createHash } from "node:crypto";
import { empreinteUrl } from "./actualites-flux";
import type { Categorie } from "./actualites-commun";
import type { Portee } from "./actualites-sources";

export interface ArticleRedaction {
  // Identifiant stable : permet de ne poser l'article qu'une seule fois.
  cle: string;
  titre: string;
  resume: string;
  contenu?: string;
  source_nom: string;
  url_source?: string;
  image_url?: string;
  portee: Portee;
  categorie: Categorie;
  importance: number;
  a_la_une?: boolean;
  publie_le: string;
  evenement_debut?: string;
  evenement_fin?: string;
  lieu?: string;
}

// Un article qui cite une source garde la même empreinte que celle de son
// adresse : la collecte automatique ne le republiera pas en double.
export function empreinteRedaction(a: ArticleRedaction): string {
  return a.url_source
    ? empreinteUrl(a.url_source)
    : createHash("sha1").update(`redaction:${a.cle}`).digest("hex");
}

// Les rendez-vous de l'art à Lomé, fin novembre 2026. Les deux premiers sont
// documentés par la presse (sources citées). Les deux derniers reprennent
// uniquement ce que l'équipe ArTova a communiqué : lieu, titre et dates seront
// à compléter depuis l'administration (Actualités › Modifier).
export const ARTICLES_REDACTION: ArticleRedaction[] = [
  {
    cle: "nutafe-nos-cheveux-notre-identite",
    titre: "« Nos cheveux, notre identité » : seize créateurs réunis à Nutafe Togo",
    resume:
      "Jusqu'au 29 novembre, l'espace Nutafe Togo, à Hédzranawoé Tingamé, accueille une exposition collective consacrée au cheveu africain : seize créateurs retenus après un casting ouvert, sous la direction artistique d'Eli Dush.",
    contenu: [
      "Du 23 au 29 novembre 2026, l'espace Nutafe Togo, à Hédzranawoé Tingamé, non loin du rond-point Tinga à Lomé, accueille l'exposition collective « Nos cheveux, notre identité ». Elle se place sous le signe de la célébration, de la réflexion, du dialogue et de la réappropriation.",
      "Le projet, lancé par les responsables de Nutafe et leurs collaborateurs, rassemble seize créateurs choisis à l'issue d'un casting ouvert : Amegne Blibo, Missoh Kossi David, Amouzou Art-Ayi, Alvine La Plume Divine, Julien Art Creation, Johnford, Professeur Jacques, Christofort, Miss Flora, Wayiii, Kim Pillar, C. Koudakpo, Marie C. Eusebio, Robosso, Al Bayan Kierfel et Eli Dush.",
      "Eli Dush y tient une place à part : en plus de présenter son œuvre « Extension mystique », il assure la curation et la direction artistique de l'exposition. Son travail déplace la réflexion vers le spirituel et le vivant, en interrogeant ce que les cheveux portent de sacré et la manière dont les sociétés honorent cette sève vitale.",
      "Sur les cimaises, on trouve des portraits, des compositions graphiques et des créations en couleurs vives ou en noir et blanc. L'exposition se visite chaque jour de 11 h à 19 h jusqu'au 29 novembre.",
    ].join("\n\n"),
    source_nom: "Culture au pluriel",
    url_source: "https://cultureaupluriel.wordpress.com/2026/11/24/extension-mystique-le-sacre-du-cheveu-avec-eli-dush/",
    image_url:
      "https://i0.wp.com/cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img-20261124-wa0063.jpg?fit=1200%2C1191&ssl=1",
    portee: "togo",
    categorie: "expositions",
    importance: 9,
    a_la_une: true,
    publie_le: "2026-11-24T10:00:00Z",
    evenement_debut: "2026-11-23",
    evenement_fin: "2026-11-29",
    lieu: "Nutafe Togo, Hédzranawoé Tingamé, Lomé",
  },
  {
    cle: "artemis-la-table-des-matieres",
    titre: "« La Table des Matières » : Laka et Jean-Daniel Rohrer à la galerie ARTEMIS",
    resume:
      "Du 13 au 25 novembre, la galerie ARTEMIS de Lomé a réuni les univers de Laka et de Jean-Daniel Rohrer dans une exposition pensée comme un livre ouvert, où chaque œuvre serait un chapitre. Un talk show a prolongé la rencontre.",
    contenu: [
      "Deux artistes venus d'horizons différents, un même voyage : « La Table des Matières » a fait dialoguer, du 13 au 25 novembre 2026 à la galerie ARTEMIS de Lomé, les univers de Laka et de Jean-Daniel Rohrer. L'exposition est pensée comme un livre grand ouvert dont chaque pièce dévoilerait un chapitre.",
      "Les langages visuels des deux artistes s'y croisent et s'entrelacent : les signes du passé répondent aux questionnements du présent. Les œuvres abordent de grands thèmes universels, la mémoire, la quête d'identité, les espoirs partagés et la résilience, dans un espace où la liberté de l'esprit s'affranchit des frontières géographiques, culturelles et temporelles.",
      "Un talk show a également été organisé autour de l'exposition, pour prolonger la rencontre avec le public.",
    ].join("\n\n"),
    source_nom: "Le Nouveau Reporter",
    url_source: "https://lenouveaureporter.com/expo-la-table-des-matieres-quand-laka-et-jean-daniel-rohrer-ouvrent-le-grand-livre-de-lart/",
    image_url:
      "https://lenouveaureporter.com/wp-content/uploads/2026/10/La-Table-des-Matieres-quand-Laka-et-Jean-Daniel-Rohrer-ouvrent-le-grand-livre-de-lart.jpeg",
    portee: "togo",
    categorie: "expositions",
    importance: 8,
    publie_le: "2026-11-25T08:00:00Z",
    evenement_debut: "2026-11-13",
    evenement_fin: "2026-11-25",
    lieu: "Galerie ARTEMIS, Lomé",
  },
  {
    cle: "ebene-musee-paul-ahyi",
    titre: "Ebene, artiste d'origine camerounaise, expose au musée Paul Ahyi",
    resume:
      "L'artiste Ebene, d'origine camerounaise, a présenté son travail au musée Paul Ahyi (Agnassan), à Lomé, un lieu dédié à la création contemporaine africaine.",
    contenu:
      "Le musée Paul Ahyi, à Agnassan, accueille des expositions d'artistes, notamment togolais. Cette fois, c'est Ebene, artiste d'origine camerounaise, qui y a présenté ses œuvres.\n\nLe titre de l'exposition, les dates et les œuvres montrées seront précisés sur cette page dès que l'artiste ou le musée les aura confirmés.",
    source_nom: "ArTova",
    portee: "togo",
    categorie: "expositions",
    importance: 7,
    publie_le: "2026-11-25T09:00:00Z",
    lieu: "Musée Paul Ahyi, Agnassan, Lomé",
  },
  {
    cle: "a-sika-exposition-vendredi",
    titre: "A. Sika expose ce vendredi à Lomé",
    resume:
      "L'artiste A. Sika présente une exposition ce vendredi 27 novembre 2026 à Lomé. Le lieu et le programme seront précisés ici dès leur confirmation.",
    source_nom: "ArTova",
    portee: "togo",
    categorie: "expositions",
    importance: 8,
    publie_le: "2026-11-25T09:30:00Z",
    evenement_debut: "2026-11-27",
    lieu: "Lomé",
  },
];

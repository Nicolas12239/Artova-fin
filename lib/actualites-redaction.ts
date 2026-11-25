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
  // Une adresse de vidéo (TikTok, Instagram, YouTube) par ligne.
  videos?: string;
  // Page d'un artiste ArTova (son identifiant dans l'adresse /artistes/…).
  artiste_slug?: string;
  // Photos supplémentaires (une adresse par ligne) et crédit de l'image de couverture.
  images?: string;
  credit_image?: string;
  // Textes en anglais et en allemand ; le français est le texte de base.
  traductions?: Partial<Record<"en" | "de", { titre: string; resume: string; contenu?: string }>>;
  // À augmenter pour réécrire la fiche déjà publiée (voir lib/db.ts).
  revision: number;
}

// Un article qui cite une source garde la même empreinte que celle de son
// adresse : la collecte automatique ne le republiera pas en double.
export function empreinteRedaction(a: ArticleRedaction): string {
  return a.url_source
    ? empreinteUrl(a.url_source)
    : createHash("sha1").update(`redaction:${a.cle}`).digest("hex");
}

// Identifiants d'articles de la rédaction qui ont été renommés : leur ancienne
// fiche est supprimée au démarrage pour éviter les doublons.
export const CLES_OBSOLETES = ["a-sika-exposition-vendredi"];

// Les rendez-vous de l'art à Lomé, fin novembre 2026, rédigés en français (texte
// de base) avec leurs traductions anglaise et allemande. Chaque fiche cite ses
// sources. Les vidéos Instagram de Nutafe et d'ArTova, comme les images d'Ebene,
// sont à ajouter depuis l'administration (Actualités › Modifier).
export const ARTICLES_REDACTION: ArticleRedaction[] = [
  {
    cle: "nutafe-nos-cheveux-notre-identite",
    titre: "« Nos cheveux, notre identité » : seize créateurs réunis à Nutafe Togo",
    resume:
      "Jusqu'au 29 novembre, l'espace Nutafe Togo, à Hédzranawoé Tingamé, accueille une exposition collective consacrée au cheveu africain : seize créateurs retenus après un casting ouvert, sous la direction artistique d'Eli Dush.",
    contenu: [
      "Du 23 au 29 novembre 2026, l'espace Nutafe Togo, à Hédzranawoé Tingamé, non loin du rond-point Tinga à Lomé, accueille l'exposition collective « Nos cheveux, notre identité ». Le vernissage a ouvert l'exposition aux visites quotidiennes, de 11 h à 19 h, jusqu'au 29 novembre.",
      "Le thème et sa signification. Le projet, lancé par les responsables de Nutafe et leurs collaborateurs, se place sous le signe de la célébration, de la réflexion, du dialogue et de la réappropriation. Le cheveu africain y cesse d'être un simple détail esthétique ou un motif de mode : il devient le miroir d'une mémoire collective, d'une responsabilité culturelle et d'une identité partagée, au cœur de Lomé.",
      "Les seize créateurs. Ils ont été retenus à l'issue d'un casting ouvert : Amegne Blibo, Missoh Kossi David, Amouzou Art-Ayi, Alvine La Plume Divine, Julien Art Creation, Johnford, Professeur Jacques, Christofort, Miss Flora, Wayiii, Kim Pillar, C. Koudakpo, Marie C. Eusebio, Robosso, Al Bayan Kierfel et Eli Dush. Travailler sur un même motif oblige chacun à chercher sa propre voie, à défendre une écriture singulière et à assumer ses choix esthétiques et conceptuels face au public : l'exposition devient un espace de confrontation féconde.",
      "« Extension mystique », d'Eli Dush. Eli Dush tient une place à part : il présente son œuvre et assure aussi la curation et la direction artistique de l'exposition, aux côtés de l'équipe de Nutafe. Son travail déplace la réflexion vers le spirituel, le biologique et le philosophique. Il interroge ce qu'il y a de vivant dans les cheveux, la vérité du sang qui les nourrit et la manière dont les sociétés honorent cette sève vitale. Il s'arrête aussi sur la persistance apparente du cheveu après la mort : cette énigme suffit-elle à lui conférer une sacralité particulière ? Respectons-nous réellement cette dimension sacrée, et comment passe-t-on du respect des codes de sa propre communauté à celui des autres ?",
      "Ce que l'on voit. Sur les cimaises : des portraits, des compositions graphiques, des créations hautes en couleur ou en noir et blanc. Dans les salles comme à l'extérieur de Nutafe, l'ambiance est à l'échange : le public est invité à prolonger les questions posées bien au-delà de l'exposition.",
    ].join("\n\n"),
    source_nom: "Culture au pluriel",
    url_source: "https://cultureaupluriel.wordpress.com/2026/11/24/extension-mystique-le-sacre-du-cheveu-avec-eli-dush/",
    image_url:
      "https://i0.wp.com/cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img-20261124-wa0063.jpg?fit=1200%2C1191&ssl=1",
    images: [
      "https://cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img_20261123_184349_203.jpg?w=1024",
      "https://cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img_20261123_184326_088.jpg?w=1024",
      "https://cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img_20261123_184235_266.jpg?w=1024",
      "https://cultureaupluriel.wordpress.com/wp-content/uploads/2026/11/img_20261123_184740_603.jpg?w=1024",
    ].join("\n"),
    credit_image: "Culture au pluriel",
    portee: "togo",
    categorie: "expositions",
    importance: 9,
    publie_le: "2026-11-24T10:00:00Z",
    revision: 3,
    evenement_debut: "2026-11-23",
    evenement_fin: "2026-11-29",
    lieu: "Nutafe Togo, Hédzranawoé Tingamé, Lomé",
    traductions: {
      en: {
        titre: "“Our Hair, Our Identity”: sixteen creators gathered at Nutafe Togo",
        resume:
          "Until 29 November, Nutafe Togo in Hédzranawoé Tingamé hosts a group exhibition on African hair: sixteen creators chosen through an open call, under the artistic direction of Eli Dush.",
        contenu: [
          "From 23 to 29 November 2026, the Nutafe Togo space in Hédzranawoé Tingamé, near the Tinga roundabout in Lomé, hosts the group exhibition “Nos cheveux, notre identité” (“Our Hair, Our Identity”). After the opening night, the show is open to visitors every day from 11 am to 7 pm until 29 November.",
          "The theme and its meaning. Launched by Nutafe’s managers and their collaborators, the project is built around celebration, reflection, dialogue and reclaiming. African hair is no longer a mere aesthetic detail or a fashion motif: it becomes the mirror of a collective memory, of a cultural responsibility and of a shared identity, in the heart of Lomé.",
          "The sixteen creators. They were selected through an open call: Amegne Blibo, Missoh Kossi David, Amouzou Art-Ayi, Alvine La Plume Divine, Julien Art Creation, Johnford, Professeur Jacques, Christofort, Miss Flora, Wayiii, Kim Pillar, C. Koudakpo, Marie C. Eusebio, Robosso, Al Bayan Kierfel and Eli Dush. Working on a single motif forces each of them to find their own path, to defend a singular voice and to stand by their aesthetic and conceptual choices in front of the public: the show becomes a space of fruitful confrontation.",
          "“Extension mystique” by Eli Dush. Eli Dush holds a special place: he shows his own work and also handles the curation and artistic direction of the exhibition, alongside the Nutafe team. His work moves the reflection towards the spiritual, the biological and the philosophical. He asks what is alive in hair, what is the truth of the blood that nourishes it, and how societies honour this vital sap. He also considers the apparent persistence of hair after death: is that enigma enough to give it a particular sacredness? Do we really respect this sacred dimension, and how do we move from respecting the codes of our own community to respecting those of others?",
          "What you will see. On the walls: portraits, graphic compositions, works in bold colour or in black and white. Inside the rooms and outside Nutafe, the atmosphere is one of exchange: visitors are invited to carry the questions raised well beyond the exhibition.",
        ].join("\n\n"),
      },
      de: {
        titre: "„Unsere Haare, unsere Identität“: sechzehn Kreative bei Nutafe Togo",
        resume:
          "Noch bis zum 29. November zeigt Nutafe Togo in Hédzranawoé Tingamé eine Gruppenausstellung über afrikanisches Haar: sechzehn Kreative, ausgewählt in einem offenen Casting, unter der künstlerischen Leitung von Eli Dush.",
        contenu: [
          "Vom 23. bis 29. November 2026 zeigt der Raum Nutafe Togo in Hédzranawoé Tingamé, unweit des Kreisverkehrs Tinga in Lomé, die Gruppenausstellung „Nos cheveux, notre identité“ („Unsere Haare, unsere Identität“). Nach der Vernissage ist die Ausstellung bis zum 29. November täglich von 11 bis 19 Uhr geöffnet.",
          "Das Thema und seine Bedeutung. Das von den Verantwortlichen von Nutafe und ihren Mitstreitern ins Leben gerufene Projekt steht im Zeichen von Feier, Reflexion, Dialog und Wiederaneignung. Afrikanisches Haar ist hier nicht länger ein bloßes ästhetisches Detail oder ein Modemotiv, sondern der Spiegel eines kollektiven Gedächtnisses, einer kulturellen Verantwortung und einer gemeinsamen Identität im Herzen von Lomé.",
          "Die sechzehn Kreativen. Sie wurden in einem offenen Casting ausgewählt: Amegne Blibo, Missoh Kossi David, Amouzou Art-Ayi, Alvine La Plume Divine, Julien Art Creation, Johnford, Professeur Jacques, Christofort, Miss Flora, Wayiii, Kim Pillar, C. Koudakpo, Marie C. Eusebio, Robosso, Al Bayan Kierfel und Eli Dush. Die Arbeit an einem gemeinsamen Motiv zwingt jeden, einen eigenen Weg zu suchen, eine eigene Handschrift zu verteidigen und seine ästhetischen und konzeptionellen Entscheidungen vor dem Publikum zu vertreten: Die Ausstellung wird zu einem Ort fruchtbarer Auseinandersetzung.",
          "„Extension mystique“ von Eli Dush. Eli Dush nimmt eine besondere Stellung ein: Er zeigt seine eigene Arbeit und übernimmt zugleich Kuration und künstlerische Leitung der Ausstellung, gemeinsam mit dem Team von Nutafe. Seine Arbeit verlagert die Reflexion ins Spirituelle, Biologische und Philosophische. Er fragt, was an den Haaren lebendig ist, was es mit dem Blut auf sich hat, das sie nährt, und wie Gesellschaften diesen Lebenssaft ehren. Er geht auch dem scheinbaren Fortbestehen des Haares nach dem Tod nach: Genügt dieses Rätsel, um ihm eine besondere Heiligkeit zu verleihen? Achten wir diese heilige Dimension wirklich, und wie gelangt man von der Achtung der Regeln der eigenen Gemeinschaft zur Achtung der Regeln anderer?",
          "Was zu sehen ist. An den Wänden: Porträts, grafische Kompositionen, farbenfrohe oder schwarz-weiße Arbeiten. In den Räumen wie vor dem Haus von Nutafe herrscht eine Atmosphäre des Austauschs: Die Besucher sind eingeladen, die aufgeworfenen Fragen weit über die Ausstellung hinaus weiterzudenken.",
        ].join("\n\n"),
      },
    },
  },
  {
    cle: "artemis-la-table-des-matieres",
    titre: "« La Table des Matières » : Laka et Jean-Daniel Rohrer à la galerie ARTEMIS",
    resume:
      "Du 13 au 25 novembre, la galerie ARTEMIS de Lomé a réuni les univers de Laka et de Jean-Daniel Rohrer dans une exposition pensée comme un livre ouvert, où chaque œuvre serait un chapitre. Un talk show a prolongé la rencontre.",
    contenu: [
      "Deux artistes venus d'horizons différents, un même voyage : « La Table des Matières » a fait dialoguer, du 13 au 25 novembre 2026 à la galerie ARTEMIS de Lomé, les univers de Laka et de Jean-Daniel Rohrer. L'exposition est pensée comme un livre grand ouvert dont chaque pièce dévoilerait un chapitre.",
      "Les langages visuels des deux artistes s'y croisent et s'entrelacent : les signes du passé répondent aux questionnements du présent. Les émotions s'y lient naturellement, créant une synchronicité dès les premiers pas dans l'espace d'exposition.",
      "Les œuvres abordent de grands thèmes universels : la mémoire, la quête d'identité, les espoirs partagés et la résilience. Chaque pièce se lit comme une page tournée du grand livre de la vie, traversée par des expériences communes. Si les individualités artistiques y sont fortes, l'ensemble dégage une unicité saisissante dans la transmission et le regard.",
      "C'est enfin une invitation à explorer des territoires où la liberté de l'esprit et l'universalité s'affranchissent des frontières géographiques, culturelles et temporelles. Un talk show a également été organisé autour de l'exposition, pour prolonger la rencontre avec le public.",
    ].join("\n\n"),
    source_nom: "Le Nouveau Reporter",
    url_source: "https://lenouveaureporter.com/expo-la-table-des-matieres-quand-laka-et-jean-daniel-rohrer-ouvrent-le-grand-livre-de-lart/",
    image_url:
      "https://lenouveaureporter.com/wp-content/uploads/2026/10/La-Table-des-Matieres-quand-Laka-et-Jean-Daniel-Rohrer-ouvrent-le-grand-livre-de-lart.jpeg",
    credit_image: "Le Nouveau Reporter",
    portee: "togo",
    categorie: "expositions",
    importance: 8,
    publie_le: "2026-11-25T08:00:00Z",
    revision: 2,
    evenement_debut: "2026-11-13",
    evenement_fin: "2026-11-25",
    lieu: "Galerie ARTEMIS, Lomé",
    traductions: {
      en: {
        titre: "“The Table of Contents”: Laka and Jean-Daniel Rohrer at ARTEMIS gallery",
        resume:
          "From 13 to 25 November, ARTEMIS gallery in Lomé brought together the worlds of Laka and Jean-Daniel Rohrer in an exhibition conceived as an open book, in which each work is a chapter. A talk show extended the encounter.",
        contenu: [
          "Two artists from different horizons, one journey: “La Table des Matières” (“The Table of Contents”) staged a dialogue between the worlds of Laka and Jean-Daniel Rohrer at ARTEMIS gallery in Lomé, from 13 to 25 November 2026. The exhibition is conceived as a wide-open book in which each piece reveals a chapter.",
          "The two artists’ visual languages cross and intertwine: signs from the past answer the questions of the present. Emotions connect naturally, creating a synchronicity from the very first steps into the exhibition space.",
          "The works deal with great universal themes: memory, the search for identity, shared hopes and resilience. Each piece reads like a turned page of the great book of life, shaped by common experiences. While the artistic individualities are strong, the whole conveys a striking unity in transmission and outlook.",
          "It is, finally, an invitation to explore territories where freedom of mind and universality break free from geographical, cultural and temporal borders. A talk show was also organised around the exhibition to extend the encounter with the public.",
        ].join("\n\n"),
      },
      de: {
        titre: "„Das Inhaltsverzeichnis“: Laka und Jean-Daniel Rohrer in der Galerie ARTEMIS",
        resume:
          "Vom 13. bis 25. November brachte die Galerie ARTEMIS in Lomé die Welten von Laka und Jean-Daniel Rohrer in einer Ausstellung zusammen, die wie ein aufgeschlagenes Buch gedacht ist, in dem jedes Werk ein Kapitel ist. Eine Talkshow setzte die Begegnung fort.",
        contenu: [
          "Zwei Künstler aus verschiedenen Welten, eine gemeinsame Reise: „La Table des Matières“ („Das Inhaltsverzeichnis“) ließ vom 13. bis 25. November 2026 in der Galerie ARTEMIS in Lomé die Welten von Laka und Jean-Daniel Rohrer in einen Dialog treten. Die Ausstellung ist wie ein weit aufgeschlagenes Buch gedacht, in dem jedes Stück ein Kapitel enthüllt.",
          "Die visuellen Sprachen der beiden Künstler kreuzen und verflechten sich: Zeichen der Vergangenheit antworten auf die Fragen der Gegenwart. Die Emotionen verbinden sich ganz natürlich und erzeugen vom ersten Schritt in den Ausstellungsraum an eine Synchronizität.",
          "Die Werke behandeln große universelle Themen: Erinnerung, die Suche nach Identität, gemeinsame Hoffnungen und Resilienz. Jedes Stück liest sich wie eine umgeblätterte Seite im großen Buch des Lebens, durchzogen von gemeinsamen Erfahrungen. Obwohl die künstlerischen Persönlichkeiten stark sind, entsteht im Ganzen eine eindrucksvolle Einheit in Vermittlung und Blick.",
          "Schließlich ist es eine Einladung, Gebiete zu erkunden, in denen Freiheit des Geistes und Universalität geografische, kulturelle und zeitliche Grenzen überwinden. Rund um die Ausstellung wurde außerdem eine Talkshow veranstaltet, um die Begegnung mit dem Publikum fortzusetzen.",
        ].join("\n\n"),
      },
    },
  },
  {
    cle: "ebene-musee-paul-ahyi",
    titre: "Barreso'o Ebene, peintre hyperréaliste camerounais, expose au musée Paul Ahyi",
    resume:
      "Le peintre camerounais Barreso'o Ebene, né à Garoua et connu pour ses portraits hyperréalistes en monochrome, a exposé au musée Paul Ahyi (Agnassan), à Lomé.",
    contenu: [
      "L'artiste d'origine camerounaise Barreso'o Ebene a présenté son travail au musée Paul Ahyi, à Agnassan (Lomé), un lieu dédié à la création contemporaine africaine, qui accueille aussi des expositions et des résidences d'artistes.",
      "Né en 1996 à Garoua, formé au dessin et à la peinture à l'école d'art D'jino, il s'inscrit dans le courant du réalisme et de l'hyperréalisme. Ses portraits, peints en monochrome, interrogent l'identité, la dignité et la vie contemporaine : il explique peindre ses modèles fidèlement, sans altérer leurs traits. Il cite Léonard de Vinci et Kehinde Wiley parmi ses influences.",
      "Le titre de l'exposition, ses dates et les œuvres montrées seront précisés sur cette page dès leur confirmation, avec des images et des vidéos de ses toiles. Le parcours de l'artiste est établi d'après AGI Fine Art et ArtMajeur.",
    ].join("\n\n"),
    source_nom: "ArTova",
    url_source: "https://agifineart.com/artists/barresoo-ebene/",
    portee: "togo",
    categorie: "expositions",
    importance: 8,
    publie_le: "2026-11-25T09:00:00Z",
    lieu: "Musée Paul Ahyi, Agnassan, Lomé",
    revision: 3,
    traductions: {
      en: {
        titre: "Barreso'o Ebene, Cameroonian hyperrealist painter, exhibits at the Paul Ahyi Museum",
        resume:
          "Cameroonian painter Barreso'o Ebene, born in Garoua and known for his hyperrealist monochrome portraits, has exhibited at the Paul Ahyi Museum (Agnassan) in Lomé.",
        contenu: [
          "Artist Barreso'o Ebene, of Cameroonian origin, has shown his work at the Paul Ahyi Museum in Agnassan (Lomé), a venue dedicated to contemporary African creation that also hosts exhibitions and artist residencies.",
          "Born in 1996 in Garoua and trained in drawing and painting at the D'jino art school, he belongs to the realist and hyperrealist current. His monochrome portraits question identity, dignity and contemporary life: he says he paints his sitters faithfully, without altering their features. He names Leonardo da Vinci and Kehinde Wiley among his influences.",
          "The exhibition’s title, dates and the works shown will be added to this page once confirmed, together with images and videos of his canvases. The artist’s background is drawn from AGI Fine Art and ArtMajeur.",
        ].join("\n\n"),
      },
      de: {
        titre: "Barreso'o Ebene, kamerunischer Hyperrealist, stellt im Museum Paul Ahyi aus",
        resume:
          "Der kamerunische Maler Barreso'o Ebene, geboren in Garoua und bekannt für seine hyperrealistischen Porträts in Monochromie, hat im Museum Paul Ahyi (Agnassan) in Lomé ausgestellt.",
        contenu: [
          "Der Künstler Barreso'o Ebene kamerunischer Herkunft hat seine Arbeiten im Museum Paul Ahyi in Agnassan (Lomé) gezeigt, einem Ort für zeitgenössisches afrikanisches Schaffen, der auch Ausstellungen und Künstlerresidenzen beherbergt.",
          "1996 in Garoua geboren und an der Kunstschule D'jino in Zeichnen und Malen ausgebildet, steht er in der Strömung des Realismus und Hyperrealismus. Seine Porträts in Monochromie befragen Identität, Würde und das heutige Leben: Er sagt, er male seine Modelle getreu und ohne ihre Züge zu verändern. Zu seinen Einflüssen nennt er Leonardo da Vinci und Kehinde Wiley.",
          "Titel, Daten und gezeigte Werke der Ausstellung werden auf dieser Seite ergänzt, sobald sie bestätigt sind, zusammen mit Bildern und Videos seiner Gemälde. Der Werdegang des Künstlers stützt sich auf AGI Fine Art und ArtMajeur.",
        ].join("\n\n"),
      },
    },
  },
  {
    cle: "a-sika-exposition-collective-vendredi",
    titre: "A. Sika : une exposition collective ce vendredi à Lomé",
    resume:
      "L'artiste plasticienne togolaise A. Sika participe à une exposition collective ce vendredi 27 novembre 2026 à Lomé. Autodidacte, elle explore la frontière entre lumière et ombre, entre structure et accident.",
    contenu: [
      "L'artiste plasticienne A. Sika participe à une exposition collective ce vendredi 27 novembre 2026 à Lomé. Le lieu exact, les horaires et la liste des artistes seront publiés ici dès leur confirmation.",
      "Autodidacte, A. Sika revendique une liberté qui se lit dans sa démarche comme dans son rapport à ses œuvres : sa pratique échappe aux conventions techniques et fait de l'expérimentation un fil conducteur. Son originalité tient à l'association de matériaux et de couleurs qui, en apparence, s'opposent. De cette tension naît une esthétique singulière, où le désordre se mue en ordre.",
      "Elle explore la frontière entre lumière et ombre, entre structure et accident, et résume sa démarche d'une phrase : « De l'apparent désordre naît l'organisation… ». Deux de ses œuvres sont à découvrir sur ArTova : « Nâ – La danse des perles » et « Wadjawadja ».",
      "Son parcours compte de nombreuses expositions collectives : la Biennale de Dakar en 2018 (village des arts), « Nexus » (peinture et sculpture) au Goethe-Institut de Lomé en 2020, le Palais de Lomé en avril 2021 puis en mai 2023 avec « Dig Where You Stand », la galerie de l'hôtel Sarakawa en janvier 2023, et la Roumanie en 2024 avec l'association Karp Kamina et INTER Art. Elle a aussi animé un atelier de création en 2025. Ce parcours est tiré de sa fiche sur ArTova.",
    ].join("\n\n"),
    source_nom: "ArTova",
    image_url: "/fichiers/9e09e208d222420ca8c1acb310b315d2",
    images: ["/fichiers/a1dd01fe27bc48aabd91278345ef17dc", "/fichiers/bb20bee787074fd3b18c3ce0711749dc", "/fichiers/bf64d461a14b4193a2c500d937f099c7"].join("\n"),
    credit_image: "A. Sika / ArTova",
    portee: "togo",
    categorie: "expositions",
    importance: 10,
    a_la_une: true,
    publie_le: "2026-11-25T12:00:00Z",
    evenement_debut: "2026-11-27",
    lieu: "Lomé",
    artiste_slug: "a-sika",
    revision: 3,
    traductions: {
      en: {
        titre: "A. Sika: a group exhibition this Friday in Lomé",
        resume:
          "Togolese visual artist A. Sika takes part in a group exhibition this Friday, 27 November 2026, in Lomé. Self-taught, she explores the border between light and shadow, between structure and accident.",
        contenu: [
          "Visual artist A. Sika takes part in a group exhibition this Friday, 27 November 2026, in Lomé. The exact venue, opening hours and list of artists will be published here as soon as they are confirmed.",
          "Self-taught, A. Sika claims a freedom that shows in her approach as much as in her relationship to her works: her practice escapes technical conventions and makes experimentation its common thread. Her originality lies in combining materials and colours that seem, at first sight, to oppose each other. From this tension comes a singular aesthetic in which disorder turns into order.",
          "She explores the border between light and shadow, between structure and accident, and sums up her approach in one line: “Out of apparent disorder, organisation is born…”. Two of her works can be discovered on ArTova: “Nâ – La danse des perles” (“The Dance of the Pearls”) and “Wadjawadja”.",
          "Her career includes many group exhibitions: the Dakar Biennale in 2018 (Village of the Arts), “Nexus” (painting and sculpture) at the Goethe-Institut in Lomé in 2020, the Palais de Lomé in April 2021 and again in May 2023 with “Dig Where You Stand”, the gallery of the Sarakawa hotel in January 2023, and Romania in 2024 with the Karp Kamina association and INTER Art. She also led a creative workshop in 2025. This background is taken from her profile on ArTova.",
        ].join("\n\n"),
      },
      de: {
        titre: "A. Sika: eine Gruppenausstellung an diesem Freitag in Lomé",
        resume:
          "Die togoische Künstlerin A. Sika nimmt an diesem Freitag, dem 27. November 2026, an einer Gruppenausstellung in Lomé teil. Als Autodidaktin erkundet sie die Grenze zwischen Licht und Schatten, zwischen Struktur und Zufall.",
        contenu: [
          "Die bildende Künstlerin A. Sika nimmt an diesem Freitag, dem 27. November 2026, an einer Gruppenausstellung in Lomé teil. Genauer Ort, Öffnungszeiten und die Liste der Künstler werden hier veröffentlicht, sobald sie bestätigt sind.",
          "Als Autodidaktin beansprucht A. Sika eine Freiheit, die sich in ihrer Herangehensweise wie im Verhältnis zu ihren Werken zeigt: Ihre Praxis entzieht sich technischen Konventionen und macht das Experiment zum roten Faden. Ihre Originalität liegt in der Verbindung von Materialien und Farben, die einander scheinbar widersprechen. Aus dieser Spannung entsteht eine eigenwillige Ästhetik, in der sich Unordnung in Ordnung verwandelt.",
          "Sie erkundet die Grenze zwischen Licht und Schatten, zwischen Struktur und Zufall und fasst ihre Haltung in einem Satz zusammen: „Aus scheinbarer Unordnung entsteht Ordnung …“. Zwei ihrer Werke sind auf ArTova zu entdecken: „Nâ – La danse des perles“ („Der Tanz der Perlen“) und „Wadjawadja“.",
          "Ihr Werdegang umfasst zahlreiche Gruppenausstellungen: die Biennale von Dakar 2018 (Village des Arts), „Nexus“ (Malerei und Skulptur) im Goethe-Institut Lomé 2020, der Palais de Lomé im April 2021 und erneut im Mai 2023 mit „Dig Where You Stand“, die Galerie des Hotels Sarakawa im Januar 2023 sowie Rumänien 2024 mit dem Verein Karp Kamina und INTER Art. 2025 leitete sie außerdem einen Kreativworkshop. Dieser Werdegang stammt aus ihrem Profil auf ArTova.",
        ].join("\n\n"),
      },
    },
  },
  {
    cle: "foire-internationale-de-lome-2026",
    titre: "21e Foire internationale de Lomé : l'artisanat au programme, du 27 novembre au 13 décembre",
    resume:
      "Le CETEF Togo 2000 accueille la 21e Foire internationale de Lomé du 27 novembre au 13 décembre 2026 : plus de 1 300 exposants annoncés, l'Inde pays invité d'honneur, et l'artisanat parmi les secteurs représentés.",
    contenu: [
      "La 21e Foire internationale de Lomé (FIL) ouvre ses portes le vendredi 27 novembre 2026 pour seize jours, au Centre togolais des expositions et foires (CETEF Togo 2000). Le site se visite tous les jours de 7 h à 21 h.",
      "Placée sous le thème « Lomé, Hub du commerce et des investissements en Afrique », cette édition a l'Inde pour pays invité d'honneur. Plus de 1 300 exposants sont annoncés et les organisateurs attendent plus de 900 000 visiteurs.",
      "Rendez-vous avant tout commercial, la foire compte l'artisanat parmi ses secteurs, aux côtés de l'agriculture, de la technologie, de l'industrie, du commerce et des services. Trois rencontres B2B sont programmées les 1er, 9 et 11 décembre à partir de 10 h.",
    ].join("\n\n"),
    source_nom: "24 Heure Info",
    url_source: "https://24heureinfo.com/economie/foire-de-lome-2026-dates-horaires-et-rendez-vous-a-ne-pas-manquer/",
    image_url: "https://yutina.com/storage/articles/foire-internationale-de-lome-2026-les-dates-officielles-de-la-21e-edition-devoilees-1784338758.webp",
    credit_image: "Yutina",
    portee: "togo",
    categorie: "evenements",
    importance: 6,
    publie_le: "2026-11-23T18:00:00Z",
    evenement_debut: "2026-11-27",
    evenement_fin: "2026-12-13",
    lieu: "CETEF Togo 2000, Lomé",
    revision: 2,
    traductions: {
      en: {
        titre: "21st Lomé International Fair: crafts on the programme, 27 November to 13 December",
        resume:
          "CETEF Togo 2000 hosts the 21st Lomé International Fair from 27 November to 13 December 2026: more than 1,300 exhibitors announced, India as guest of honour, and crafts among the sectors represented.",
        contenu: [
          "The 21st Lomé International Fair (FIL) opens on Friday 27 November 2026 for sixteen days at the Togolese Centre for Exhibitions and Fairs (CETEF Togo 2000). The site is open every day from 7 am to 9 pm.",
          "Held under the theme “Lomé, Hub of Trade and Investment in Africa”, this edition has India as guest of honour. More than 1,300 exhibitors are announced and organisers expect over 900,000 visitors.",
          "Primarily a commercial event, the fair counts crafts among its sectors, alongside agriculture, technology, industry, trade and services. Three B2B meetings are scheduled for 1, 9 and 11 December from 10 am.",
        ].join("\n\n"),
      },
      de: {
        titre: "21. Internationale Messe Lomé: Kunsthandwerk im Programm, 27. November bis 13. Dezember",
        resume:
          "Das CETEF Togo 2000 beherbergt vom 27. November bis 13. Dezember 2026 die 21. Internationale Messe Lomé: über 1.300 Aussteller angekündigt, Indien als Ehrengast und Kunsthandwerk unter den vertretenen Branchen.",
        contenu: [
          "Die 21. Internationale Messe Lomé (FIL) öffnet am Freitag, dem 27. November 2026, für sechzehn Tage im Togoischen Zentrum für Ausstellungen und Messen (CETEF Togo 2000). Das Gelände ist täglich von 7 bis 21 Uhr geöffnet.",
          "Unter dem Motto „Lomé, Drehscheibe für Handel und Investitionen in Afrika“ hat diese Ausgabe Indien als Ehrengast. Mehr als 1.300 Aussteller sind angekündigt, die Veranstalter erwarten über 900.000 Besucher.",
          "Die Messe ist vor allem ein Handelsereignis, zählt aber das Kunsthandwerk zu ihren Branchen, neben Landwirtschaft, Technologie, Industrie, Handel und Dienstleistungen. Drei B2B-Treffen sind für den 1., 9. und 11. Dezember ab 10 Uhr vorgesehen.",
        ].join("\n\n"),
      },
    },
  },
];

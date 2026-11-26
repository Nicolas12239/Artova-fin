import type { ArticleRedaction } from "./actualites-redaction";

// « Découvertes » : portraits d'artistes plasticiens, de sculpteurs, de photographes
// et d'écrivains du Togo. Les repères (dates, parcours, œuvres) sont établis d'après
// Wikipédia (licence CC BY-SA 4.0) et la presse togolaise, citées sur chaque fiche ;
// les textes sont rédigés par ArTova, en français, anglais et allemand. Les photos
// viennent de Wikimedia Commons (licences libres) ou de la presse, toujours créditées.

interface Portrait {
  cle: string;
  nom: string;
  metier: { fr: string; en: string; de: string };
  fr: string[];
  en: string[];
  de: string[];
  // Sources citées en bas de fiche, et lien principal.
  sources: string;
  url: string;
  image?: string;
  credit?: string;
  // Autres noms cités (deviennent des tags).
  aussi?: string[];
}

const WIKI = "https://fr.wikipedia.org/wiki/";
const LICENCE = "Wikipédia (licence CC BY-SA 4.0)";

const PORTRAITS: Portrait[] = [
  {
    cle: "decouverte-paul-ahyi",
    nom: "Paul Ahyi",
    metier: { fr: "sculpteur, peintre et architecte", en: "sculptor, painter and architect", de: "Bildhauer, Maler und Architekt" },
    fr: [
      "Né le 15 janvier 1930 à Abomey de parents togolais et mort le 4 janvier 2010 à Lomé, Paul Ahyi est une figure majeure de l'art togolais : sculpteur, peintre, graveur, architecte d'intérieur et auteur. Il étudie à Dakar de 1949 à 1952, où il travaille aussi dans un cabinet d'architecture, puis obtient son diplôme supérieur à l'École des beaux-arts de Paris et revient au Togo en 1959.",
      "Artiste officiel de l'État togolais, il est surtout connu pour ses peintures murales et ses sculptures monumentales en pierre, marbre et ciment, dont des contributions au monument de l'indépendance à Lomé. Il est l'auteur du drapeau togolais. Plusieurs artistes se sont formés dans son atelier, et un musée à Agnassan, à Lomé, porte son nom.",
    ],
    en: [
      "Born on 15 January 1930 in Abomey to Togolese parents and died on 4 January 2010 in Lomé, Paul Ahyi is a major figure of Togolese art: sculptor, painter, engraver, interior architect and author. He studied in Dakar from 1949 to 1952, also working in an architecture firm, then earned his advanced diploma at the École des Beaux-Arts in Paris and returned to Togo in 1959.",
      "The official artist of the Togolese state, he is best known for his murals and his monumental sculptures in stone, marble and cement, including contributions to the Independence Monument in Lomé. He designed the Togolese flag. Several artists trained in his studio, and a museum in Agnassan, Lomé, bears his name.",
    ],
    de: [
      "Paul Ahyi wurde am 15. Januar 1930 als Kind togoischer Eltern in Abomey geboren und starb am 4. Januar 2010 in Lomé. Er ist eine der großen Gestalten der togoischen Kunst: Bildhauer, Maler, Grafiker, Innenarchitekt und Autor. Von 1949 bis 1952 studierte er in Dakar und arbeitete dort auch in einem Architekturbüro, erwarb dann sein höheres Diplom an der École des Beaux-Arts in Paris und kehrte 1959 nach Togo zurück.",
      "Als offizieller Künstler des togoischen Staates ist er vor allem für seine Wandbilder und monumentalen Skulpturen aus Stein, Marmor und Zement bekannt, darunter Beiträge zum Unabhängigkeitsdenkmal in Lomé. Er schuf die togoische Flagge. Mehrere Künstler lernten in seinem Atelier, und ein Museum in Agnassan bei Lomé trägt seinen Namen.",
    ],
    sources: LICENCE,
    url: WIKI + "Paul_Ahyi",
  },
  {
    cle: "decouverte-sokey-edorh",
    nom: "Sokey Edorh",
    metier: { fr: "artiste plasticien", en: "visual artist", de: "bildender Künstler" },
    fr: [
      "Né en 1955 à Tsévié, Sokey Edorh est un artiste plasticien togolais installé à Lomé. Son travail a franchi les frontières : il figure au catalogue de la 8e Biennale de l'art africain contemporain de Dakar (2008), et une rétrospective de ses années 1987 à 2000 a été présentée à Bruxelles, à la galerie Ambre Congo Contemporain, du 30 novembre 2000 au 30 janvier 2001.",
      "La presse l'a décrit comme un « peintre voyageur » (Jeune Afrique, 2009) et comme « l'homme qui a dompté la latérite » (Dzif'Art, 2006).",
    ],
    en: [
      "Born in 1955 in Tsévié, Sokey Edorh is a Togolese visual artist based in Lomé. His work has crossed borders: it appears in the catalogue of the 8th Dak'Art Biennale of Contemporary African Art (2008), and a retrospective of his work from 1987 to 2000 was shown in Brussels, at the Ambre Congo Contemporain gallery, from 30 November 2000 to 30 January 2001.",
      "The press has described him as a “travelling painter” (Jeune Afrique, 2009) and as “the man who tamed laterite” (Dzif'Art, 2006).",
    ],
    de: [
      "Sokey Edorh, 1955 in Tsévié geboren, ist ein in Lomé lebender togoischer bildender Künstler. Sein Werk hat Grenzen überschritten: Es steht im Katalog der 8. Biennale für zeitgenössische afrikanische Kunst in Dakar (2008), und eine Retrospektive seiner Arbeiten von 1987 bis 2000 wurde vom 30. November 2000 bis 30. Januar 2001 in Brüssel in der Galerie Ambre Congo Contemporain gezeigt.",
      "Die Presse beschrieb ihn als „reisenden Maler“ (Jeune Afrique, 2009) und als „den Mann, der den Laterit gezähmt hat“ (Dzif'Art, 2006).",
    ],
    sources: LICENCE,
    url: WIKI + "Sokey_Edorh",
  },
  {
    cle: "decouverte-jimi-hope",
    nom: "Jimi Hope",
    metier: { fr: "musicien, peintre et sculpteur", en: "musician, painter and sculptor", de: "Musiker, Maler und Bildhauer" },
    fr: [
      "Koffi Senaya, plus connu sous le nom de Jimi Hope, est né à Lomé le 12 octobre 1956. Musicien, peintre et sculpteur, il est souvent présenté comme « le rocker africain le plus renommé » et chante en éwé, en français et en anglais. Dès six ans, il dessine ; à huit ans, il sculpte de petites statues en ébène qu'il vend, avant d'être remarqué à treize ans par le groupe Acide Rock, dont il devient le chef.",
      "Après quarante-cinq ans de carrière artistique, il est mort le 4 août 2019 à Bry-sur-Marne, en France.",
    ],
    en: [
      "Koffi Senaya, better known as Jimi Hope, was born in Lomé on 12 October 1956. A musician, painter and sculptor, he is often called “the most renowned African rocker” and sang in Ewe, French and English. He drew from the age of six; at eight he carved small ebony statues which he sold, before being noticed at thirteen by the band Acide Rock, which he went on to lead.",
      "After forty-five years of artistic career, he died on 4 August 2019 in Bry-sur-Marne, France.",
    ],
    de: [
      "Koffi Senaya, besser bekannt als Jimi Hope, wurde am 12. Oktober 1956 in Lomé geboren. Als Musiker, Maler und Bildhauer wird er oft „der berühmteste afrikanische Rocker“ genannt und sang auf Ewe, Französisch und Englisch. Mit sechs Jahren zeichnete er; mit acht schnitzte er kleine Ebenholzstatuen, die er verkaufte, bevor ihn mit dreizehn die Band Acide Rock entdeckte, die er später leitete.",
      "Nach fünfundvierzig Jahren künstlerischer Laufbahn starb er am 4. August 2019 in Bry-sur-Marne in Frankreich.",
    ],
    sources: LICENCE,
    url: WIKI + "Jimi_Hope",
  },
  {
    cle: "decouverte-emmanuel-kavi",
    nom: "Emmanuel Kavi",
    metier: { fr: "peintre et plasticien", en: "painter and visual artist", de: "Maler und bildender Künstler" },
    fr: [
      "Né le 3 mars 1970 à Lomé, Emmanuel Kavi (Komlan Kavi) est un peintre et plasticien togolais autodidacte. Lauréat du concours national de dessin du Togo en 1987, à 17 ans, il fait évoluer son style vers l'abstraction et commence à exposer en 2001, d'abord en Afrique de l'Ouest puis en Europe.",
      "Il appelle « flouisme » la fusion entre figuration et abstraction qui caractérise son style. Il a installé son atelier à Ouagadougou, qu'il considère comme « le carrefour de l'art africain », et travaille sans esquisse, à partir de matériaux naturels issus du sol africain.",
    ],
    en: [
      "Born on 3 March 1970 in Lomé, Emmanuel Kavi (Komlan Kavi) is a self-taught Togolese painter and visual artist. A winner of Togo's national drawing competition in 1987, at 17, he gradually moved towards abstraction and began exhibiting in 2001, first in West Africa and then in Europe.",
      "He calls “flouisme” the fusion of figuration and abstraction that defines his style. He set up his studio in Ouagadougou, which he sees as “the crossroads of African art”, and works without sketches, using natural materials from African soil.",
    ],
    de: [
      "Emmanuel Kavi (Komlan Kavi), geboren am 3. März 1970 in Lomé, ist ein autodidaktischer togoischer Maler und bildender Künstler. 1987 gewann er mit 17 Jahren den nationalen Zeichenwettbewerb Togos, entwickelte seinen Stil nach und nach zur Abstraktion und stellt seit 2001 aus, zuerst in Westafrika, dann in Europa.",
      "Die Verschmelzung von Figuration und Abstraktion, die seinen Stil prägt, nennt er „flouisme“. Sein Atelier hat er in Ouagadougou eingerichtet, das er als „Kreuzung der afrikanischen Kunst“ betrachtet; er arbeitet ohne Skizzen mit natürlichen Materialien aus afrikanischem Boden.",
    ],
    sources: LICENCE,
    url: WIKI + "Emmanuel_Kavi",
  },
  {
    cle: "decouverte-sadikou-oukpedjo",
    nom: "Sadikou Oukpedjo",
    metier: { fr: "plasticien pluridisciplinaire", en: "multidisciplinary artist", de: "multidisziplinärer Künstler" },
    fr: [
      "Né en 1970 à Ketao, au Togo, et installé en Côte d'Ivoire, Sadikou Oukpedjo est peintre, sculpteur, dessinateur, graveur et artiste d'installation. Remarqué à l'école pour sa facilité à sculpter, il suit en 1994 les cours de Paul Ahyi, puis rejoint son atelier à Lomé en 1998.",
      "À partir d'objets traditionnels collectés, il interroge son héritage culturel à travers des questions comme l'abus du pouvoir politique, les inégalités sociales et les conflits religieux. Il a ensuite créé son propre atelier à Agoè Nyivé, à une quinzaine de kilomètres de Lomé.",
    ],
    en: [
      "Born in 1970 in Ketao, Togo, and now based in Côte d'Ivoire, Sadikou Oukpedjo is a painter, sculptor, draughtsman, printmaker and installation artist. Noticed at school for his gift for sculpture, he took Paul Ahyi's classes in 1994 and joined his studio in Lomé in 1998.",
      "Using collected traditional objects, he questions his cultural heritage through issues such as the abuse of political power, social inequality and religious conflict. He later created his own studio in Agoè Nyivé, about fifteen kilometres from Lomé.",
    ],
    de: [
      "Sadikou Oukpedjo, 1970 in Ketao in Togo geboren und heute in der Elfenbeinküste ansässig, ist Maler, Bildhauer, Zeichner, Grafiker und Installationskünstler. In der Schule fiel er durch sein Talent zur Bildhauerei auf, besuchte 1994 die Kurse von Paul Ahyi und trat 1998 in dessen Atelier in Lomé ein.",
      "Mit gesammelten traditionellen Gegenständen befragt er sein kulturelles Erbe anhand von Themen wie Machtmissbrauch, sozialer Ungleichheit und religiösen Konflikten. Später gründete er sein eigenes Atelier in Agoè Nyivé, rund fünfzehn Kilometer von Lomé entfernt.",
    ],
    sources: LICENCE,
    url: WIKI + "Sadikou_Oukpedjo",
    aussi: ["Paul Ahyi"],
  },
  {
    cle: "decouverte-emmanuel-sogbadji",
    nom: "Emmanuel Sogbadji",
    metier: { fr: "sculpteur et plasticien", en: "sculptor and visual artist", de: "Bildhauer und bildender Künstler" },
    fr: [
      "Né le 29 mai 1971, Emmanuel Sogbadji est un artiste plasticien togolais. Il commence sa formation dans l'atelier de Paul Ahyi, obtient en 2000 un diplôme supérieur de sculpture sur pierre et bronze à l'École des beaux-arts d'Abidjan, puis poursuit à Saint-Étienne (France) et à Pietrasanta (Italie).",
      "Son travail mêle peinture, sculpture et installation, sur papier, toile, bois, métal, fibres ou résine ; on connaît notamment ses fresques murales à Lomé et ses installations monumentales. La France l'a fait chevalier de l'Ordre des Arts et des Lettres en 2018.",
    ],
    en: [
      "Born on 29 May 1971, Emmanuel Sogbadji is a Togolese visual artist. He began his training in Paul Ahyi's studio, earned in 2000 an advanced diploma in stone and bronze sculpture at the École des Beaux-Arts in Abidjan, then continued in Saint-Étienne (France) and Pietrasanta (Italy).",
      "His work blends painting, sculpture and installation, on paper, canvas, wood, metal, fibres or resin; he is known in particular for his murals in Lomé and his monumental installations. France made him a Knight of the Order of Arts and Letters in 2018.",
    ],
    de: [
      "Emmanuel Sogbadji, geboren am 29. Mai 1971, ist ein togoischer bildender Künstler. Seine Ausbildung begann er im Atelier von Paul Ahyi, erwarb 2000 ein höheres Diplom in Stein- und Bronzebildhauerei an der École des Beaux-Arts in Abidjan und setzte sie in Saint-Étienne (Frankreich) und Pietrasanta (Italien) fort.",
      "Seine Arbeit verbindet Malerei, Skulptur und Installation auf Papier, Leinwand, Holz, Metall, Fasern oder Harz; bekannt sind vor allem seine Wandbilder in Lomé und seine monumentalen Installationen. Frankreich ernannte ihn 2018 zum Ritter des Ordens der Künste und der Literatur.",
    ],
    sources: LICENCE,
    url: WIKI + "Emmanuel_Sogbadji",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/48/E_Sogbadji.jpg",
    credit: "Wikimedia Commons, CC BY-SA 3.0",
    aussi: ["Paul Ahyi"],
  },
  {
    cle: "decouverte-jean-koumy",
    nom: "Jean Koumy",
    metier: { fr: "peintre et sculpteur belgo-togolais", en: "Belgian-Togolese painter and sculptor", de: "belgisch-togoischer Maler und Bildhauer" },
    fr: [
      "Né le 22 juin 1961 à Lomé, Jean Koumy est un artiste belgo-togolais, peintre et sculpteur autodidacte. Il a vécu une quarantaine d'années en Belgique avant de se réinstaller à Lomé en 2017, où il développe aussi des projets de formation et de création pour les jeunes artistes.",
      "Parti de formes proches de l'art naïf et de l'art traditionnel africain, il évolue vers des expressions contemporaines : couleurs vives, formes stylisées, techniques mixtes. Il est connu pour ses œuvres monumentales et ses fresques murales dans l'espace public, et a exposé dans plusieurs villes d'Europe et d'Amérique, dont Paris et Londres.",
    ],
    en: [
      "Born on 22 June 1961 in Lomé, Jean Koumy is a Belgian-Togolese artist, a self-taught painter and sculptor. He lived about forty years in Belgium before settling back in Lomé in 2017, where he also develops training and creative projects for young artists.",
      "Starting from forms close to naïve and traditional African art, he moved towards contemporary expression: bright colours, stylised forms, mixed techniques. He is known for his monumental works and murals in public space, and has exhibited in several European and American cities, including Paris and London.",
    ],
    de: [
      "Jean Koumy, geboren am 22. Juni 1961 in Lomé, ist ein belgisch-togoischer Künstler, ein autodidaktischer Maler und Bildhauer. Rund vierzig Jahre lebte er in Belgien, bevor er sich 2017 wieder in Lomé niederließ, wo er auch Ausbildungs- und Kreativprojekte für junge Künstler entwickelt.",
      "Ausgehend von Formen, die der naiven und der traditionellen afrikanischen Kunst nahestehen, entwickelte er sich zu zeitgenössischen Ausdrucksformen: leuchtende Farben, stilisierte Formen, gemischte Techniken. Er ist für seine monumentalen Werke und Wandbilder im öffentlichen Raum bekannt und hat in mehreren europäischen und amerikanischen Städten ausgestellt, darunter Paris und London.",
    ],
    sources: LICENCE,
    url: WIKI + "Jean_Koumy_(sculpteur)",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Koumy.jpg/960px-Koumy.jpg",
    credit: "Jean Koumy / Wikimedia Commons, CC BY 3.0",
  },
  {
    cle: "decouverte-kossi-assou",
    nom: "Kossi Assou",
    metier: { fr: "plasticien, designer et écrivain", en: "visual artist, designer and writer", de: "bildender Künstler, Designer und Schriftsteller" },
    fr: [
      "Né le 15 juin 1958 à Treichville (Abidjan), Kossi Assou est un artiste plasticien, designer, écrivain et enseignant-chercheur togolais. Formé à l'École des beaux-arts d'Abidjan, il enseigne notamment à l'EAMAU et à l'Université de Lomé, et promeut la création contemporaine africaine à travers des initiatives comme Ewolé et Afrodesign.",
      "Son travail explore les relations entre art contemporain, spiritualité africaine et savoirs traditionnels comme le Fâ. Le ministère togolais de la Culture l'a désigné « trésor humain vivant » ; en octobre 2024, il a animé une masterclass pour six artistes plasticiens à Djassémé.",
    ],
    en: [
      "Born on 15 June 1958 in Treichville (Abidjan), Kossi Assou is a Togolese visual artist, designer, writer and academic. Trained at the École des Beaux-Arts in Abidjan, he teaches in particular at EAMAU and the University of Lomé, and promotes contemporary African creation through initiatives such as Ewolé and Afrodesign.",
      "His work explores the relationships between contemporary art, African spirituality and traditional knowledge systems such as Fâ. Togo's Ministry of Culture has named him a “living human treasure”; in October 2024 he led a masterclass for six visual artists in Djassémé.",
    ],
    de: [
      "Kossi Assou, geboren am 15. Juni 1958 in Treichville (Abidjan), ist ein togoischer bildender Künstler, Designer, Schriftsteller und Hochschullehrer. An der École des Beaux-Arts in Abidjan ausgebildet, lehrt er unter anderem an der EAMAU und an der Universität Lomé und fördert zeitgenössisches afrikanisches Schaffen mit Initiativen wie Ewolé und Afrodesign.",
      "Seine Arbeit erkundet die Beziehungen zwischen zeitgenössischer Kunst, afrikanischer Spiritualität und traditionellen Wissenssystemen wie dem Fâ. Das togoische Kulturministerium ernannte ihn zum „lebenden menschlichen Schatz“; im Oktober 2024 leitete er in Djassémé eine Masterclass für sechs bildende Künstler.",
    ],
    sources: `${LICENCE} et Le Nouveau Reporter`,
    url: WIKI + "Kossi_Assou",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Kossi_Assou_06.jpg/960px-Kossi_Assou_06.jpg",
    credit: "Baname LARE / Wikimedia Commons, CC BY 4.0",
  },
  {
    cle: "decouverte-agbagli-kossi",
    nom: "Agbagli Kossi",
    metier: { fr: "sculpteur de la tradition vaudou", en: "sculptor of the Vodun tradition", de: "Bildhauer der Vodun-Tradition" },
    fr: [
      "Né en 1935 à Bè, quartier de Lomé, et mort en 1991, Agbagli Kossi est un sculpteur représentatif de la tradition vaudou. Ses petits personnages en bois, peints le plus souvent à la laque rose, ont voyagé bien au-delà du Togo.",
      "Ils ont été montrés à l'exposition « Les Magiciens de la terre » (Paris, 1989), à Las Palmas (1991, collection de Jean Pigozzi), à Bayreuth (2003) et au Fowler Museum de l'UCLA à Los Angeles (2008, « Mami Wata »).",
    ],
    en: [
      "Born in 1935 in Bè, a district of Lomé, and died in 1991, Agbagli Kossi is a sculptor representative of the Vodun tradition. His small wooden figures, most often painted with pink lacquer, travelled far beyond Togo.",
      "They were shown in the exhibition “Magiciens de la terre” (Paris, 1989), in Las Palmas (1991, Jean Pigozzi collection), in Bayreuth (2003) and at the Fowler Museum at UCLA in Los Angeles (2008, “Mami Wata”).",
    ],
    de: [
      "Agbagli Kossi, 1935 in Bè, einem Stadtteil von Lomé, geboren und 1991 gestorben, ist ein für die Vodun-Tradition repräsentativer Bildhauer. Seine kleinen Holzfiguren, meist mit rosa Lack bemalt, reisten weit über Togo hinaus.",
      "Sie wurden in der Ausstellung „Magiciens de la terre“ (Paris, 1989), in Las Palmas (1991, Sammlung Jean Pigozzi), in Bayreuth (2003) und im Fowler Museum der UCLA in Los Angeles (2008, „Mami Wata“) gezeigt.",
    ],
    sources: LICENCE,
    url: WIKI + "Agbagli_Kossi",
  },
  {
    cle: "decouverte-afi-nayo",
    nom: "Afi Nayo",
    metier: { fr: "sculptrice et peintre", en: "sculptor and painter", de: "Bildhauerin und Malerin" },
    fr: [
      "Née en 1969 à Lomé, Afi Nayo est une artiste française d'origine togolaise, sculptrice et peintre. Installée très jeune à Paris avec sa famille, elle étudie à l'École nationale supérieure des beaux-arts et expose en Europe, en Afrique et à New York ; la Revue Noire la présente à plusieurs reprises à la fin des années 1990.",
      "Ses œuvres associent plusieurs techniques, d'abord dans des tons monochromes (en gris) puis plus colorés, autour de thèmes comme la spiritualité et l'interdépendance culturelle. Le Défilé (1990), grand damier de cases peuplées de guerriers, de prisonniers enchaînés et de motifs totémiques, date de cette période.",
    ],
    en: [
      "Born in 1969 in Lomé, Afi Nayo is a French artist of Togolese origin, a sculptor and painter. Settled in Paris with her family at a young age, she studied at the École nationale supérieure des beaux-arts and exhibits in Europe, Africa and New York; Revue Noire featured her several times in the late 1990s.",
      "Her works combine several techniques, first in monochrome tones (greys) and later more colourful, around themes such as spirituality and cultural interdependence. Le Défilé (1990), a large chessboard of cells filled with warriors, shackled prisoners and totemic motifs, dates from that period.",
    ],
    de: [
      "Afi Nayo, 1969 in Lomé geboren, ist eine französische Künstlerin togoischer Herkunft, Bildhauerin und Malerin. Schon früh mit ihrer Familie nach Paris gezogen, studierte sie an der École nationale supérieure des beaux-arts und stellt in Europa, Afrika und New York aus; die Revue Noire stellte sie Ende der 1990er Jahre mehrfach vor.",
      "Ihre Werke verbinden mehrere Techniken, zunächst in monochromen (grauen) Tönen, später farbiger, rund um Themen wie Spiritualität und kulturelle Verflechtung. Le Défilé (1990), ein großes Schachbrett aus Feldern voller Krieger, gefesselter Gefangener und Totemmotive, stammt aus dieser Zeit.",
    ],
    sources: LICENCE,
    url: WIKI + "Afi_Nayo",
  },
  {
    cle: "decouverte-amivi-homawoo",
    nom: "Amivi Homawoo",
    metier: { fr: "plasticienne, designer et vidéaste", en: "visual artist, designer and video artist", de: "bildende Künstlerin, Designerin und Videokünstlerin" },
    fr: [
      "Née le 5 avril 1975 à Lomé et disparue le 11 avril 2026 dans la même ville, Amivi Homawoo était plasticienne, designer, vidéaste et promotrice culturelle. Basée à Djassémé, elle pratiquait la peinture, la sculpture, le design et la vidéo d'art, avec une œuvre centrée sur les questions sociales, notamment la condition féminine.",
      "Formée au design (1995) puis à la peinture et à la sculpture (1995-1998) au centre ARTISTIK de Lomé, elle a complété son parcours par un stage de gravure sur bois avec l'artiste allemand Thomas Mohi et par une formation en arts graphiques et sérigraphie à Vila Nova de Cerveira, au Portugal (2000). Un portrait de 2019 soulignait son engagement pour l'autonomisation économique des femmes de sa communauté.",
    ],
    en: [
      "Born on 5 April 1975 in Lomé and died on 11 April 2026 in the same city, Amivi Homawoo was a visual artist, designer, video artist and cultural promoter. Based in Djassémé, she worked in painting, sculpture, design and video art, with work centred on social issues, in particular the condition of women.",
      "Trained in design (1995) and then in painting and sculpture (1995–1998) at the ARTISTIK centre in Lomé, she completed her path with a woodcut internship with the German artist Thomas Mohi and training in graphic arts and screen printing in Vila Nova de Cerveira, Portugal (2000). A 2019 profile highlighted her commitment to the economic empowerment of women in her community.",
    ],
    de: [
      "Amivi Homawoo, geboren am 5. April 1975 in Lomé und am 11. April 2026 in derselben Stadt gestorben, war bildende Künstlerin, Designerin, Videokünstlerin und Kulturförderin. Sie lebte in Djassémé und arbeitete in Malerei, Bildhauerei, Design und Videokunst, mit einem Werk, das um soziale Fragen kreist, vor allem um die Lage der Frauen.",
      "Am Zentrum ARTISTIK in Lomé zunächst in Design (1995), dann in Malerei und Bildhauerei (1995–1998) ausgebildet, ergänzte sie ihren Weg durch ein Holzschnitt-Praktikum beim deutschen Künstler Thomas Mohi und eine Ausbildung in Grafik und Siebdruck in Vila Nova de Cerveira in Portugal (2000). Ein Porträt von 2019 hob ihr Engagement für die wirtschaftliche Stärkung der Frauen in ihrer Gemeinschaft hervor.",
    ],
    sources: LICENCE,
    url: WIKI + "Amivi_Homawoo",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Amivi_Homawoo_03.jpg/960px-Amivi_Homawoo_03.jpg",
    credit: "Baname LARE / Wikimedia Commons, CC BY 4.0",
    aussi: ["Thomas Mohi"],
  },
  {
    cle: "decouverte-kwami-dodji-agbetoglo",
    nom: "Kwami Dodji Agbétoglo",
    metier: { fr: "sculpteur sur bois", en: "wood sculptor", de: "Holzbildhauer" },
    fr: [
      "Né le 23 février 1989, Kwami Dodji Agbétoglo travaille à Lomé, dans le quartier de Doulassamé, à Tayé Tayé – village d'art, à la fois maison familiale, atelier et galerie, près de la Colombe de la Paix. Il y façonne des sculptures monumentales à partir de bois brut ou brûlé, sublimées de teintures végétales locales.",
      "Il travaille aussi le bronze et le fer, qu'il associe parfois au bois, et défend la préservation de l'environnement et des traditions africaines. Il a remporté une médaille de bronze aux IXes Jeux de la Francophonie, à Kinshasa, en 2023.",
    ],
    en: [
      "Born on 23 February 1989, Kwami Dodji Agbétoglo works in Lomé, in the Doulassamé district, at Tayé Tayé – village d'art, a family home, studio and gallery all in one, near the Dove of Peace. There he shapes monumental sculptures from raw or burnt wood, enhanced with local plant dyes.",
      "He also works with bronze and iron, sometimes combining them with wood, and champions the preservation of the environment and African traditions. He won a bronze medal at the 9th Jeux de la Francophonie in Kinshasa in 2023.",
    ],
    de: [
      "Kwami Dodji Agbétoglo, geboren am 23. Februar 1989, arbeitet in Lomé im Viertel Doulassamé bei Tayé Tayé – village d'art, Wohnhaus der Familie, Atelier und Galerie in einem, nahe der Friedenstaube. Dort formt er monumentale Skulpturen aus rohem oder verbranntem Holz, veredelt mit lokalen Pflanzenfarben.",
      "Er arbeitet auch mit Bronze und Eisen, die er manchmal mit Holz verbindet, und setzt sich für den Schutz der Umwelt und der afrikanischen Traditionen ein. 2023 gewann er bei den 9. Jeux de la Francophonie in Kinshasa eine Bronzemedaille.",
    ],
    sources: "Le Clik (novembre 2024)",
    url: "https://leclik.tg/2024/11/29/art-kwami-dodji-agbetoglo/",
    image: "https://leclik.tg/wp-content/uploads/2024/11/IMG-20241129-WA0010.jpg",
    credit: "Le Clik",
  },
  {
    cle: "decouverte-atisso-goha",
    nom: "Atisso Goha",
    metier: { fr: "jeune sculpteur sur bois", en: "young wood sculptor", de: "junger Holzbildhauer" },
    fr: [
      "À 20 ans, le sculpteur sur bois Atisso Goha présentait en 2019 sa première exposition à Lomé, « Les Totems d'Atisso », du 12 avril au 12 mai à la galerie d'art contemporain Négrillis : une vingtaine d'œuvres, dont la plus haute, « Le Guerrier », mesure 2,50 m.",
      "Ses sculptures racontent la vie quotidienne — la sagesse du vieil homme, le couple souriant, la fidélité, la famille, l'éducation — et portent des messages à une jeunesse qui perd espoir. Un visiteur saluait notamment son travail de recyclage du bois.",
    ],
    en: [
      "At 20, wood sculptor Atisso Goha presented his first exhibition in Lomé in 2019, “Les Totems d'Atisso”, from 12 April to 12 May at the Négrillis contemporary art gallery: about twenty works, the tallest of which, “Le Guerrier” (The Warrior), stands 2.50 m high.",
      "His sculptures tell of everyday life — the wisdom of the old man, the smiling couple, fidelity, family, education — and carry messages to a youth losing hope. One visitor in particular praised his recycling of wood.",
    ],
    de: [
      "Mit 20 Jahren zeigte der Holzbildhauer Atisso Goha 2019 in Lomé seine erste Ausstellung, „Les Totems d'Atisso“, vom 12. April bis 12. Mai in der Galerie für zeitgenössische Kunst Négrillis: rund zwanzig Werke, das höchste, „Le Guerrier“ (Der Krieger), misst 2,50 m.",
      "Seine Skulpturen erzählen vom Alltag – von der Weisheit des alten Mannes, dem lächelnden Paar, von Treue, Familie und Bildung – und tragen Botschaften an eine Jugend, die die Hoffnung verliert. Ein Besucher lobte besonders seine Wiederverwertung von Holz.",
    ],
    sources: "VOA Afrique (avril 2019)",
    url: "https://www.voaafrique.com/a/atisso-goha-le-sculpteur-de-g%C3%A9ants-expose-%C3%A0-lom%C3%A9/4888013.html",
    image: "https://gdb.voanews.com/eadd4539-1e67-4a95-9cf7-c275e7711402_cx0_cy12_cw0_w1200_h630.jpg",
    credit: "VOA Afrique",
  },
  {
    cle: "decouverte-tessilim-adjayi",
    nom: "Tessilim Adjayi",
    metier: { fr: "photographe et cinéaste", en: "photographer and filmmaker", de: "Fotograf und Filmemacher" },
    fr: [
      "Né en 1988 à Assahoun, à une cinquantaine de kilomètres de Lomé, Tessilim Adjayi est photographe et cinéaste, basé à Lomé. Il obtient en 2013 une licence en montage et postproduction à l'Institut supérieur des métiers de l'audiovisuel (ISMA), au Bénin.",
      "Son travail explore la mémoire, l'identité, la résilience et les dynamiques sociales contemporaines en Afrique. Parmi ses premiers projets documentaires figure « Rejoindre l'Europe, mourir en mer », et il a représenté le Togo aux IXes Jeux de la Francophonie, à Kinshasa en 2023, en photographie.",
    ],
    en: [
      "Born in 1988 in Assahoun, about fifty kilometres from Lomé, Tessilim Adjayi is a photographer and filmmaker based in Lomé. In 2013 he earned a degree in editing and post-production at the Institut supérieur des métiers de l'audiovisuel (ISMA) in Benin.",
      "His work explores memory, identity, resilience and contemporary social dynamics in Africa. His first documentary projects include “Rejoindre l'Europe, mourir en mer” (Reaching Europe, dying at sea), and he represented Togo in photography at the 9th Jeux de la Francophonie in Kinshasa in 2023.",
    ],
    de: [
      "Tessilim Adjayi, 1988 in Assahoun, rund fünfzig Kilometer von Lomé entfernt, geboren, ist Fotograf und Filmemacher und lebt in Lomé. 2013 erwarb er am Institut supérieur des métiers de l'audiovisuel (ISMA) in Benin einen Abschluss in Schnitt und Postproduktion.",
      "Seine Arbeit erkundet Erinnerung, Identität, Resilienz und gegenwärtige gesellschaftliche Dynamiken in Afrika. Zu seinen ersten Dokumentarprojekten gehört „Rejoindre l'Europe, mourir en mer“ (Europa erreichen, auf See sterben); bei den 9. Jeux de la Francophonie 2023 in Kinshasa vertrat er Togo in der Fotografie.",
    ],
    sources: LICENCE,
    url: WIKI + "Tessilim_Adjayi",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Tessilim.jpg/960px-Tessilim.jpg",
    credit: "Tessilimadjayi / Wikimedia Commons, CC BY-SA 4.0",
  },
  {
    cle: "decouverte-lina-mensah",
    nom: "Lina Mensah",
    metier: { fr: "photographe", en: "photographer", de: "Fotografin" },
    fr: [
      "Née le 1er décembre 1994 à Lomé, Lina Mensah est photographe, spécialisée dans le portrait, la photographie documentaire et les questions liées aux droits des femmes. Elle grandit dans une famille de photographes : son père dirige le studio Photo JB à Lomé, sa mère exerce sous le nom de « Maman Photo », et ses grands-parents l'étaient aussi.",
      "Initiée dès l'enfance au studio familial, assistante à l'adolescence sur des cérémonies et des événements, elle appartient à une nouvelle génération d'artistes visuels togolais. Sa pratique s'intéresse aux femmes, à l'éducation et aux réalités sociales.",
    ],
    en: [
      "Born on 1 December 1994 in Lomé, Lina Mensah is a photographer specialising in portraiture, documentary photography and women's rights issues. She grew up in a family of photographers: her father runs the Photo JB studio in Lomé, her mother works under the name “Maman Photo”, and her grandparents were photographers too.",
      "Introduced to the family studio as a child and an assistant on ceremonies and events as a teenager, she belongs to a new generation of Togolese visual artists. Her practice focuses on women, education and social realities.",
    ],
    de: [
      "Lina Mensah, geboren am 1. Dezember 1994 in Lomé, ist Fotografin und auf Porträt, Dokumentarfotografie und Fragen der Frauenrechte spezialisiert. Sie wuchs in einer Fotografenfamilie auf: Ihr Vater leitet das Studio Photo JB in Lomé, ihre Mutter arbeitet unter dem Namen „Maman Photo“, und auch ihre Großeltern waren Fotografen.",
      "Schon als Kind im Familienstudio angeleitet und als Teenager Assistentin bei Zeremonien und Veranstaltungen, gehört sie zu einer neuen Generation togoischer Bildkünstler. Ihre Praxis widmet sich Frauen, Bildung und sozialen Realitäten.",
    ],
    sources: LICENCE,
    url: WIKI + "Lina_Mensah",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Lina_Mensah_04.jpg/960px-Lina_Mensah_04.jpg",
    credit: "Baname LARE / Wikimedia Commons, CC0",
  },
  {
    cle: "decouverte-kangni-alem",
    nom: "Kangni Alem",
    metier: { fr: "écrivain, dramaturge et metteur en scène", en: "writer, playwright and director", de: "Schriftsteller, Dramatiker und Regisseur" },
    fr: [
      "Né à Lomé le 21 avril 1966, Kangni Alem (Kangni Alemdjrodo) est écrivain, dramaturge, metteur en scène, traducteur et critique littéraire. Docteur en littératures françaises, francophones et comparées (Bordeaux-Montaigne, 1999), il fonde en 1989 la compagnie L'Atelier Théâtre de Lomé.",
      "Il y met en scène Mère Courage et ses enfants de Brecht, La Route de Wole Soyinka et Récupérations de Kossi Efoui, ainsi que ses propres pièces, dont Chemins de Croix et La Saga des Rois.",
    ],
    en: [
      "Born in Lomé on 21 April 1966, Kangni Alem (Kangni Alemdjrodo) is a writer, playwright, director, translator and literary critic. A doctor of French, Francophone and comparative literatures (Bordeaux-Montaigne, 1999), he founded the company L'Atelier Théâtre de Lomé in 1989.",
      "There he staged Brecht's Mother Courage and Her Children, Wole Soyinka's The Road and Kossi Efoui's Récupérations, as well as his own plays, including Chemins de Croix and La Saga des Rois.",
    ],
    de: [
      "Kangni Alem (Kangni Alemdjrodo), geboren am 21. April 1966 in Lomé, ist Schriftsteller, Dramatiker, Regisseur, Übersetzer und Literaturkritiker. Als Doktor der französischen, frankophonen und vergleichenden Literaturen (Bordeaux-Montaigne, 1999) gründete er 1989 die Truppe L'Atelier Théâtre de Lomé.",
      "Dort inszenierte er Brechts Mutter Courage und ihre Kinder, Wole Soyinkas Der Weg und Kossi Efouis Récupérations sowie eigene Stücke, darunter Chemins de Croix und La Saga des Rois.",
    ],
    sources: LICENCE,
    url: WIKI + "Kangni_Alem",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Selecr_%28356%29.jpg/960px-Selecr_%28356%29.jpg",
    credit: "Alemdjrodo / Wikimedia Commons, CC BY-SA 4.0",
    aussi: ["Kossi Efoui"],
  },
  {
    cle: "decouverte-kossi-efoui",
    nom: "Kossi Efoui",
    metier: { fr: "dramaturge et romancier", en: "playwright and novelist", de: "Dramatiker und Romancier" },
    fr: [
      "Né en 1962 à Anfoin, au Togo, Kossi Efoui étudie la philosophie à l'université de Lomé. Engagé dans le mouvement de contestation du régime d'Eyadéma, il est contraint à l'exil et s'installe en France. Dramaturge, chroniqueur et romancier, il est décrit comme l'un des auteurs africains les plus originaux de sa génération.",
      "Il obtient en 1989 le Grand Prix Tchicaya U Tam'si du concours théâtral interafricain pour Le Carrefour. Depuis 2006, il collabore avec la compagnie Théâtre Inutile, à Amiens, et en 2023 l'université de Lomé lui a décerné un diplôme d'excellence.",
    ],
    en: [
      "Born in 1962 in Anfoin, Togo, Kossi Efoui studied philosophy at the University of Lomé. Involved in the protest movement against the Eyadéma regime, he was forced into exile and settled in France. A playwright, columnist and novelist, he is described as one of the most original African authors of his generation.",
      "In 1989 he won the Grand Prix Tchicaya U Tam'si of the inter-African theatre competition for Le Carrefour. Since 2006 he has worked with the company Théâtre Inutile in Amiens, and in 2023 the University of Lomé awarded him a diploma of excellence.",
    ],
    de: [
      "Kossi Efoui, 1962 in Anfoin in Togo geboren, studierte Philosophie an der Universität Lomé. Als Teil der Protestbewegung gegen das Regime Eyadéma wurde er ins Exil gezwungen und ließ sich in Frankreich nieder. Als Dramatiker, Kolumnist und Romancier gilt er als einer der originellsten afrikanischen Autoren seiner Generation.",
      "1989 erhielt er für Le Carrefour den Grand Prix Tchicaya U Tam'si des interafrikanischen Theaterwettbewerbs. Seit 2006 arbeitet er mit der Compagnie Théâtre Inutile in Amiens zusammen, und 2023 verlieh ihm die Universität Lomé ein Exzellenzdiplom.",
    ],
    sources: LICENCE,
    url: WIKI + "Kossi_Efoui",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Kossi_Efoui.png",
    credit: "Baname LARE / Wikimedia Commons, CC BY-SA 4.0",
  },
  {
    cle: "decouverte-sami-tchak",
    nom: "Sami Tchak",
    metier: { fr: "écrivain et sociologue", en: "writer and sociologist", de: "Schriftsteller und Soziologe" },
    fr: [
      "Sadamba Tcha-Koura, alias Sami Tchak, est né en 1960 à Kamonda-Bowounda, village kotokoli du Togo où son père était forgeron, dans une fratrie de vingt et un enfants. Instituteur puis professeur de philosophie à Sokodé, il arrive en France en 1986 et obtient un doctorat de sociologie à la Sorbonne en 1993.",
      "Installé à Paris, il a publié plusieurs essais et une douzaine de romans qui explorent notamment la sexualité et ses expressions transgressives, dans la lignée de Sade et de Georges Bataille, ainsi que les échanges transculturels entre Afrique, Europe et Amérique du Sud. Son œuvre a reçu de nombreux prix.",
    ],
    en: [
      "Sadamba Tcha-Koura, alias Sami Tchak, was born in 1960 in Kamonda-Bowounda, a Kotokoli village in Togo where his father was a blacksmith, in a family of twenty-one children. A primary school teacher and then a philosophy teacher in Sokodé, he arrived in France in 1986 and earned a doctorate in sociology at the Sorbonne in 1993.",
      "Based in Paris, he has published several essays and about a dozen novels that explore in particular sexuality and its transgressive expressions, in the line of Sade and Georges Bataille, as well as cross-cultural exchanges between Africa, Europe and South America. His work has received many prizes.",
    ],
    de: [
      "Sadamba Tcha-Koura, genannt Sami Tchak, wurde 1960 in Kamonda-Bowounda geboren, einem Kotokoli-Dorf in Togo, in dem sein Vater Schmied war, in einer Familie mit einundzwanzig Kindern. Als Grundschullehrer, dann als Philosophielehrer in Sokodé tätig, kam er 1986 nach Frankreich und promovierte 1993 an der Sorbonne in Soziologie.",
      "In Paris lebend, hat er mehrere Essays und rund ein Dutzend Romane veröffentlicht, die insbesondere die Sexualität und ihre transgressiven Ausdrucksformen in der Linie von Sade und Georges Bataille sowie den transkulturellen Austausch zwischen Afrika, Europa und Südamerika erkunden. Sein Werk erhielt zahlreiche Preise.",
    ],
    sources: LICENCE,
    url: WIKI + "Sami_Tchak",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Salon_du_livre_de_Paris_2011_-_Sami_Tchak_-_004.jpg/960px-Salon_du_livre_de_Paris_2011_-_Sami_Tchak_-_004.jpg",
    credit: "Thesupermat / Wikimedia Commons, CC BY-SA 3.0",
  },
  {
    cle: "decouverte-felix-couchoro",
    nom: "Félix Couchoro",
    metier: { fr: "romancier, figure des débuts du roman togolais", en: "novelist, early figure of the Togolese novel", de: "Romanautor, Wegbereiter des togoischen Romans" },
    fr: [
      "Né le 30 janvier 1900 à Ouidah, au Dahomey, et mort le 5 avril 1968 à Lomé, Félix Couchoro est un écrivain togolais, auteur d'une vingtaine de romans. Son premier roman, L'Esclave (1929), est le deuxième roman publié en français par un Africain, longtemps resté méconnu.",
      "De 1931 à 1933, il dirige le journal L'Éveil Togolais, où il plaide pour une plus grande liberté de commerce entre le Bénin et le Togo, un thème récurrent de son œuvre. Il invente à cette époque un style de livrets propre à Onitsha.",
    ],
    en: [
      "Born on 30 January 1900 in Ouidah, Dahomey, and died on 5 April 1968 in Lomé, Félix Couchoro is a Togolese writer, author of some twenty novels. His first novel, L'Esclave (1929), is the second novel published in French by an African, and long remained little known.",
      "From 1931 to 1933 he edited the newspaper L'Éveil Togolais, where he argued for greater freedom of trade between Benin and Togo, a recurring theme of his work. At that time he invented a booklet style of his own, in the manner of Onitsha.",
    ],
    de: [
      "Félix Couchoro, geboren am 30. Januar 1900 in Ouidah in Dahomey und am 5. April 1968 in Lomé gestorben, ist ein togoischer Schriftsteller und Autor von rund zwanzig Romanen. Sein erster Roman, L'Esclave (1929), ist der zweite von einem Afrikaner auf Französisch veröffentlichte Roman und blieb lange wenig bekannt.",
      "Von 1931 bis 1933 leitete er die Zeitung L'Éveil Togolais, in der er sich für mehr Handelsfreiheit zwischen Benin und Togo einsetzte, ein wiederkehrendes Thema seines Werks. In dieser Zeit erfand er einen eigenen Heftstil nach Art von Onitsha.",
    ],
    sources: LICENCE,
    url: WIKI + "F%C3%A9lix_Couchoro",
    aussi: ["David Ananou"],
  },
  {
    cle: "decouverte-david-ananou",
    nom: "David Ananou",
    metier: { fr: "instituteur et romancier", en: "teacher and novelist", de: "Lehrer und Romanautor" },
    fr: [
      "Né le 6 août 1917 à Lomé et mort le 5 octobre 2000, David Ananou est instituteur et écrivain, considéré comme l'un des pionniers de la littérature togolaise. Il enseigne dès 1938 et décrit dans ses écrits les réalités sociales et culturelles du sud du Togo.",
      "Il est l'auteur d'un unique roman, Le Fils du fétiche, publié à Paris en 1955 par les Nouvelles Éditions Latines puis réédité en 1971, souvent cité parmi les premières œuvres de fiction longue de la littérature togolaise moderne, aux côtés de L'Esclave de Félix Couchoro.",
    ],
    en: [
      "Born on 6 August 1917 in Lomé and died on 5 October 2000, David Ananou was a teacher and writer, regarded as one of the pioneers of Togolese literature. He taught from 1938 and described in his writing the social and cultural realities of southern Togo.",
      "He wrote a single novel, Le Fils du fétiche, published in Paris in 1955 by Nouvelles Éditions Latines and reissued in 1971, often cited among the first long works of fiction in modern Togolese literature, alongside Félix Couchoro's L'Esclave.",
    ],
    de: [
      "David Ananou, geboren am 6. August 1917 in Lomé und am 5. Oktober 2000 gestorben, war Lehrer und Schriftsteller und gilt als einer der Pioniere der togoischen Literatur. Er unterrichtete ab 1938 und beschrieb in seinen Schriften die sozialen und kulturellen Wirklichkeiten des südlichen Togo.",
      "Er schrieb einen einzigen Roman, Le Fils du fétiche, 1955 in Paris bei den Nouvelles Éditions Latines erschienen und 1971 neu aufgelegt, oft zu den ersten längeren Prosawerken der modernen togoischen Literatur gezählt, neben L'Esclave von Félix Couchoro.",
    ],
    sources: LICENCE,
    url: WIKI + "David_Ananou",
    aussi: ["Félix Couchoro"],
  },
  {
    cle: "decouverte-tete-michel-kpomassie",
    nom: "Tété-Michel Kpomassie",
    metier: { fr: "voyageur et écrivain", en: "traveller and writer", de: "Reisender und Schriftsteller" },
    fr: [
      "Né en 1941 au Togo, Tété-Michel Kpomassie est un voyageur et écrivain, connu pour son récit autobiographique L'Africain du Groenland. À 16 ans, simple cueilleur de noix de coco dans un pays encore sous domination coloniale, il découvre dans une librairie jésuite un livre sur le Groenland et décide de s'y rendre.",
      "Il lui faudra plusieurs années pour y parvenir : son récit retrace son voyage, au milieu des années 1960, vers le monde des Inuits, alors qu'il n'était qu'un jeune Africain sans moyens financiers.",
    ],
    en: [
      "Born in 1941 in Togo, Tété-Michel Kpomassie is a traveller and writer, best known for his autobiographical account L'Africain du Groenland (An African in Greenland). At 16, a mere coconut picker in a country still under colonial rule, he came across a book about Greenland in a Jesuit bookshop and decided to go there.",
      "It took him several years to get there: his account retraces his journey, in the mid-1960s, to the world of the Inuit, when he was just a young African with no financial means.",
    ],
    de: [
      "Tété-Michel Kpomassie, 1941 in Togo geboren, ist Reisender und Schriftsteller und vor allem durch seinen autobiografischen Bericht L'Africain du Groenland (Ein Afrikaner in Grönland) bekannt. Mit 16 Jahren, als einfacher Kokosnusspflücker in einem noch kolonial beherrschten Land, stieß er in einer Jesuitenbuchhandlung auf ein Buch über Grönland und beschloss, dorthin zu reisen.",
      "Es dauerte mehrere Jahre, bis er sein Ziel erreichte: Sein Bericht schildert seine Reise Mitte der 1960er Jahre in die Welt der Inuit, als er nur ein junger Afrikaner ohne finanzielle Mittel war.",
    ],
    sources: LICENCE,
    url: WIKI + "T%C3%A9t%C3%A9-Michel_Kpomassie",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Tete_Michel_Kpomassie.jpg/960px-Tete_Michel_Kpomassie.jpg",
    credit: "Ole-Christian Bjarkøy / Wikimedia Commons, CC BY-SA 3.0",
  },
  {
    cle: "decouverte-kokouvi-dzifa-galley",
    nom: "Kokouvi Dzifa Galley",
    metier: { fr: "écrivain, dramaturge et conteur", en: "writer, playwright and storyteller", de: "Schriftsteller, Dramatiker und Erzähler" },
    fr: [
      "Né en 1980 à Lomé, Kokouvi Dzifa Galley est écrivain, dramaturge, poète et conteur. Titulaire d'une maîtrise en sciences économiques de l'Université de Lomé, il fait ses premiers pas littéraires en 2005 à la Ruche Sony Labou Tansi, au Mali, puis reçoit en 2009 une bourse Beaumarchais pour une résidence d'écriture à la Comédie de Saint-Étienne et à Paris.",
      "Son œuvre dépasse le théâtre — poésie, nouvelle, conte — et puise une grande partie de son inspiration dans le terroir togolais.",
    ],
    en: [
      "Born in 1980 in Lomé, Kokouvi Dzifa Galley is a writer, playwright, poet and storyteller. Holding a master's degree in economics from the University of Lomé, he took his first literary steps in 2005 at the Ruche Sony Labou Tansi in Mali, then received a Beaumarchais grant in 2009 for a writing residency at the Comédie de Saint-Étienne and in Paris.",
      "His work goes beyond theatre — poetry, short stories, tales — and draws much of its inspiration from the Togolese land and culture.",
    ],
    de: [
      "Kokouvi Dzifa Galley, 1980 in Lomé geboren, ist Schriftsteller, Dramatiker, Dichter und Erzähler. Mit einem Master in Wirtschaftswissenschaften der Universität Lomé machte er 2005 bei der Ruche Sony Labou Tansi in Mali seine ersten literarischen Schritte und erhielt 2009 ein Beaumarchais-Stipendium für eine Schreibresidenz an der Comédie de Saint-Étienne und in Paris.",
      "Sein Werk geht über das Theater hinaus – Lyrik, Kurzgeschichten, Erzählungen – und schöpft einen großen Teil seiner Inspiration aus dem togoischen Boden und seiner Kultur.",
    ],
    sources: LICENCE,
    url: WIKI + "Kokouvi_Dzifa_Galley",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Kokouvi_Dzifa_Galley.jpg/960px-Kokouvi_Dzifa_Galley.jpg",
    credit: "Baname LARE / Wikimedia Commons, CC BY-SA 4.0",
  },
  {
    cle: "decouverte-ali-tagba-tetereho",
    nom: "Ali-Tagba Tétérého",
    metier: { fr: "poète, conteur et plasticien", en: "poet, storyteller and visual artist", de: "Dichter, Erzähler und bildender Künstler" },
    fr: [
      "Né le 31 décembre 1959 à Atakpamé, Ali-Tagba Tétérého est poète, conteur, plasticien et écrivain, également chercheur et contrôleur des assurances de formation. Il est connu pour son travail en faveur de la valorisation des langues africaines et pour la création d'un alphabet et de chiffres inspirés des cultures africaines.",
      "Directeur exécutif de l'Institut interafricain et application (IRA-Togo), il mène des activités de recherche, de formation et de culture, et dirige le cabinet-conseil Kokoroko.",
    ],
    en: [
      "Born on 31 December 1959 in Atakpamé, Ali-Tagba Tétérého is a poet, storyteller, visual artist and writer, also a researcher and, by training, an insurance controller. He is known for his work promoting African languages and for creating an alphabet and numerals inspired by African cultures.",
      "Executive director of the Institut interafricain et application (IRA-Togo), he carries out research, training and cultural activities, and runs the consultancy Kokoroko.",
    ],
    de: [
      "Ali-Tagba Tétérého, geboren am 31. Dezember 1959 in Atakpamé, ist Dichter, Erzähler, bildender Künstler und Schriftsteller, außerdem Forscher und von Beruf Versicherungsprüfer. Er ist für seinen Einsatz zur Aufwertung afrikanischer Sprachen und für die Schaffung eines von afrikanischen Kulturen inspirierten Alphabets und Zahlzeichen bekannt.",
      "Als geschäftsführender Direktor des Institut interafricain et application (IRA-Togo) leitet er Forschungs-, Ausbildungs- und Kulturaktivitäten und führt die Beratungsfirma Kokoroko.",
    ],
    sources: LICENCE,
    url: WIKI + "Ali-Tagba_T%C3%A9t%C3%A9r%C3%A9ho",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Ali-Tagba_T%C3%A9t%C3%A9r%C3%A9ho._2.jpg",
    credit: "Baname LARE / Wikimedia Commons, CC BY-SA 4.0",
  },
];

// Repères en liste : d'autres noms, une ligne chacun.
interface Repere {
  nom: string;
  fr: string;
  en: string;
  de: string;
}

const REPERES_ARTS: Repere[] = [
  { nom: "Joseph Amedokpo", fr: "peintre, né le 12 décembre 1946 à Vogan.", en: "painter, born on 12 December 1946 in Vogan.", de: "Maler, geboren am 12. Dezember 1946 in Vogan." },
  { nom: "Jerry Doe Orlando", fr: "plasticien, peintre, photographe et vidéaste ; son travail aborde l'identité, la mémoire, la migration et la transformation de l'être ; il a représenté le Togo aux Jeux de la Francophonie en arts plastiques.", en: "visual artist, painter, photographer and video artist; his work addresses identity, memory, migration and the transformation of the self; he represented Togo in visual arts at the Jeux de la Francophonie.", de: "bildender Künstler, Maler, Fotograf und Videokünstler; seine Arbeit behandelt Identität, Erinnerung, Migration und die Verwandlung des Selbst; er vertrat Togo bei den Jeux de la Francophonie in der bildenden Kunst." },
  { nom: "Clay Apenouvon", fr: "artiste plasticien contemporain, né en 1970 à Lomé.", en: "contemporary visual artist, born in 1970 in Lomé.", de: "zeitgenössischer bildender Künstler, geboren 1970 in Lomé." },
  { nom: "Dodji Efoui", fr: "plasticien, musicien et autodidacte, né en 1973 à Lomé.", en: "visual artist and musician, self-taught, born in 1973 in Lomé.", de: "bildender Künstler und Musiker, Autodidakt, geboren 1973 in Lomé." },
  { nom: "Kossi Aguessy", fr: "designer industriel et artiste contemporain (Lomé, 1977 – Toulouse, 2017).", en: "industrial designer and contemporary artist (Lomé, 1977 – Toulouse, 2017).", de: "Industriedesigner und zeitgenössischer Künstler (Lomé, 1977 – Toulouse, 2017)." },
  { nom: "Talle Bamazi", fr: "peintre et conservateur, basé à Columbus, dans l'Ohio.", en: "painter and curator based in Columbus, Ohio.", de: "Maler und Kurator mit Sitz in Columbus, Ohio." },
  { nom: "Sika Foyer", fr: "plasticienne et artiste conceptuelle togolaise-américaine, née en 1968, qui vit et travaille à New York.", en: "Togolese-American visual and conceptual artist, born in 1968, who lives and works in New York.", de: "togoisch-amerikanische bildende und Konzeptkünstlerin, geboren 1968, die in New York lebt und arbeitet." },
  { nom: "Davide-Christelle Sanvee", fr: "artiste et performeuse suisse d'origine togolaise, née en 1993 à Lomé, qui vit à Genève ; performances souvent participatives sur l'espace public, le pouvoir et la mémoire collective.", en: "Swiss artist and performer of Togolese origin, born in 1993 in Lomé, who lives in Geneva; often participatory performances on public space, power and collective memory.", de: "Schweizer Künstlerin und Performerin togoischer Herkunft, 1993 in Lomé geboren, die in Genf lebt; oft partizipative Performances zu öffentlichem Raum, Macht und kollektivem Gedächtnis." },
  { nom: "Mounia Youssef", fr: "artiste visuelle, photographe et graphic designer, née le 14 octobre 1988 à Lomé et installée au Bénin.", en: "visual artist, photographer and graphic designer, born on 14 October 1988 in Lomé and living in Benin.", de: "visuelle Künstlerin, Fotografin und Grafikdesignerin, geboren am 14. Oktober 1988 in Lomé und in Benin lebend." },
  { nom: "Delali Ayivi", fr: "photographe togolo-allemande, née en 1998 à Baltimore.", en: "Togolese-German photographer, born in 1998 in Baltimore.", de: "togoisch-deutsche Fotografin, 1998 in Baltimore geboren." },
  { nom: "Tani Sambiani", fr: "dessinateur, illustrateur et auteur de bande dessinée, né le 4 juin 1988 à Lomé ; connu pour ses portraits artistiques.", en: "draughtsman, illustrator and comics author, born on 4 June 1988 in Lomé; known for his artistic portraits.", de: "Zeichner, Illustrator und Comicautor, geboren am 4. Juni 1988 in Lomé; bekannt für seine künstlerischen Porträts." },
  { nom: "Jacques Do Kokou", fr: "réalisateur, photographe et promoteur culturel, pionnier du cinéma togolais : il réalise en 1975 Kouami, souvent présenté comme le premier film de fiction togolais.", en: "film director, photographer and cultural promoter, a pioneer of Togolese cinema: in 1975 he made Kouami, often presented as the first Togolese fiction film.", de: "Regisseur, Fotograf und Kulturförderer, Pionier des togoischen Kinos: 1975 drehte er Kouami, oft als erster togoischer Spielfilm bezeichnet." },
  { nom: "Philippe Koudjina", fr: "photographe togolais (1940-2014) dont toute la carrière s'est déroulée au Niger.", en: "Togolese photographer (1940–2014) whose entire career took place in Niger.", de: "togoischer Fotograf (1940–2014), dessen gesamte Laufbahn in Niger stattfand." },
];

const REPERES_LETTRES: Repere[] = [
  { nom: "Edem Awumey", fr: "né à Lomé le 11 juin 1975, diplômé de lettres de l'Université de Lomé, installé au Québec depuis 2005 ; bourse UNESCO-Aschberg en 2000 pour une résidence d'écriture à Marnay-sur-Seine.", en: "born in Lomé on 11 June 1975, a literature graduate of the University of Lomé, living in Quebec since 2005; UNESCO-Aschberg grant in 2000 for a writing residency in Marnay-sur-Seine.", de: "geboren am 11. Juni 1975 in Lomé, Literaturabsolvent der Universität Lomé, seit 2005 in Québec lebend; 2000 UNESCO-Aschberg-Stipendium für eine Schreibresidenz in Marnay-sur-Seine." },
  { nom: "Théo Ananissoh", fr: "né en 1962 en République centrafricaine de parents togolais, installé à Paris en 1986 puis à Cologne ; auteur de six romans, dont trois chez Gallimard dans la collection « Continents noirs ».", en: "born in 1962 in the Central African Republic to Togolese parents, in Paris from 1986 and then Cologne; author of six novels, three of them with Gallimard in the “Continents noirs” series.", de: "1962 in der Zentralafrikanischen Republik als Kind togoischer Eltern geboren, ab 1986 in Paris, dann in Köln; Autor von sechs Romanen, drei davon bei Gallimard in der Reihe „Continents noirs“." },
  { nom: "Ayi Hillah", fr: "né le 17 mai 1976 à Lomé, poète, nouvelliste et romancier ; vit en Belgique et travaille dans le secteur humanitaire ; son œuvre explore des thèmes sociaux, historiques et mémoriels.", en: "born on 17 May 1976 in Lomé, poet, short-story writer and novelist; lives in Belgium and works in the humanitarian sector; his work explores social, historical and memorial themes.", de: "geboren am 17. Mai 1976 in Lomé, Dichter, Erzähler und Romanautor; lebt in Belgien und arbeitet im humanitären Bereich; sein Werk erkundet soziale, historische und erinnerungsbezogene Themen." },
  { nom: "Anas Atakora", fr: "né le 7 juillet 1986, écrivain, poète, critique et universitaire résidant au Canada ; lauréat en 2008 du prix « Plumes émergentes » de l'Université de Lomé pour sa pièce Blaise, le musulman.", en: "born on 7 July 1986, writer, poet, critic and academic living in Canada; winner in 2008 of the University of Lomé's “Plumes émergentes” prize for his play Blaise, le musulman.", de: "geboren am 7. Juli 1986, Schriftsteller, Dichter, Kritiker und Hochschullehrer in Kanada; 2008 Preisträger des Preises „Plumes émergentes“ der Universität Lomé für sein Stück Blaise, le musulman." },
  { nom: "Koffi Boko", fr: "né le 12 novembre 1970 à Havé, écrivain, enseignant de français et chercheur ; auteur de recueils de nouvelles et de romans, dont Nawir, inscrit au programme de l'enseignement secondaire au Togo.", en: "born on 12 November 1970 in Havé, writer, French teacher and researcher; author of short-story collections and novels, including Nawir, on the secondary-school curriculum in Togo.", de: "geboren am 12. November 1970 in Havé, Schriftsteller, Französischlehrer und Forscher; Autor von Erzählbänden und Romanen, darunter Nawir, das auf dem Lehrplan der Sekundarstufe in Togo steht." },
  { nom: "Sélom Komlan Gbanou", fr: "universitaire, écrivain, critique littéraire et journaliste (1964 – 16 juillet 2024), spécialiste des littératures africaines francophones, cofondateur du journal satirique Kpakpa Désenchanté.", en: "academic, writer, literary critic and journalist (1964 – 16 July 2024), a specialist in Francophone African literatures, co-founder of the satirical newspaper Kpakpa Désenchanté.", de: "Hochschullehrer, Schriftsteller, Literaturkritiker und Journalist (1964 – 16. Juli 2024), Spezialist für frankophone afrikanische Literaturen, Mitgründer der Satirezeitung Kpakpa Désenchanté." },
];

const DEBUT = Date.UTC(2026, 10, 26, 6, 0, 0);
const horodatage = (i: number) => new Date(DEBUT - i * 20 * 60_000).toISOString();

function portraitVersArticle(p: Portrait, i: number): ArticleRedaction {
  const sources = { fr: `Repères établis d'après ${p.sources}.`, en: `Background drawn from ${p.sources}.`, de: `Angaben nach ${p.sources}.` };
  const titre = {
    fr: `Découverte : ${p.nom}, ${p.metier.fr}`,
    en: `Discovery: ${p.nom}, ${p.metier.en}`,
    de: `Entdeckung: ${p.nom}, ${p.metier.de}`,
  };
  const resume = (t: string) => (t.length <= 300 ? t : `${t.slice(0, t.lastIndexOf(" ", 297))}…`);
  const contenu = (l: "fr" | "en" | "de") => [...p[l], sources[l]].join("\n\n");
  return {
    cle: p.cle,
    titre: titre.fr,
    resume: resume(p.fr[0]),
    contenu: contenu("fr"),
    source_nom: "ArTova",
    url_source: p.url,
    image_url: p.image,
    credit_image: p.credit,
    portee: "togo",
    categorie: "decouverte",
    importance: 5,
    publie_le: horodatage(i),
    personnes: [{ nom: p.nom }, ...(p.aussi ?? []).map((nom) => ({ nom }))],
    revision: 1,
    traductions: {
      en: { titre: titre.en, resume: resume(p.en[0]), contenu: contenu("en") },
      de: { titre: titre.de, resume: resume(p.de[0]), contenu: contenu("de") },
    },
  };
}

function reperesVersArticle(
  cle: string,
  titre: { fr: string; en: string; de: string },
  intro: { fr: string; en: string; de: string },
  liste: Repere[],
  i: number,
): ArticleRedaction {
  const corps = (l: "fr" | "en" | "de") => [intro[l], ...liste.map((r) => `## ${r.nom}\n\n${r[l]}`)].join("\n\n");
  const note = {
    fr: `Repères établis d'après ${LICENCE}.`,
    en: `Background drawn from ${LICENCE}.`,
    de: `Angaben nach ${LICENCE}.`,
  };
  return {
    cle,
    titre: titre.fr,
    resume: intro.fr,
    contenu: `${corps("fr")}\n\n${note.fr}`,
    source_nom: "ArTova",
    portee: "togo",
    categorie: "decouverte",
    importance: 6,
    publie_le: horodatage(i),
    personnes: liste.map((r) => ({ nom: r.nom })),
    revision: 1,
    traductions: {
      en: { titre: titre.en, resume: intro.en, contenu: `${corps("en")}\n\n${note.en}` },
      de: { titre: titre.de, resume: intro.de, contenu: `${corps("de")}\n\n${note.de}` },
    },
  };
}

export const ARTICLES_DECOUVERTES: ArticleRedaction[] = [
  reperesVersArticle(
    "reperes-arts-visuels-togo",
    {
      fr: "Plasticiens, dessinateurs et photographes togolais : treize noms à connaître",
      en: "Togolese visual artists, illustrators and photographers: thirteen names to know",
      de: "Togoische bildende Künstler, Zeichner und Fotografen: dreizehn Namen, die man kennen sollte",
    },
    {
      fr: "Au-delà des figures déjà présentées dans nos Découvertes, la scène visuelle togolaise compte de nombreux artistes, au Togo comme dans la diaspora. Treize noms, avec leurs repères.",
      en: "Beyond the figures already featured in our Discoveries, the Togolese visual scene counts many artists, in Togo and in the diaspora. Thirteen names, with key facts.",
      de: "Über die bereits in unseren Entdeckungen vorgestellten Gestalten hinaus zählt die togoische Bildkunstszene viele Künstler, in Togo wie in der Diaspora. Dreizehn Namen mit den wichtigsten Angaben.",
    },
    REPERES_ARTS,
    0,
  ),
  reperesVersArticle(
    "reperes-lettres-togo",
    {
      fr: "Écrivains togolais : six voix à découvrir, du Québec à Cologne",
      en: "Togolese writers: six voices to discover, from Quebec to Cologne",
      de: "Togoische Schriftsteller: sechs Stimmen zum Entdecken, von Québec bis Köln",
    },
    {
      fr: "Poètes, romanciers, universitaires : la littérature togolaise s'écrit au Togo et loin de lui. Six écrivains, avec leurs repères.",
      en: "Poets, novelists, academics: Togolese literature is written in Togo and far from it. Six writers, with key facts.",
      de: "Dichter, Romanautoren, Hochschullehrer: Die togoische Literatur wird in Togo und fern davon geschrieben. Sechs Schriftsteller mit den wichtigsten Angaben.",
    },
    REPERES_LETTRES,
    1,
  ),
  ...PORTRAITS.map((p, i) => portraitVersArticle(p, i + 2)),
];

// « Mots retenus » d'une actualité ou d'une publication : ses mots-dièse, les
// lieux et les termes de l'art qu'elle contient. Affichés sous l'article et
// utilisés par la recherche. Aucune dépendance serveur.

const sansAccents = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const LIEUX = [
  "Palais de Lomé", "Musée Paul Ahyi", "Galerie ARTEMIS", "Musée Kijain", "Institut français", "Nutafe", "Agnassan",
  "Lomé", "Kpalimé", "Aného", "Tsévié", "Sokodé", "Kara", "Atakpamé", "Togo", "Abidjan", "Cotonou", "Accra", "Dakar",
];

const TERMES: [string, RegExp][] = [
  ["vernissage", /\bvernissages?\b/],
  ["exposition", /\b(expositions?|expo|exhibitions?)\b/],
  ["peinture", /\b(peintures?|peintres?|toiles?|painting|painter)\b/],
  ["sculpture", /\bsculpt(ure|eur|rice)?s?\b/],
  ["photographie", /\bphotograph/],
  ["installation", /\binstallations?\b/],
  ["performance", /\bperformances?\b/],
  ["galerie", /\b(galeries?|gallery|galleries)\b/],
  ["musée", /\b(musees?|museums?)\b/],
  ["biennale", /\bbiennales?\b/],
  ["festival", /\bfestivals?\b/],
  ["résidence", /\bresidences?\b/],
  ["atelier", /\b(ateliers?|workshops?)\b/],
  ["art contemporain", /\b(art contemporain|contemporary art)\b/],
  ["patrimoine", /\b(patrimoine|heritage)\b/],
  ["street art", /\b(street art|graffiti|fresques?|murals?)\b/],
  ["céramique", /\b(ceramiques?|poterie)\b/],
  ["textile", /\b(textiles?|tissage|batik)\b/],
  ["design", /\bdesign\b/],
  ["plasticien", /\bplasticien(ne)?s?\b/],
  ["commissaire", /\b(commissaire|curat(or|rice|eur))/],
  ["vente aux enchères", /\b(encheres|auction)\b/],
  ["prix", /\b(prix|awards?|prize|laureate?s?)\b/],
  ["restitution", /\brestitution/],
];

export function motsDieses(texte: string): string[] {
  return [...new Set([...texte.matchAll(/(?<![\p{L}\p{N}&])#([\p{L}\p{N}_]{3,40})/gu)].map((m) => `#${m[1]}`))];
}

// Mots retenus, du plus parlant au plus général (douze au plus).
export function extraireMotsCles(texte: string): string[] {
  const brut = texte.slice(0, 8000);
  const n = sansAccents(brut);
  const lieux = LIEUX.filter((l) => new RegExp(`(?<![a-z0-9])${sansAccents(l)}(?![a-z0-9])`).test(n));
  const termes = TERMES.filter(([, motif]) => motif.test(n)).map(([mot]) => mot);
  const tous = [...motsDieses(brut).slice(0, 6), ...lieux.slice(0, 4), ...termes];
  const vus = new Set<string>();
  return tous
    .filter((m) => {
      const cle = sansAccents(m.replace(/^#/, ""));
      if (vus.has(cle)) return false;
      vus.add(cle);
      return true;
    })
    .slice(0, 12);
}

export function lireMotsCles(brut: string | null | undefined): string[] {
  return (brut ?? "").split("|").map((m) => m.trim()).filter(Boolean).slice(0, 12);
}

export const ecrireMotsCles = (mots: string[]): string | null => (mots.length > 0 ? mots.join("|").slice(0, 600) : null);

// Dates d'un rendez-vous écrites en français dans une publication
// (« du 12 au 20 décembre », « samedi 5 décembre 2026 »).
const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

export function extraireDates(texte: string, reference: Date): { debut: string; fin: string | null } | null {
  const n = sansAccents(texte);
  const mois = MOIS.join("|");
  const date = (jour: string, nomMois: string, annee: string | undefined): string | null => {
    const m = MOIS.indexOf(nomMois);
    const j = Number(jour);
    if (m < 0 || j < 1 || j > 31) return null;
    let a = annee ? Number(annee) : reference.getUTCFullYear();
    if (!annee && Date.UTC(a, m, j) < reference.getTime() - 30 * 86_400_000) a++;
    const d = new Date(Date.UTC(a, m, j));
    if (d.getUTCDate() !== j) return null;
    // Plausible : au plus 60 jours avant la publication, 400 jours après.
    const ecart = (d.getTime() - reference.getTime()) / 86_400_000;
    return ecart < -60 || ecart > 400 ? null : d.toISOString().slice(0, 10);
  };
  const plage = new RegExp(`\\bdu (\\d{1,2})(?:er)?(?: (${mois}))? au (\\d{1,2})(?:er)? (${mois})(?: (20\\d\\d))?`).exec(n);
  if (plage) {
    const debut = date(plage[1], plage[2] ?? plage[4], plage[5]);
    const fin = date(plage[3], plage[4], plage[5]);
    if (debut && fin && fin >= debut) return { debut, fin };
  }
  const jour = new RegExp(`\\b(\\d{1,2})(?:er)? (${mois})(?: (20\\d\\d))?`).exec(n);
  if (jour) {
    const debut = date(jour[1], jour[2], jour[3]);
    if (debut) return { debut, fin: null };
  }
  return null;
}

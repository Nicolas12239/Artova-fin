import { query } from "./db";
import {
  contenuLangue,
  lirePersonnes,
  type Actualite,
  type PersonneCitee,
  type RolePersonne,
} from "./actualites-commun";
import { actualitesDuTag, portraitsArtistes, tagParSlug } from "./actualites";
import { slugTag } from "./actualites-tags";
import type { Langue } from "./actualites-i18n";

// Fiche d'une personne citée dans l'actualité : qui c'est, ce qu'elle a fait dans
// chaque article, ses liens publics et tous les reportages qui la concernent.
// Tout est reconstitué à partir des dossiers des articles : rien n'est saisi à part.

export interface ReportagePersonne {
  a: Actualite;
  role?: RolePersonne;
  note?: string;
}

export interface FichePersonne {
  slug: string;
  nom: string;
  nb: number;
  image: string | null;
  credit: string | null;
  // Page de l'artiste sur ArTova, si elle existe.
  slugArtova: string | null;
  roles: { role: RolePersonne; nb: number }[];
  profils: string[];
  // Présentation tirée de son portrait « Découverte », quand il existe.
  bio: { texte: string; article: Actualite } | null;
  reportages: ReportagePersonne[];
  // Autres personnes citées dans les mêmes articles.
  avec: { slug: string; nom: string; nb: number }[];
}

export async function fichePersonne(slug: string, langue: Langue): Promise<FichePersonne | null> {
  const tag = await tagParSlug(slug);
  if (!tag) return null;
  const articles = await actualitesDuTag(slug, 60);
  const reportages: ReportagePersonne[] = [];
  const roles = new Map<RolePersonne, number>();
  const profils = new Set<string>();
  const avec = new Map<string, { slug: string; nom: string; nb: number }>();
  let image: string | null = null;
  let credit: string | null = null;
  let slugArtova: string | null = null;
  let bio: FichePersonne["bio"] = null;

  for (const a of articles) {
    const gens = lirePersonnes(a.personnes);
    const moi = gens.find((p) => slugTag(p.nom) === slug);
    reportages.push({ a, role: moi?.role, note: moi?.note });
    if (moi?.role) roles.set(moi.role, (roles.get(moi.role) ?? 0) + 1);
    if (moi?.profil) profils.add(moi.profil);
    if (!image && moi?.image) {
      image = moi.image;
      credit = moi.credit ?? null;
    }
    if (!slugArtova && moi?.slug) slugArtova = moi.slug;
    // Portrait « Découverte » : la personne est la première citée.
    if (!bio && a.categorie === "decouverte" && gens[0] && slugTag(gens[0].nom) === slug) {
      bio = { texte: contenuLangue(a, langue).resume, article: a };
    }
    for (const g of gens) {
      const s = slugTag(g.nom);
      if (!s || s === slug) continue;
      const e = avec.get(s) ?? { slug: s, nom: g.nom, nb: 0 };
      e.nb++;
      avec.set(s, e);
    }
  }
  // Sans portrait « Découverte », la précision sourcée la plus récente tient lieu de présentation.
  if (!bio) {
    const avecNote = reportages.find((r) => r.note);
    if (avecNote?.note) bio = { texte: avecNote.note, article: avecNote.a };
  }
  if (!image && slugArtova) image = (await portraitsArtistes([slugArtova])).get(slugArtova) ?? null;
  return {
    slug,
    nom: tag.nom,
    nb: tag.nb,
    image,
    credit,
    slugArtova,
    roles: [...roles].map(([role, nb]) => ({ role, nb })).sort((x, y) => y.nb - x.nb),
    profils: [...profils].slice(0, 4),
    bio,
    reportages,
    avec: [...avec.values()].sort((x, y) => y.nb - x.nb || x.nom.localeCompare(y.nom, "fr")).slice(0, 8),
  };
}

export interface ResumePersonne {
  slug: string;
  nom: string;
  nb: number;
  image: string | null;
  credit: string | null;
  role: RolePersonne | null;
  slugArtova: string | null;
  derniere: number;
}

// Toutes les personnes citées, avec une photo et un rôle quand les dossiers en
// donnent. Sert à l'index « Les artistes dans l'actualité ».
export async function resumesPersonnes(): Promise<ResumePersonne[]> {
  const lignes = await query<{ personnes: string; publie_le: Date }>(
    "SELECT personnes, publie_le FROM actualites WHERE statut = 'publie' AND personnes IS NOT NULL",
  );
  const parSlug = new Map<string, ResumePersonne & { roles: Map<RolePersonne, number> }>();
  for (const l of lignes) {
    const date = new Date(l.publie_le).getTime();
    const vus = new Set<string>();
    for (const p of lirePersonnes(l.personnes)) {
      const slug = slugTag(p.nom);
      if (!slug || vus.has(slug)) continue;
      vus.add(slug);
      const e = parSlug.get(slug) ?? { slug, nom: p.nom, nb: 0, image: null, credit: null, role: null, slugArtova: null, derniere: 0, roles: new Map() };
      e.nb++;
      e.derniere = Math.max(e.derniere, date);
      remplir(e, p);
      parSlug.set(slug, e);
    }
  }
  const resumes = [...parSlug.values()].map(({ roles, ...r }) => ({
    ...r,
    role: [...roles].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null,
  }));
  const sansPhoto = resumes.filter((r) => !r.image && r.slugArtova).map((r) => r.slugArtova as string);
  if (sansPhoto.length > 0) {
    const portraits = await portraitsArtistes(sansPhoto).catch(() => new Map<string, string>());
    for (const r of resumes) if (!r.image && r.slugArtova) r.image = portraits.get(r.slugArtova) ?? null;
  }
  return resumes.sort((x, y) => y.nb - x.nb || x.nom.localeCompare(y.nom, "fr", { sensitivity: "base" }));
}

function remplir(e: ResumePersonne & { roles: Map<RolePersonne, number> }, p: PersonneCitee) {
  if (!e.image && p.image) {
    e.image = p.image;
    e.credit = p.credit ?? null;
  }
  if (!e.slugArtova && p.slug) e.slugArtova = p.slug;
  if (p.role) e.roles.set(p.role, (e.roles.get(p.role) ?? 0) + 1);
}

// Nombre de reportages par personne (pour les cartes de l'article).
export async function comptesParSlug(slugs: string[]): Promise<Map<string, number>> {
  const uniques = [...new Set(slugs.filter(Boolean))];
  if (uniques.length === 0) return new Map();
  const lignes = await query<{ slug: string; n: number }>(
    `SELECT t.slug, COUNT(*) AS n FROM actualites_tags t
     JOIN actualites a ON a.id = t.actualite_id AND a.statut = 'publie'
     WHERE t.slug IN (${uniques.map(() => "?").join(",")}) GROUP BY t.slug`,
    uniques,
  );
  return new Map(lignes.map((l) => [l.slug, Number(l.n)]));
}

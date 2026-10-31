import { query } from "./db";

export type Inscrit = {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  statut: "Collectionneur" | "Artiste" | "Administrateur";
  methode_connexion: string;
  nom_artiste: string | null;
  page_artiste: string | null;
  nb_commandes: number;
  inscrit_le: Date;
};

export const FILTRES_INSCRITS = {
  tous: null,
  collectionneurs: "Collectionneur",
  artistes: "Artiste",
} as const;

export type FiltreInscrits = keyof typeof FILTRES_INSCRITS;

export function filtreValide(valeur: string | undefined): FiltreInscrits {
  return valeur === "collectionneurs" || valeur === "artistes" ? valeur : "tous";
}

export async function listerInscrits(filtre: FiltreInscrits): Promise<Inscrit[]> {
  const statut = FILTRES_INSCRITS[filtre];
  return query<Inscrit>(
    statut
      ? "SELECT * FROM inscrits WHERE statut = ? ORDER BY inscrit_le DESC"
      : "SELECT * FROM inscrits WHERE statut <> 'Administrateur' ORDER BY inscrit_le DESC",
    statut ? [statut] : [],
  );
}

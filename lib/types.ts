export type Role = "client" | "artiste" | "admin";

// Part prélevée par ArTova sur le prix de chaque œuvre vendue.
export const COMMISSION_ARTOVA = 30;

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  mot_de_passe_hash: string | null;
  telephone: string | null;
  role: Role;
  cree_le: Date;
}

export type UtilisateurSession = Omit<Utilisateur, "mot_de_passe_hash">;

export type Discipline = "peintre" | "plasticien" | "sculpteur";
export type Motif = "pinceau" | "collage" | "pierre";
export type StatutArtiste = "brouillon" | "en_attente" | "publie";

export interface Artiste {
  id: number;
  slug: string;
  nom: string;
  discipline: Discipline;
  ville: string | null;
  histoire: string;
  note_univers: string | null;
  theme_primaire: string;
  theme_accent: string;
  theme_fond: string;
  motif: Motif;
  portrait_url: string;
  banniere_url: string | null;
  utilisateur_id: number | null;
  statut: StatutArtiste;
  annee_debut: number | null;
  formation: string | null;
  techniques: string | null;
  expositions: string | null;
  commission_acceptee_le: Date | null;
  cree_le: Date;
}

export type TypeOeuvre = "toile" | "sculpture";
export type StatutOeuvre = "disponible" | "reserve" | "vendu";

export interface Oeuvre {
  id: number;
  artiste_id: number;
  titre: string;
  type: TypeOeuvre;
  prix_fcfa: number;
  annee: number | null;
  dimensions: string | null;
  technique: string | null;
  description: string;
  image_url: string;
  oeuvre_maitre: number;
  statut: StatutOeuvre;
  cree_le: Date;
}

export interface OeuvreAvecArtiste extends Oeuvre {
  artiste_nom: string;
  artiste_slug: string;
  theme_primaire: string;
  theme_accent: string;
}

export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "expediee"
  | "livree"
  | "annulee";

export interface Commande {
  id: number;
  reference: string;
  utilisateur_id: number;
  oeuvre_id: number;
  statut: StatutCommande;
  telephone: string;
  ville: string;
  adresse: string | null;
  message: string | null;
  cree_le: Date;
}

export interface CommandeDetaillee extends Commande {
  client_nom: string;
  client_email: string;
  oeuvre_titre: string;
  oeuvre_image: string;
  prix_fcfa: number;
  artiste_nom: string;
}

export const LIBELLE_DISCIPLINE: Record<Discipline, string> = {
  peintre: "Peintre",
  plasticien: "Plasticien·ne",
  sculpteur: "Sculpteur",
};

export const LIBELLE_STATUT_COMMANDE: Record<StatutCommande, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const LIBELLE_STATUT_ARTISTE: Record<StatutArtiste, string> = {
  brouillon: "Brouillon",
  en_attente: "En attente de validation",
  publie: "Publiée",
};

export const LIBELLE_STATUT_OEUVRE: Record<StatutOeuvre, string> = {
  disponible: "Disponible",
  reserve: "Réservée",
  vendu: "Vendue",
};

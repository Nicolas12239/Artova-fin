import { normaliser } from "./actualites-flux";

// Règles du bilan quotidien d'Actu art (sans base de données : testables seules).

export interface ArticleBilan {
  id: number;
  titre: string;
  resume: string;
  contenu: string | null;
  publie_le: Date;
  evenement_debut: string | null;
  evenement_fin: string | null;
  origine: string;
  categorie: string;
}

export interface DonneesBilan {
  maintenant: Date;
  articles: ArticleBilan[];
  une: ArticleBilan | null;
  nouvelles24h: number;
  derniereCollecte: Date | null;
  imagesCassees: string[];
  sourcesEnErreur: string[];
  artistesEnAttente: string[];
  notificationsEnAttente: number;
}

const court = (titre: string) => (titre.length > 70 ? `${titre.slice(0, 68)}…` : titre);
const liste = (noms: string[], max = 3) =>
  `${noms.slice(0, max).map((n) => `« ${court(n)} »`).join(", ")}${noms.length > max ? ` et ${noms.length - max} autre(s)` : ""}`;

// Formules qui deviennent fausses avec le temps.
const RELATIF = /\b(ce (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|soir|week-?end)|demain|aujourd'hui|cette semaine)\b/;

export function redigerBilan(d: DonneesBilan): { titre: string; message: string; points: number } {
  const jour = (decalage: number) => new Date(d.maintenant.getTime() + decalage * 86_400_000).toISOString().slice(0, 10);
  const aujourdhui = jour(0);
  const fin = (a: ArticleBilan) => a.evenement_fin ?? a.evenement_debut;
  const rendezVous = d.articles.filter((a) => a.evenement_debut);

  const points: string[] = [];
  const heures = d.derniereCollecte ? Math.round((d.maintenant.getTime() - d.derniereCollecte.getTime()) / 3600_000) : null;
  if (heures === null || heures > 26) {
    points.push(heures === null ? "La collecte automatique n'a jamais tourné." : `Collecte arrêtée : dernier passage il y a ${heures} h.`);
  } else if (d.nouvelles24h === 0) {
    points.push("Aucune nouvelle publication depuis 24 h.");
  }
  if (!d.une) points.push("Aucune actualité à la une.");
  else if (d.une.evenement_debut && (fin(d.une) as string) < aujourdhui) points.push(`La une montre un événement terminé : ${liste([d.une.titre])}.`);

  const perimes = d.articles.filter((a) => {
    if (a.origine !== "manuel" || a.categorie === "decouverte") return false;
    const ancien = d.maintenant.getTime() - new Date(a.publie_le).getTime() > 2 * 86_400_000;
    const passe = Boolean(a.evenement_debut) && (fin(a) as string) < aujourdhui;
    return (ancien || passe) && RELATIF.test(normaliser(`${a.titre} ${a.resume} ${a.contenu ?? ""}`));
  });
  if (perimes.length > 0) points.push(`Texte à actualiser (formule comme « ce vendredi ») : ${liste(perimes.map((a) => a.titre))}.`);
  if (d.imagesCassees.length > 0) points.push(`${d.imagesCassees.length} image(s) cassée(s) : ${liste(d.imagesCassees)}.`);

  const parTitre = new Map<string, ArticleBilan[]>();
  for (const a of d.articles) {
    const cle = normaliser(a.titre);
    parTitre.set(cle, [...(parTitre.get(cle) ?? []), a]);
  }
  const doublons = [...parTitre.values()].filter((g) => g.length > 1).map((g) => g[0].titre);
  if (doublons.length > 0) points.push(`Doublon(s) : ${liste(doublons)}.`);
  if (d.artistesEnAttente.length > 0) points.push(`${d.artistesEnAttente.length} page(s) d'artiste à valider : ${liste(d.artistesEnAttente)}.`);
  if (d.sourcesEnErreur.length > 0) points.push(`${d.sourcesEnErreur.length} source(s) en erreur : ${d.sourcesEnErreur.slice(0, 4).join(", ")}.`);
  if (d.notificationsEnAttente > 0) points.push(`${d.notificationsEnAttente} notification(s) pas encore envoyée(s).`);

  const infos: string[] = [];
  const enCours = rendezVous.filter((a) => (a.evenement_debut as string) <= aujourdhui && (fin(a) as string) >= aujourdhui);
  const finissent = enCours.filter((a) => (fin(a) as string) <= jour(3));
  const commencent = rendezVous.filter((a) => (a.evenement_debut as string) > aujourdhui && (a.evenement_debut as string) <= jour(3));
  const termines = rendezVous.filter((a) => (fin(a) as string) === jour(-1));
  if (enCours.length > 0) infos.push(`En cours (${enCours.length}) : ${liste(enCours.map((a) => a.titre))}.`);
  if (finissent.length > 0) infos.push(`Se terminent sous 3 jours : ${liste(finissent.map((a) => a.titre))}.`);
  if (commencent.length > 0) infos.push(`Commencent sous 3 jours : ${liste(commencent.map((a) => a.titre))}.`);
  if (termines.length > 0) infos.push(`Terminés hier (ajouter un compte rendu ?) : ${liste(termines.map((a) => a.titre))}.`);
  infos.push(`Publications des dernières 24 h : ${d.nouvelles24h}.`);

  return {
    points: points.length,
    titre: points.length === 0 ? "ArTova : tout est à jour" : `ArTova : ${points.length} point(s) à voir`,
    message: [...points.map((p) => `• ${p}`), points.length > 0 ? "" : "Rien à corriger.", ...infos].join("\n").trim(),
  };
}

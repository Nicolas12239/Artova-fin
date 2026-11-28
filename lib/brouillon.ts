// Brouillon d'un formulaire d'inscription, gardé sur l'appareil de la personne :
// si la page se recharge (appareil photo qui ferme l'onglet, geste « tirer pour
// actualiser », coupure), la saisie et les fichiers choisis reviennent.
// Jamais de mot de passe. Effacé à la fin de l'inscription, ou après trois jours.

const PREFIXE = "artova-brouillon:";
const DUREE_MS = 3 * 24 * 3600 * 1000;
const BASE = "artova-brouillons";
const MAGASIN = "fichiers";

export type Champs = Record<string, string | boolean>;

export function cleMemoire(cle: string, partie = "champs"): string {
  return `${PREFIXE}${cle}:${partie}`;
}

export function lireMemoire<T>(nom: string): T | null {
  try {
    const brut = window.localStorage.getItem(nom);
    if (!brut) return null;
    const { date, valeur } = JSON.parse(brut) as { date: number; valeur: T };
    if (Date.now() - date > DUREE_MS) {
      window.localStorage.removeItem(nom);
      return null;
    }
    return valeur;
  } catch {
    return null;
  }
}

export function ecrireMemoire(nom: string, valeur: unknown): void {
  try {
    if (valeur === null) window.localStorage.removeItem(nom);
    else window.localStorage.setItem(nom, JSON.stringify({ date: Date.now(), valeur }));
  } catch {
    // navigation privée ou stockage plein : le formulaire fonctionne sans brouillon
  }
}

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const demande = window.indexedDB.open(BASE, 1);
    demande.onupgradeneeded = () => demande.result.createObjectStore(MAGASIN);
    demande.onsuccess = () => ok(demande.result);
    demande.onerror = () => ko(demande.error);
  });
}

async function operation<T>(mode: IDBTransactionMode, faire: (m: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const base = await ouvrir();
  try {
    return await new Promise<T>((ok, ko) => {
      const demande = faire(base.transaction(MAGASIN, mode).objectStore(MAGASIN));
      demande.onsuccess = () => ok(demande.result);
      demande.onerror = () => ko(demande.error);
    });
  } finally {
    base.close();
  }
}

const plage = (cle: string) => IDBKeyRange.bound(`${cle}|`, `${cle}|￿`);

export async function ecrireFichier(cle: string, champ: string, fichier: File | null): Promise<void> {
  try {
    if (fichier) await operation("readwrite", (m) => m.put({ fichier, date: Date.now() }, `${cle}|${champ}`));
    else await operation("readwrite", (m) => m.delete(`${cle}|${champ}`));
  } catch {
    // stockage indisponible : seul le texte sera retrouvé
  }
}

export async function lireFichiers(cle: string): Promise<Map<string, File>> {
  const trouves = new Map<string, File>();
  try {
    const [cles, valeurs] = await Promise.all([
      operation("readonly", (m) => m.getAllKeys(plage(cle))),
      operation("readonly", (m) => m.getAll(plage(cle))) as Promise<{ fichier: File; date: number }[]>,
    ]);
    cles.forEach((k, i) => {
      const v = valeurs[i];
      if (v && Date.now() - v.date <= DUREE_MS) trouves.set(String(k).slice(cle.length + 1), v.fichier);
    });
  } catch {
    // rien à retrouver
  }
  return trouves;
}

export async function effacerBrouillon(cle: string): Promise<void> {
  try {
    for (const nom of Object.keys(window.localStorage)) {
      if (nom.startsWith(`${PREFIXE}${cle}:`)) window.localStorage.removeItem(nom);
    }
  } catch {
    // stockage indisponible
  }
  try {
    await operation("readwrite", (m) => m.delete(plage(cle)));
  } catch {
    // idem
  }
}

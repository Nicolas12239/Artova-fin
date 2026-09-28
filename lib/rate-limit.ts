const frappes = new Map<string, number[]>();

export function estSousLimite(
  cle: string,
  maxFrappes: number,
  fenetreMs: number,
): boolean {
  const maintenant = Date.now();
  const historiques = (frappes.get(cle) ?? []).filter(
    (t) => maintenant - t < fenetreMs,
  );
  if (historiques.length >= maxFrappes) {
    frappes.set(cle, historiques);
    return false;
  }
  historiques.push(maintenant);
  frappes.set(cle, historiques);
  return true;
}

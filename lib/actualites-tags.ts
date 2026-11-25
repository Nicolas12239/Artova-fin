// Identifiant d'un tag, utilisable côté navigateur comme côté serveur :
// « A. Sika » devient « a-sika », comme sa page d'artiste ArTova.
import { slugifier } from "./validation";

export function slugTag(nom: string): string {
  return slugifier(nom).slice(0, 100);
}

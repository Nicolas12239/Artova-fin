import { getCurrentUser } from "@/lib/auth";
import { filtreValide, listerInscrits } from "@/lib/inscrits";

function cellule(valeur: unknown): string {
  const texte = valeur instanceof Date ? valeur.toISOString().slice(0, 16).replace("T", " ") : String(valeur ?? "");
  return /[";\n]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

// Export CSV (séparateur « ; » et BOM UTF-8 : s'ouvre directement dans Excel
// en français avec les accents corrects).
export async function GET(request: Request) {
  const utilisateur = await getCurrentUser();
  if (!utilisateur || utilisateur.role !== "admin") return new Response(null, { status: 403 });

  const filtre = filtreValide(new URL(request.url).searchParams.get("filtre") ?? undefined);
  const inscrits = await listerInscrits(filtre);
  const entetes = ["Nom", "E-mail", "Téléphone", "Statut", "Nom d'artiste", "Page artiste", "Connexion", "Commandes", "Inscrit le"];
  const lignes = inscrits.map((i) =>
    [i.nom, i.email, i.telephone, i.statut, i.nom_artiste, i.page_artiste, i.methode_connexion, i.nb_commandes, i.inscrit_le]
      .map(cellule)
      .join(";"),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + [entetes.join(";"), ...lignes].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="artova-inscrits-${filtre}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

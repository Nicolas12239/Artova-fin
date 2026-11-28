import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

// Fichier d'un artiste (histoire ou parcours). Public seulement si l'artiste l'a
// choisi ET que sa page est en ligne ; sinon réservé à l'artiste et à l'équipe.
export async function GET(_request: Request, ctx: RouteContext<"/documents/[id]">) {
  const { id } = await ctx.params;
  const introuvable = () => new Response("Document introuvable", { status: 404 });
  if (!/^[0-9a-f]{32}$/.test(id)) return introuvable();

  const rows = await query<{ nom: string; type: string; public: number; statut: string; utilisateur_id: number | null; donnees: Buffer }>(
    `SELECT d.nom, d.type, d.public, d.donnees, a.statut, a.utilisateur_id
     FROM documents_artistes d JOIN artistes a ON a.id = d.artiste_id WHERE d.id = ? LIMIT 1`,
    [id],
  );
  const document = rows[0];
  if (!document) return introuvable();

  if (!(document.public === 1 && document.statut === "publie")) {
    const utilisateur = await getCurrentUser();
    const autorise = utilisateur && (utilisateur.role === "admin" || utilisateur.id === document.utilisateur_id);
    if (!autorise) return introuvable();
  }

  // PDF et photos s'affichent ; les autres formats se téléchargent.
  const affichable = document.type === "application/pdf" || /^image\/(jpeg|png|webp)$/.test(document.type);
  return new Response(new Uint8Array(document.donnees), {
    headers: {
      "Content-Type": document.type,
      "Content-Disposition": `${affichable ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(document.nom)}`,
      "X-Content-Type-Options": "nosniff",
      // Le droit de lecture peut changer : rien n'est conservé par les caches.
      "Cache-Control": "private, no-store",
    },
  });
}

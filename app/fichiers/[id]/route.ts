import { query } from "@/lib/db";

export async function GET(_request: Request, ctx: RouteContext<"/fichiers/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f]{32}$/.test(id)) return new Response(null, { status: 404 });

  const rows = await query<{ type: string; donnees: Buffer }>(
    "SELECT type, donnees FROM fichiers WHERE id = ? LIMIT 1",
    [id],
  );
  const fichier = rows[0];
  if (!fichier) return new Response(null, { status: 404 });

  // Un identifiant n'est jamais réutilisé : le contenu est immuable.
  return new Response(new Uint8Array(fichier.donnees), {
    headers: {
      "Content-Type": fichier.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

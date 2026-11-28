import { timingSafeEqual } from "node:crypto";
import { collecterActualites } from "@/lib/actualites-collecte";
import { collecterReseaux } from "@/lib/actualites-social";

export const dynamic = "force-dynamic";
// 60 s est le plafond de tous les forfaits Vercel ; la collecte s'arrête d'elle-même avant.
export const maxDuration = 60;

function autorise(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recu = Buffer.from(request.headers.get("authorization") ?? "");
  const attendu = Buffer.from(`Bearer ${secret}`);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

// Appelé chaque matin par Vercel Cron (voir vercel.json), qui joint
// automatiquement « Authorization: Bearer $CRON_SECRET ».
export async function GET(request: Request) {
  if (!autorise(request)) return new Response("Non autorisé", { status: 401 });
  try {
    const [presse, reseaux] = await Promise.all([
      collecterActualites({ budgetMs: 50_000 }),
      collecterReseaux({ budgetMs: 45_000 }).catch((erreur) => {
        console.error("[ArTova] Collecte des réseaux :", erreur);
        return null;
      }),
    ]);
    return Response.json({ ...presse, reseaux });
  } catch (erreur) {
    console.error("[ArTova] Collecte des actualités :", erreur);
    return Response.json({ erreur: "La collecte a échoué." }, { status: 500 });
  }
}

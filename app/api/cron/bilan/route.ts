import { autoriseCron } from "@/lib/cron";
import { envoyerBilan } from "@/lib/bilan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bilan quotidien d'Actu art, envoyé sur le téléphone par ntfy (voir vercel.json).
export async function GET(request: Request) {
  if (!autoriseCron(request)) return new Response("Non autorisé", { status: 401 });
  try {
    return Response.json(await envoyerBilan());
  } catch (erreur) {
    console.error("[ArTova] Bilan quotidien :", erreur);
    return Response.json({ erreur: "Le bilan a échoué." }, { status: 500 });
  }
}

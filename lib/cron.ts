import { timingSafeEqual } from "node:crypto";

// Les tâches planifiées de Vercel joignent « Authorization: Bearer $CRON_SECRET ».
export function autoriseCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recu = Buffer.from(request.headers.get("authorization") ?? "");
  const attendu = Buffer.from(`Bearer ${secret}`);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

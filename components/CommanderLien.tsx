import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function CommanderLien({
  oeuvreId,
  statut,
}: {
  oeuvreId: number;
  statut: string;
}) {
  if (statut !== "disponible") {
    return (
      <span className="inline-block border border-fil bg-panel px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-gris">
        {statut === "reserve" ? "Œuvre réservée" : "Œuvre vendue"}
      </span>
    );
  }

  const utilisateur = await getCurrentUser();

  if (!utilisateur) {
    return (
      <Link
        href={`/connexion?next=/commande/${oeuvreId}`}
        className="inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
      >
        Se connecter pour commander ↗
      </Link>
    );
  }

  return (
    <Link
      href={`/commande/${oeuvreId}`}
      className="inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
    >
      Commander cette œuvre ↗
    </Link>
  );
}

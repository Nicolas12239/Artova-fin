import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  robots: { index: false, follow: false },
};

const ONGLETS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/inscrits", label: "Inscrits" },
  { href: "/admin/artistes", label: "Artistes" },
  { href: "/admin/oeuvres", label: "Œuvres" },
];

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const utilisateur = await getCurrentUser();
  if (!utilisateur || utilisateur.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-terracotta">ADMINISTRATION</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Espace ArTova</h1>
        </div>
        <Link
          href="/"
          className="text-sm tracking-wide text-encre/70 underline-offset-4 hover:text-terracotta hover:underline"
        >
          ← Retour au site
        </Link>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-encre/10 pb-3" aria-label="Sections admin">
        {ONGLETS.map((onglet) => (
          <Link
            key={onglet.href}
            href={onglet.href}
            className="border border-encre/20 px-4 py-2 text-xs tracking-wide transition-colors hover:border-terracotta hover:text-terracotta"
          >
            {onglet.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">{children}</div>
    </div>
  );
}

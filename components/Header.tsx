import Link from "next/link";
import { deconnecter } from "@/app/actions/auth";
import type { UtilisateurSession } from "@/lib/types";
import { LogoComplet } from "./Logo";
import { MenuMobile } from "./MenuMobile";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/artistes", label: "Nos artistes" },
  { href: "/#mouvement", label: "Le mouvement" },
];

function IconeCompte({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5c1.2-2.6 3.1-3.9 5.5-3.9s4.3 1.3 5.5 3.9" />
    </svg>
  );
}

export function Header({
  utilisateur,
}: {
  utilisateur: UtilisateurSession | null;
}) {
  return (
    <header className="sticky top-0 z-50">
      <div className="relative">
        <div className="flex h-14 items-center justify-between border-b border-fil bg-[#efede4] pl-44 pr-4 sm:pr-6 md:h-16 md:pl-60 lg:pr-10">
          <nav
            className="hidden items-center gap-9 md:flex"
            aria-label="Navigation principale"
          >
            {LIENS.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="font-display text-[16px] text-encre/85 underline-offset-4 hover:underline"
              >
                {lien.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            {utilisateur ? (
              <>
                {utilisateur.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-[12px] uppercase tracking-[0.16em] text-encre/80 underline-offset-4 hover:underline"
                  >
                    Administration
                  </Link>
                )}
                <Link
                  href="/compte"
                  className="flex items-center gap-2 font-display text-[16px] text-encre/85 underline-offset-4 hover:underline"
                >
                  <IconeCompte />
                  {utilisateur.nom.split(" ")[0]}
                </Link>
                <form action={deconnecter}>
                  <button
                    type="submit"
                    className="text-[12px] uppercase tracking-[0.16em] text-gris transition-colors hover:text-encre"
                  >
                    Se déconnecter
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="flex items-center gap-2 font-display text-[16px] text-encre/85 underline-offset-4 hover:underline"
                >
                  <IconeCompte />
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="text-[12px] uppercase tracking-[0.16em] text-encre/80 underline-offset-4 hover:underline"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>

          <MenuMobile
            liens={[
              ...LIENS,
              ...(utilisateur
                ? [
                    ...(utilisateur.role === "admin"
                      ? [{ href: "/admin", label: "Administration" }]
                      : []),
                    { href: "/compte", label: "Mon compte" },
                  ]
                : [
                    { href: "/connexion", label: "Se connecter" },
                    { href: "/inscription", label: "Créer un compte" },
                  ]),
            ]}
            connecte={Boolean(utilisateur)}
          />
        </div>

        <Link
          href="/"
          aria-label="ArTova — accueil"
          className="absolute left-0 top-0 z-50 flex h-24 w-36 items-center justify-center border-b border-r border-fil bg-craie sm:w-44 md:h-28 md:w-56"
        >
          <LogoComplet className="h-8 w-auto md:h-10" />
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-fil bg-craie">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <LogoComplet className="h-9 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gris">
            Le mouvement qui fait vivre l'art togolais : toiles et sculptures
            d'artistes peintres, plasticiens et sculpteurs du Togo.
          </p>
        </div>
        <nav aria-label="Navigation pied de page" className="text-sm">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gris">
            Explorer
          </h2>
          <ul className="mt-4 space-y-2 text-encre/80">
            <li><Link className="hover:underline" href="/artistes">Nos artistes</Link></li>
            <li><Link className="hover:underline" href="/#mouvement">Le mouvement</Link></li>
            <li><Link className="hover:underline" href="/inscription">Rejoindre ArTova</Link></li>
            <li><Link className="hover:underline" href="/connexion">Se connecter</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gris">
            Contact
          </h2>
          <ul className="mt-4 space-y-2 text-encre/80">
            <li>Lomé, Togo</li>
            <li>
              <a className="hover:underline" href="mailto:nicolasnjimoluh0@gmail.com">
                nicolasnjimoluh0@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-fil py-5 text-center text-[11px] uppercase tracking-[0.16em] text-gris">
        © {new Date().getFullYear()} ArTova — Lomé, Togo. Tous droits réservés.
      </div>
    </footer>
  );
}

import Link from "next/link";
import { deconnecter } from "@/app/actions/auth";
import type { UtilisateurSession } from "@/lib/types";
import { LogoComplet } from "./Logo";
import { MenuMobile } from "./MenuMobile";

export const CONTACT = {
  email: "artovacorp@gmail.com",
  tiktok: "https://www.tiktok.com/@artova.corp",
  instagram: "https://www.instagram.com/artova.corp",
};

function liens(connecte: boolean) {
  return [
    { href: "/", label: "Accueil" },
    // Les visiteurs non connectés sont dirigés vers l'aperçu public.
    { href: connecte ? "/artistes" : "/#apercu", label: "Nos artistes" },
    { href: "/#mouvement", label: "Le mouvement" },
  ];
}

function IconeTiktok({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.37-2.48V9.66a5.7 5.7 0 0 0-.77-.05A5.73 5.73 0 0 0 4.13 15.3 5.73 5.73 0 0 0 9.86 21a5.73 5.73 0 0 0 5.73-5.7V9.01a7.35 7.35 0 0 0 4.28 1.37V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
    </svg>
  );
}

function IconeInstagram({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

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
  const LIENS = liens(Boolean(utilisateur));
  return (
    <header className="sticky top-0 z-50">
      <div className="relative">
        <div className="flex h-14 items-center justify-between border-b border-fil bg-[#efede4] pl-40 pr-4 sm:pl-48 sm:pr-6 md:h-16 md:pl-60 lg:pr-10">
          <nav
            className="hidden items-center gap-6 md:flex lg:gap-9"
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

          <div className="hidden items-center gap-4 md:flex lg:gap-6">
            {utilisateur ? (
              <>
                {utilisateur.role === "artiste" && (
                  <Link
                    href="/espace-artiste"
                    className="whitespace-nowrap text-[12px] uppercase tracking-[0.16em] text-encre/80 underline-offset-4 hover:underline"
                  >
                    Espace artiste
                  </Link>
                )}
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
                  className="flex items-center gap-2 whitespace-nowrap font-display text-[16px] text-encre/85 underline-offset-4 hover:underline"
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
            contact={CONTACT}
            liens={[
              ...LIENS,
              ...(utilisateur
                ? [
                    ...(utilisateur.role === "admin"
                      ? [{ href: "/admin", label: "Administration" }]
                      : []),
                    ...(utilisateur.role === "artiste"
                      ? [{ href: "/espace-artiste", label: "Espace artiste" }]
                      : []),
                    { href: "/compte", label: "Mon compte" },
                  ]
                : [
                    { href: "/connexion", label: "Se connecter" },
                    { href: "/inscription", label: "Créer un compte" },
                    { href: "/inscription?profil=artiste", label: "Vous êtes artiste ?" },
                  ]),
            ]}
            connecte={Boolean(utilisateur)}
          />
        </div>

        <Link
          href="/"
          aria-label="Accueil ArTova"
          className="absolute left-0 top-0 z-50 flex h-20 w-36 items-center justify-center border-b border-r border-fil bg-craie sm:h-24 sm:w-44 md:h-28 md:w-56"
        >
          <LogoComplet className="h-7 w-auto sm:h-8 md:h-10" />
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-fil bg-craie">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="sm:col-span-2 md:col-span-1">
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
            <li><Link className="hover:underline" href="/#apercu">Nos artistes</Link></li>
            <li><Link className="hover:underline" href="/#mouvement">Le mouvement</Link></li>
            <li><Link className="hover:underline" href="/inscription">Rejoindre ArTova</Link></li>
            <li><Link className="hover:underline" href="/inscription?profil=artiste">Vous êtes artiste ?</Link></li>
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
              <a className="break-all hover:underline" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={CONTACT.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ArTova sur TikTok"
              className="flex h-10 w-10 items-center justify-center border border-fil text-encre/80 transition-colors hover:border-encre hover:text-encre"
            >
              <IconeTiktok />
            </a>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ArTova sur Instagram"
              className="flex h-10 w-10 items-center justify-center border border-fil text-encre/80 transition-colors hover:border-encre hover:text-encre"
            >
              <IconeInstagram />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-fil px-4 py-5 text-center text-[11px] uppercase tracking-[0.16em] text-gris">
        © {new Date().getFullYear()} ArTova · Lomé, Togo. Tous droits réservés.
      </div>
    </footer>
  );
}

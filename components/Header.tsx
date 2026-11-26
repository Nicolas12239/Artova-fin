import Link from "next/link";
import { deconnecter } from "@/app/actions/auth";
import type { UtilisateurSession } from "@/lib/types";
import { LogoComplet } from "./Logo";
import { LienNav } from "./LienNav";
import { MenuMobile } from "./MenuMobile";

export const CONTACT = {
  email: "artovacorp@gmail.com",
  tiktok: "https://www.tiktok.com/@artova.corp",
  instagram: "https://www.instagram.com/artova.corp",
};

// Les pages artistes et œuvres sont publiques : mêmes liens pour tous.
function liens() {
  return [
    { href: "/", label: "Accueil" },
    { href: "/artistes", label: "Nos artistes" },
    { href: "/actualites", label: "Actu art" },
    { href: "/#comment-ca-marche", label: "Comment ça marche" },
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
  const LIENS = liens();
  return (
    <header
      style={{ viewTransitionName: "en-tete" }}
      className="sticky top-0 z-50 border-b border-fil/80 bg-creme/90 backdrop-blur-md supports-[backdrop-filter]:bg-creme/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Accueil ArTova" className="flex h-11 shrink-0 items-center">
          <LogoComplet className="h-7 w-auto sm:h-8" />
        </Link>

        <nav className="ml-6 hidden items-center gap-6 xl:flex xl:ml-10 xl:gap-8" aria-label="Navigation principale">
          {LIENS.map((lien) => (
            <LienNav key={lien.href} href={lien.href}>
              {lien.label}
            </LienNav>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 xl:flex xl:gap-5">
          {utilisateur ? (
            <>
              {utilisateur.role === "artiste" && (
                <Link href="/espace-artiste" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-fil px-4 text-sm transition-colors hover:border-encre">
                  Espace artiste
                </Link>
              )}
              {utilisateur.role === "admin" && (
                <Link href="/admin" className="inline-flex min-h-11 items-center rounded-full border border-fil px-4 text-sm transition-colors hover:border-encre">
                  Administration
                </Link>
              )}
              <Link href="/compte" className="inline-flex min-h-11 items-center gap-2 font-display text-[17px] text-encre/85 hover:text-encre">
                <IconeCompte />
                {utilisateur.nom.split(" ")[0]}
              </Link>
              <form action={deconnecter}>
                <button type="submit" className="min-h-11 text-sm text-gris transition-colors hover:text-encre">
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap font-display text-[17px] text-encre/85 hover:text-encre">
                <IconeCompte />
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="inline-flex min-h-11 items-center rounded-full bg-encre px-5 text-sm font-medium text-creme transition-colors hover:bg-terracotta"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto xl:hidden">
          <MenuMobile
            contact={CONTACT}
            liens={[
              ...LIENS,
              ...(utilisateur
                ? [
                    ...(utilisateur.role === "admin" ? [{ href: "/admin", label: "Administration" }] : []),
                    ...(utilisateur.role === "artiste" ? [{ href: "/espace-artiste", label: "Espace artiste" }] : []),
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
          <h2 className="text-xs uppercase tracking-[0.2em] text-gris">
            Explorer
          </h2>
          <ul className="mt-4 space-y-2 text-encre/80">
            <li><Link className="hover:underline" href="/artistes">Nos artistes</Link></li>
            <li><Link className="hover:underline" href="/art-togolais">L&apos;art togolais</Link></li>
            <li><Link className="hover:underline" href="/art-togolais/peintres">Peintres togolais</Link></li>
            <li><Link className="hover:underline" href="/art-togolais/sculpteurs">Sculpteurs togolais</Link></li>
            <li><Link className="hover:underline" href="/art-togolais/plasticiens">Plasticiens togolais</Link></li>
            <li><Link className="hover:underline" href="/actualites">Actu art</Link></li>
            <li><Link className="hover:underline" href="/actualites/agenda">Agenda de l&apos;art à Lomé</Link></li>
            <li><Link className="hover:underline" href="/#comment-ca-marche">Comment ça marche</Link></li>
            <li><Link className="hover:underline" href="/#mouvement">Le mouvement</Link></li>
            <li><Link className="hover:underline" href="/inscription">Rejoindre ArTova</Link></li>
            <li><Link className="hover:underline" href="/inscription?profil=artiste">Vous êtes artiste ?</Link></li>
            <li><Link className="hover:underline" href="/connexion">Se connecter</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gris">
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
      <div className="border-t border-fil px-4 py-5 text-center text-xs uppercase tracking-[0.16em] text-gris">
        © {new Date().getFullYear()} ArTova · Lomé, Togo. Tous droits réservés.
      </div>
    </footer>
  );
}

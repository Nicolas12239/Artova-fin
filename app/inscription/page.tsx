import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FormInscription } from "@/components/FormAuth";
import { FormInscriptionArtiste } from "@/components/FormEspaceArtiste";
import { Monogramme } from "@/components/Logo";
import { AuthFirebase } from "@/components/AuthFirebase";
import { configFirebase } from "@/lib/firebase-auth";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ profil?: string }>;
}) {
  const { profil } = await searchParams;
  if (profil === "artiste") {
    return {
      title: "Artistes togolais : créez votre page",
      description:
        "Peintre, plasticien ou sculpteur au Togo ? Créez gratuitement votre page d'artiste sur ArTova, présentez votre histoire et vendez vos œuvres aux collectionneurs.",
      alternates: { canonical: "/inscription?profil=artiste" },
    };
  }
  return {
    title: "Créer un compte",
    description:
      "Rejoignez ArTova et accédez aux univers des artistes togolais : toiles et sculptures originales à découvrir et à commander.",
    alternates: { canonical: "/inscription" },
  };
}

function Onglets({ artiste, next }: { artiste: boolean; next?: string }) {
  const onglet = (actif: boolean) =>
    `flex-1 py-3 text-center text-[11px] uppercase tracking-[0.18em] transition-colors ${actif ? "bg-encre text-craie" : "text-gris hover:text-encre"}`;
  return (
    <nav aria-label="Type de compte" className="mx-auto mt-8 flex max-w-md border border-encre/20 p-1">
      <Link
        href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}
        className={onglet(!artiste)}
        aria-current={!artiste ? "page" : undefined}
      >
        Collectionneur
      </Link>
      <Link
        href="/inscription?profil=artiste"
        className={onglet(artiste)}
        aria-current={artiste ? "page" : undefined}
      >
        Artiste
      </Link>
    </nav>
  );
}

function DejaMembre({ next }: { next?: string }) {
  return (
    <p className="mt-8 text-center text-sm text-gris">
      Déjà membre ?{" "}
      <Link
        href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}
        className="text-encre underline underline-offset-4"
      >
        Se connecter ↗
      </Link>
    </p>
  );
}

export default async function PageInscription({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; profil?: string }>;
}) {
  const utilisateur = await getCurrentUser();
  const { next, profil } = await searchParams;
  const firebase = configFirebase();

  if (profil === "artiste") {
    if (utilisateur?.role === "artiste") redirect("/espace-artiste");
    if (utilisateur?.role === "admin") redirect("/admin/artistes");
    // Avec Firebase, l'accès (Google, Apple, e-mail) se crée d'abord ; la page
    // d'artiste se remplit ensuite, une fois connecté.
    const etapeAcces = firebase && !utilisateur;
    return (
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 md:px-8 md:py-24">
        <div className="text-center">
          <Monogramme className="mx-auto h-12 w-auto" />
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-terracotta">
            Espace artiste
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            Créer ma page d&apos;artiste
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gris">
            Votre page ressemblera à celles de nos artistes : une bannière en
            grand format, votre portrait, votre histoire, votre parcours et vos
            œuvres. Elle est publiée après relecture par l&apos;équipe ArTova.
          </p>
        </div>
        {!utilisateur && <Onglets artiste next={next} />}
        <ol className="mx-auto mt-12 grid max-w-3xl gap-px border border-fil bg-fil text-center sm:grid-cols-3">
          {[
            ["1", "Créez votre accès", "Google, Apple ou e-mail"],
            ["2", "Remplissez votre page", "Environ 10 minutes"],
            ["3", "Elle est publiée", "Après relecture ArTova"],
          ].map(([numero, titre, detail], i) => (
            <li
              key={numero}
              className={`px-4 py-5 ${firebase && i === (etapeAcces ? 0 : 1) ? "bg-encre text-craie [&_p]:text-craie/80" : "bg-craie"}`}
            >
              <span className="font-display text-sm text-terracotta">{numero}</span>
              <p className="mt-1 font-display text-lg leading-tight">{titre}</p>
              <p className="mt-1 text-xs text-gris">{detail}</p>
            </li>
          ))}
        </ol>
        {etapeAcces ? (
          <div className="mx-auto mt-12 max-w-md">
            <h2 className="text-center font-display text-2xl">Étape 1 : votre accès</h2>
            <p className="mt-2 text-center text-sm text-gris">
              Il vous servira à vous connecter à votre espace artiste.
            </p>
            <div className="mt-8">
              <AuthFirebase config={firebase} mode="inscription" next="/inscription?profil=artiste" />
            </div>
          </div>
        ) : (
          <div className="mt-12">
            {utilisateur && (
              <p className="mb-2 text-center text-sm text-gris">
                Connecté en tant que <strong className="font-medium text-encre">{utilisateur.email}</strong>
                {" "}: complétez maintenant votre page d&apos;artiste.
              </p>
            )}
            <FormInscriptionArtiste avecCompte={!utilisateur} />
          </div>
        )}
        {!utilisateur && <DejaMembre next={next} />}
      </div>
    );
  }

  if (utilisateur) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20 md:py-28">
      <Monogramme className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">Rejoindre ArTova</h1>
      <p className="mt-4 text-center text-sm leading-relaxed text-gris">
        Un compte suffit pour découvrir tous les univers d&apos;artistes et
        commander les œuvres qui vous parlent.
      </p>
      <Onglets artiste={false} next={next} />
      <div className="mt-10">
        {firebase ? (
          <AuthFirebase config={firebase} mode="inscription" next={next} />
        ) : (
          <FormInscription next={next} />
        )}
      </div>
      <DejaMembre next={next} />
    </div>
  );
}

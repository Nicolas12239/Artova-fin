import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FormConnexion } from "@/components/FormAuth";
import { Monogramme } from "@/components/Logo";
import { AuthFirebase } from "@/components/AuthFirebase";
import { configFirebase } from "@/lib/firebase-auth";

export const metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à ArTova pour découvrir les œuvres des artistes togolais et commander toiles et sculptures originales.",
  alternates: { canonical: "/connexion" },
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verifie?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { next, verifie } = await searchParams;
  const firebase = configFirebase();

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20 md:py-28">
      <Monogramme className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">Connexion</h1>
      <p className="mt-4 text-center text-sm leading-relaxed text-gris">
        Connectez-vous pour voir les œuvres en clair, découvrir leurs détails
        et les commander.
      </p>
      <div className="mt-10">
        {verifie && (
          <p role="status" className="mb-6 border-l-2 border-[#3f7d4e] pl-3 text-sm">
            Adresse e-mail confirmée : vous pouvez maintenant vous connecter.
          </p>
        )}
        {firebase ? (
          <AuthFirebase config={firebase} mode="connexion" next={next} />
        ) : (
          <FormConnexion next={next} />
        )}
      </div>
      <p className="mt-8 text-center text-sm text-gris">
        Pas encore de compte ?{" "}
        <Link
          href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}
          className="text-encre underline underline-offset-4">
          Créer un compte ↗
        </Link>
      </p>
    </div>
  );
}

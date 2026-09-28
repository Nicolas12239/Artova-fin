import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FormConnexion } from "@/components/FormAuth";
import { Monogramme } from "@/components/Logo";

export const metadata = {
  title: "Connexion",
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-20 md:py-28">
      <Monogramme className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">Connexion</h1>
      <p className="mt-4 text-center text-sm leading-relaxed text-gris">
        Connectez-vous pour découvrir les univers de nos artistes et commander
        une œuvre.
      </p>
      <div className="mt-10">
        <FormConnexion next={next} />
      </div>
      <p className="mt-8 text-center text-sm text-gris">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-encre underline underline-offset-4">
          Créer un compte ↗
        </Link>
      </p>
    </div>
  );
}

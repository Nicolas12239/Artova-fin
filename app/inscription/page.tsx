import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FormInscription } from "@/components/FormAuth";
import { Monogramme } from "@/components/Logo";

export const metadata = {
  title: "Inscription",
};

export default async function PageInscription() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-20 md:py-28">
      <Monogramme className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">
        Rejoindre ArTova
      </h1>
      <p className="mt-4 text-center text-sm leading-relaxed text-gris">
        Un compte suffit pour découvrir tous les univers d'artistes et
        commander les œuvres qui vous parlent.
      </p>
      <div className="mt-10">
        <FormInscription />
      </div>
      <p className="mt-8 text-center text-sm text-gris">
        Déjà membre ?{" "}
        <Link href="/connexion" className="text-encre underline underline-offset-4">
          Se connecter ↗
        </Link>
      </p>
    </div>
  );
}

import { redirect } from "next/navigation";
import { configFirebase } from "@/lib/firebase-auth";
import { LienMagique } from "@/components/LienMagique";
import { Monogramme } from "@/components/Logo";

export const metadata = {
  title: "Connexion par e-mail",
  robots: { index: false, follow: false },
};

export default async function PageLienMagique({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const config = configFirebase();
  if (!config) redirect("/connexion");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20 md:py-28">
      <Monogramme className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">Connexion</h1>
      <div className="mt-10">
        <LienMagique config={config} next={next} />
      </div>
    </div>
  );
}

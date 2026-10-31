import { Monogramme } from "@/components/Logo";
import { BoutonReessayer } from "@/components/ApplicationMobile";

export const metadata = {
  title: "Hors ligne",
  robots: { index: false, follow: false },
};

export default function PageHorsLigne() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <Monogramme className="h-12 w-auto" />
      <h1 className="mt-6 font-display text-4xl">Vous êtes hors ligne</h1>
      <p className="mt-4 text-sm leading-relaxed text-gris">
        La connexion internet semble interrompue. Les œuvres et les artistes
        ArTova reviennent dès que le réseau est rétabli.
      </p>
      <BoutonReessayer />
    </div>
  );
}

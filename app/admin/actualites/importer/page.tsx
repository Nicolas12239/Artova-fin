import Link from "next/link";
import { FormImport } from "@/components/FormReseaux";

export const metadata = { title: "Reprendre une publication | Administration", robots: { index: false } };
// La publication lit les informations chez la plateforme : on laisse le temps.
export const maxDuration = 60;

// Page ouverte par le bouton « Partager » du téléphone (voir app/manifest.ts) :
// le lien et le texte partagés arrivent déjà remplis.
export default async function PageImporter({
  searchParams,
}: {
  searchParams: Promise<{ lien?: string; texte?: string; titre?: string }>;
}) {
  const p = await searchParams;
  const partage = [p.lien, p.texte, p.titre].filter(Boolean).join("\n").slice(0, 4000);
  // Instagram et TikTok placent souvent l'adresse dans le texte partagé.
  const liens = [...new Set(partage.match(/https:\/\/[^\s<>"']+/g) ?? [])].slice(0, 8).join("\n");
  const texte = (p.texte ?? "").replace(/https:\/\/[^\s<>"']+/g, "").trim().slice(0, 4000);
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl md:text-3xl">Reprendre une publication</h2>
      <p className="mt-2 text-sm text-gris">Vérifiez le lien, ajoutez la légende si elle manque, puis publiez.</p>
      <div className="mt-6">
        <FormImport liens={liens} texte={texte} />
      </div>
      <Link href="/admin/actualites" className="mt-8 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-terracotta">
        Retour aux actualités
      </Link>
    </div>
  );
}

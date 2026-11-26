import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { peutVoirArtiste } from "@/lib/artistes";
import { ArtworkCard } from "@/components/Cards";
import { CommanderLien } from "@/components/CommanderLien";
import { BoutonPartager } from "@/components/BoutonPartager";
import { formatFcfa } from "@/lib/format";
import { descriptionCourte, filAriane, metadonnees } from "@/lib/seo";
import { SITE_URL, urlAbsolue } from "@/lib/site";
import { LIBELLE_STATUT_OEUVRE, type OeuvreAvecArtiste, type StatutArtiste } from "@/lib/types";

const SELECT_OEUVRE = `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent,
  a.statut AS artiste_statut, a.utilisateur_id AS artiste_utilisateur_id
  FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rows = await query<OeuvreAvecArtiste & { artiste_statut: StatutArtiste }>(
    `${SELECT_OEUVRE} WHERE o.id = ? LIMIT 1`,
    [Number(id)],
  );
  const o = rows[0];
  if (!o || o.artiste_statut !== "publie") return { title: o?.titre ?? "Œuvre", robots: { index: false, follow: false } };
  const details = [o.type, o.technique, o.dimensions].filter(Boolean).join(", ");
  return metadonnees({
    titre: `${o.titre}, œuvre de ${o.artiste_nom}`,
    description: descriptionCourte(`${o.titre} par ${o.artiste_nom}${details ? ` (${details})` : ""}. ${o.description}`),
    chemin: `/oeuvres/${o.id}`,
    image: o.image_url,
  });
}

export default async function PageOeuvre({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const oeuvreId = Number(id);
  if (!Number.isInteger(oeuvreId) || oeuvreId <= 0) notFound();

  const oeuvres = await query<
    OeuvreAvecArtiste & { artiste_statut: StatutArtiste; artiste_utilisateur_id: number | null }
  >(`${SELECT_OEUVRE} WHERE o.id = ? LIMIT 1`, [oeuvreId]);
  const oeuvre = oeuvres[0];
  if (!oeuvre) notFound();
  const utilisateur = await getCurrentUser();
  const visible = peutVoirArtiste(
    { statut: oeuvre.artiste_statut, utilisateur_id: oeuvre.artiste_utilisateur_id },
    utilisateur,
  );
  if (!visible) notFound();

  const autres = await query<OeuvreAvecArtiste>(
    `${SELECT_OEUVRE} WHERE o.artiste_id = ? AND o.id != ? ORDER BY o.id LIMIT 3`,
    [oeuvre.artiste_id, oeuvre.id],
  );

  const donneesStructurees = [
    {
      "@context": "https://schema.org",
      "@type": "VisualArtwork",
      name: oeuvre.titre,
      url: `${SITE_URL}/oeuvres/${oeuvre.id}`,
      image: urlAbsolue(oeuvre.image_url),
      description: descriptionCourte(oeuvre.description, 300),
      artform: oeuvre.type,
      artMedium: oeuvre.technique ?? undefined,
      dateCreated: oeuvre.annee ? String(oeuvre.annee) : undefined,
      creator: { "@type": "Person", name: oeuvre.artiste_nom, url: `${SITE_URL}/artistes/${oeuvre.artiste_slug}` },
    },
    filAriane([
      { nom: "Accueil", chemin: "/" },
      { nom: "Artistes", chemin: "/artistes" },
      { nom: oeuvre.artiste_nom, chemin: `/artistes/${oeuvre.artiste_slug}` },
      { nom: oeuvre.titre, chemin: `/oeuvres/${oeuvre.id}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 pb-6 pt-14 text-xs uppercase tracking-[0.16em] text-gris md:pt-16"
      >
        <Link href="/" className="hover:text-encre">Accueil</Link>
        <span aria-hidden="true">/</span>
        <Link href="/artistes" className="hover:text-encre">Artistes</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/artistes/${oeuvre.artiste_slug}`} className="hover:text-encre">
          {oeuvre.artiste_nom}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-encre">{oeuvre.titre}</span>
      </nav>

      <div className="grid gap-10 pb-16 md:grid-cols-2 md:gap-14 md:pb-24">
        <div className="flex items-center justify-center bg-panel p-4 sm:p-6 md:sticky md:top-24 md:self-start md:p-10">
          <img
            src={oeuvre.image_url}
            alt={oeuvre.titre}
            className="max-h-[60svh] w-full object-contain md:max-h-[72vh]"
          />
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-[0.22em]"
            style={{ color: oeuvre.theme_accent }}
          >
            {oeuvre.type}
            {oeuvre.annee ? ` · ${oeuvre.annee}` : ""}
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">{oeuvre.titre}</h1>
          <Link
            href={`/artistes/${oeuvre.artiste_slug}`}
            className="mt-3 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
          >
            {oeuvre.artiste_nom} ↗
          </Link>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-encre/80">
            {oeuvre.description}
          </p>

          <dl className="mt-8 max-w-xl">
            <div className="grid grid-cols-2 gap-4 border-t border-fil py-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-gris">Dimensions</dt>
              <dd className="text-sm">{oeuvre.dimensions ?? "Non précisées"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-fil py-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-gris">Technique</dt>
              <dd className="text-sm">{oeuvre.technique ?? "Non précisée"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-b border-fil py-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-gris">Statut</dt>
              <dd className="text-sm">{LIBELLE_STATUT_OEUVRE[oeuvre.statut]}</dd>
            </div>
          </dl>

          {utilisateur ? (
            <p className="mt-8 font-display text-4xl md:text-5xl">
              {formatFcfa(oeuvre.prix_fcfa)}
            </p>
          ) : (
            <div className="mt-8 border border-fil bg-craie p-5">
              <p className="font-display text-2xl">Le prix est réservé aux membres.</p>
              <p className="mt-2 text-sm leading-relaxed text-gris">
                Créez votre compte ArTova pour voir le prix et commander cette
                œuvre.
              </p>
              <Link
                href={`/inscription?next=/oeuvres/${oeuvre.id}`}
                className="mt-4 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
              >
                Créer mon compte ↗
              </Link>
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <CommanderLien oeuvreId={oeuvre.id} statut={oeuvre.statut} />
            <BoutonPartager
              titre={`${oeuvre.titre}, ${oeuvre.artiste_nom}`}
              texte={`Découvrez « ${oeuvre.titre} » de ${oeuvre.artiste_nom} sur ArTova`}
            />
          </div>
          <p className="mt-5 max-w-md text-xs leading-relaxed text-gris">
            La commande est réservée aux membres connectés : elle est transmise
            par email à l'équipe ArTova avec vos coordonnées, puis l'artiste et
            vous êtes mis en relation pour la livraison et le règlement.
          </p>
        </div>
      </div>

      {autres.length > 0 && (
        <section className="border-t border-fil py-16 md:py-24">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl">
            Autres œuvres de {oeuvre.artiste_nom}
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
            {autres.map((autre) => (
              <ArtworkCard key={autre.id} oeuvre={autre} afficherPrix={!!utilisateur} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

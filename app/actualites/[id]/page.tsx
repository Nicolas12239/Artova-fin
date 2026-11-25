import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VueArticle } from "@/components/VueArticle";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL, urlAbsolue } from "@/lib/site";
import {
  aAime,
  actualiteParId,
  actualitesLiees,
  artisteLie,
  commentairesActualite,
  portraitsArtistes,
  idDepuisLien,
  lienActualite,
} from "@/lib/actualites";
import { contenuLangue, lirePersonnes } from "@/lib/actualites-commun";
import { TEXTES, avecLangue, langueDe } from "@/lib/actualites-i18n";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const langue = langueDe((await searchParams).lang);
  const numero = idDepuisLien(id);
  const a = numero ? await actualiteParId(numero) : null;
  if (!a || a.statut !== "publie") return { title: "Actualité introuvable", robots: { index: false } };
  const c = contenuLangue(a, langue);
  const base = lienActualite(a);
  return {
    title: c.titre,
    description: c.resume,
    alternates: {
      canonical: avecLangue(base, langue),
      languages: { fr: base, en: avecLangue(base, "en"), de: avecLangue(base, "de"), "x-default": base },
    },
    openGraph: {
      type: "article",
      title: c.titre,
      description: c.resume,
      locale: langue === "fr" ? "fr_FR" : langue === "en" ? "en_GB" : "de_DE",
      publishedTime: new Date(a.publie_le).toISOString(),
      section: TEXTES[langue].categories[a.categorie],
      images: a.image_url ? [{ url: a.image_url }] : undefined,
    },
    twitter: { card: a.image_url ? "summary_large_image" : "summary", title: c.titre, description: c.resume },
  };
}

export default async function PageActualite({ params, searchParams }: Props) {
  const { id } = await params;
  const langue = langueDe((await searchParams).lang);
  const numero = idDepuisLien(id);
  const a = numero ? await actualiteParId(numero) : null;
  if (!a) notFound();

  const utilisateur = await getCurrentUser();
  if (a.statut !== "publie" && utilisateur?.role !== "admin") notFound();

  const chemin = lienActualite(a);
  const [commentaires, liees, aime, artiste] = await Promise.all([
    commentairesActualite(a.id),
    actualitesLiees(a, 3),
    utilisateur ? aAime(a.id, utilisateur.id) : Promise.resolve(false),
    artisteLie(a.artiste_slug),
  ]);

  const personnesBrutes = lirePersonnes(a.personnes);
  const portraits = await portraitsArtistes(personnesBrutes.flatMap((p) => (p.slug ? [p.slug] : [])));
  const personnes = personnesBrutes.map((p) => ({
    nom: p.nom,
    slug: p.slug && portraits.has(p.slug) ? p.slug : null,
    portrait_url: p.slug ? (portraits.get(p.slug) ?? null) : null,
  }));
  const site = SITE_URL;
  const c = contenuLangue(a, langue);
  const image = a.image_url ? urlAbsolue(a.image_url) : undefined;
  // Un rendez-vous (exposition, vernissage…) est aussi décrit comme un événement :
  // c'est ce qui permet aux moteurs de recherche de l'afficher dans leurs agendas.
  const evenement = a.evenement_debut
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: c.titre,
        description: c.resume,
        startDate: a.evenement_debut,
        endDate: a.evenement_fin ?? a.evenement_debut,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: a.lieu ?? "Lomé",
          address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
        },
        image: image ? [image] : undefined,
        url: `${site}${chemin}`,
      }
    : null;
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: c.titre,
    description: c.resume,
    datePublished: new Date(a.publie_le).toISOString(),
    mainEntityOfPage: `${site}${chemin}`,
    image: image ? [image] : undefined,
    inLanguage: langue,
    mentions: personnes.map((p) => ({
      "@type": "Person",
      name: p.nom,
      url: p.slug ? `${SITE_URL}/artistes/${p.slug}` : undefined,
    })),
    publisher: { "@type": "Organization", name: "ArTova", url: site },
    ...(a.url_source ? { isBasedOn: a.url_source, sourceOrganization: { "@type": "Organization", name: a.source_nom } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      {evenement && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(evenement).replace(/</g, "\\u003c") }}
        />
      )}
      <VueArticle
        a={a}
        langue={langue}
        chemin={chemin}
        utilisateur={utilisateur ? { id: utilisateur.id, role: utilisateur.role } : null}
        commentaires={commentaires}
        liees={liees}
        aime={aime}
        artiste={artiste}
        personnes={personnes}
      />
    </>
  );
}

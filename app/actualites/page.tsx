import type { Metadata } from "next";
import { after } from "next/server";
import { actualiserSiBesoin, enqueterSiBesoin } from "@/lib/actualites-actualiser";
import { VueActualites } from "@/components/VueActualites";
import { avecLangue, langueDe } from "@/lib/actualites-i18n";
import { getCurrentUser } from "@/lib/auth";
import {
  actualiteALaUne, varierSources,
  actualitesEnVideo,
  agendaLome,
  decouvertesDuJour,
  compterActualites,
  estCategorie,
  estPortee,
  listerActualites,
} from "@/lib/actualites";

// Titre et description dans la langue demandée, avec les adresses équivalentes
// (hreflang) pour que les moteurs proposent la bonne version à chaque lecteur.
const META = {
  fr: {
    titre: "Actu art : l'actualité de l'art au Togo, en Afrique et dans le monde",
    description:
      "Expositions, artistes, marché de l'art, musées et événements : l'actualité de la peinture, de la sculpture et des arts plastiques au Togo, en Afrique et dans le monde, triée chaque jour par ArTova. Avec l'agenda de l'art à Lomé.",
  },
  en: {
    titre: "Art news: Togolese, African and global art",
    description:
      "Exhibitions, artists, the art market, museums and events: news on painting, sculpture and visual arts in Togo, Africa and the world, sorted every day by ArTova. With the Lomé art agenda.",
  },
  de: {
    titre: "Kunstnachrichten: Kunst aus Togo, Afrika und der Welt",
    description:
      "Ausstellungen, Künstler, Kunstmarkt, Museen und Veranstaltungen: Nachrichten zu Malerei, Skulptur und bildender Kunst in Togo, Afrika und der Welt, täglich von ArTova sortiert. Mit dem Kunstkalender von Lomé.",
  },
} as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const langue = langueDe((await searchParams).lang);
  const m = META[langue];
  return {
    title: m.titre,
    description: m.description,
    alternates: {
      canonical: avecLangue("/actualites", langue),
      languages: { fr: "/actualites", en: "/actualites?lang=en", de: "/actualites?lang=de", "x-default": "/actualites" },
    },
    openGraph: { title: m.titre, description: m.description, locale: langue === "fr" ? "fr_FR" : langue === "en" ? "en_GB" : "de_DE" },
  };
}

const TAILLE_PAGE = 12;

// Durée maximale de la collecte lancée en arrière-plan après la réponse.
export const maxDuration = 60;

export default async function PageActualites({
  searchParams,
}: {
  searchParams: Promise<{ portee?: string; categorie?: string; page?: string; lang?: string; q?: string }>;
}) {
  const params = await searchParams;
  const langue = langueDe(params.lang);
  // Après la réponse : la collecte (au plus toutes les 30 min) n'attend pas le lecteur.
  after(() => actualiserSiBesoin());
  after(() => enqueterSiBesoin());
  const portee = estPortee(params.portee) ? params.portee : undefined;
  const categorie = estCategorie(params.categorie) ? params.categorie : undefined;
  const page = Math.min(200, Math.max(1, parseInt(params.page ?? "1", 10) || 1));
  const q = (params.q ?? "").trim().slice(0, 80);
  const accueil = !portee && !categorie && !q && langue !== "en";
  const filtre = { portee, categorie, q: q || undefined, accueil };

  const [utilisateur, vedette, total, agenda, enBref, enVideo, decouvertes] = await Promise.all([
    getCurrentUser(),
    q ? Promise.resolve(null) : actualiteALaUne(filtre),
    compterActualites(filtre),
    page === 1 ? agendaLome(4).catch(() => []) : Promise.resolve([]),
    listerActualites(filtre, { limite: 40 }).then((l) => varierSources(l, 2, 8)),
    page === 1 ? actualitesEnVideo(3).catch(() => []) : Promise.resolve([]),
    page === 1 && !portee && !categorie && !q ? decouvertesDuJour(3).catch(() => []) : Promise.resolve([]),
  ]);
  // Accueil : la première page varie les sources ; les suivantes déroulent, sans
  // doublon, ce qu'elle n'a pas montré (au-delà des 60 plus récentes : tout, dans l'ordre).
  const recentes = accueil ? await listerActualites(filtre, { limite: 60, sauf: vedette?.id }) : [];
  const premiere = varierSources(recentes, 3, TAILLE_PAGE);
  const montrees = new Set(premiere.map((x) => x.id));
  const restantes = recentes.filter((x) => !montrees.has(x.id));
  const articles =
    accueil && page === 1
      ? premiere
      : accueil && (page - 1) * TAILLE_PAGE <= restantes.length
        ? restantes.slice((page - 2) * TAILLE_PAGE, (page - 1) * TAILLE_PAGE)
        : await listerActualites(filtre, { limite: TAILLE_PAGE, decalage: (page - 1) * TAILLE_PAGE, sauf: vedette?.id });
  const totalGrille = total - (vedette ? 1 : 0);

  return (
    <VueActualites
      langue={langue}
      q={q}
      portee={portee}
      categorie={categorie}
      page={page}
      vedette={vedette}
      articles={articles}
      enBref={enBref}
      agenda={agenda}
      enVideo={enVideo}
      decouvertes={decouvertes}
      total={total}
      suite={page * TAILLE_PAGE < totalGrille}
      admin={utilisateur?.role === "admin"}
    />
  );
}

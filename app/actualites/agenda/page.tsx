import type { Metadata } from "next";
import Link from "next/link";
import { CarteAgenda } from "@/components/ActualiteCards";
import { SelecteurLangue } from "@/components/SelecteurLangue";
import { agendaComplet, lienActualite } from "@/lib/actualites";
import { contenuLangue, dateEditoriale, etatEvenement, type Actualite } from "@/lib/actualites-commun";
import { TEXTES, avecLangue, langueDe } from "@/lib/actualites-i18n";
import { SITE_URL, urlAbsolue } from "@/lib/site";

const META = {
  fr: {
    titre: "Agenda de l'art à Lomé : expositions, vernissages et rencontres",
    description:
      "Toutes les expositions, vernissages, talks et événements d'arts visuels à Lomé et au Togo : ce qui est en cours, ce qui arrive et ce qui vient de se terminer.",
  },
  en: {
    titre: "Lomé art agenda: exhibitions, openings and meetings",
    description:
      "All visual arts exhibitions, openings, talks and events in Lomé and across Togo: what is on now, what is coming and what has just ended.",
  },
  de: {
    titre: "Kunstkalender Lomé: Ausstellungen, Vernissagen und Begegnungen",
    description:
      "Alle Ausstellungen, Vernissagen, Talks und Veranstaltungen der bildenden Kunst in Lomé und ganz Togo: was läuft, was kommt und was gerade zu Ende gegangen ist.",
  },
} as const;

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const langue = langueDe((await searchParams).lang);
  const m = META[langue];
  return {
    title: m.titre,
    description: m.description,
    alternates: {
      canonical: avecLangue("/actualites/agenda", langue),
      languages: {
        fr: "/actualites/agenda",
        en: "/actualites/agenda?lang=en",
        de: "/actualites/agenda?lang=de",
        "x-default": "/actualites/agenda",
      },
    },
  };
}

function Bloc({ titre, liste, id, langue }: { titre: string; liste: Actualite[]; id: string; langue: "fr" | "en" | "de" }) {
  if (liste.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
        {titre}
      </h2>
      <ul className="mt-6 grid gap-px bg-fil [grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))]">
        {liste.map((a) => (
          <CarteAgenda key={a.id} a={a} langue={langue} />
        ))}
      </ul>
    </section>
  );
}

export default async function PageAgenda({ searchParams }: Props) {
  const langue = langueDe((await searchParams).lang);
  const t = TEXTES[langue];
  const evenements = await agendaComplet().catch(() => []);
  const etat = (a: Actualite) => etatEvenement(a.evenement_debut as string, a.evenement_fin).ton;
  const enCours = evenements.filter((a) => etat(a) === "en_cours");
  const aVenir = evenements.filter((a) => etat(a) === "bientot");
  const termines = evenements.filter((a) => etat(a) === "termine").reverse().slice(0, 9);

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.agendaTitre,
    itemListElement: [...enCours, ...aVenir].map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: contenuLangue(a, langue).titre,
        startDate: a.evenement_debut,
        endDate: a.evenement_fin ?? a.evenement_debut,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: a.lieu ?? "Lomé",
          address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
        },
        image: a.image_url ? [urlAbsolue(a.image_url)] : undefined,
        url: `${SITE_URL}${lienActualite(a, langue)}`,
      },
    })),
  };

  return (
    <div lang={langue}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 md:px-8 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={avecLangue("/actualites", langue)}
              className="font-condense text-[14px] font-semibold uppercase tracking-[0.08em] text-gris underline-offset-4 hover:text-encre hover:underline"
            >
              {t.retour}
            </Link>
            <SelecteurLangue langue={langue} chemin="/actualites/agenda" />
          </div>
          <h1 className="mt-4 font-condense text-[3.2rem] font-bold uppercase leading-[0.92] sm:text-7xl md:text-[6.5rem]">
            {t.agendaTitre}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gris">
            {t.agendaIntro} {dateEditoriale(new Date(), langue)}.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-2 sm:px-6 md:px-8">
        {evenements.length === 0 ? (
          <p className="mt-12 border border-fil bg-craie px-6 py-14 text-center text-gris">{t.agendaVide}</p>
        ) : (
          <>
            <Bloc id="en-cours" titre={t.agendaEnCours} liste={enCours} langue={langue} />
            <Bloc id="a-venir" titre={t.agendaAVenir} liste={aVenir} langue={langue} />
            <Bloc id="termines" titre={t.agendaTermines} liste={termines} langue={langue} />
          </>
        )}

        <div className="mt-16 border border-fil bg-craie p-6 text-sm leading-relaxed text-gris md:p-8">
          <p className="font-display text-2xl text-encre">{t.agendaInviteTitre}</p>
          <p className="mt-2 max-w-xl">
            {t.agendaInviteTexte}{" "}
            <a className="text-encre underline underline-offset-4" href="mailto:artovacorp@gmail.com">
              artovacorp@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

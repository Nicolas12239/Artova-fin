import { VueActualites } from "@/components/VueActualites";
import { getCurrentUser } from "@/lib/auth";
import {
  actualiteALaUne,
  agendaLome,
  compterActualites,
  estCategorie,
  estPortee,
  listerActualites,
} from "@/lib/actualites";

export const metadata = {
  title: "L'actualité de l'art : Togo, Afrique et monde",
  description:
    "Expositions, artistes, marché de l'art, musées et événements : l'actualité de la peinture, de la sculpture et des arts plastiques au Togo, en Afrique et dans le monde, triée chaque jour par ArTova. Avec l'agenda de l'art à Lomé.",
  alternates: { canonical: "/actualites" },
};

const TAILLE_PAGE = 12;

export default async function PageActualites({
  searchParams,
}: {
  searchParams: Promise<{ portee?: string; categorie?: string; page?: string }>;
}) {
  const params = await searchParams;
  const portee = estPortee(params.portee) ? params.portee : undefined;
  const categorie = estCategorie(params.categorie) ? params.categorie : undefined;
  const page = Math.min(200, Math.max(1, parseInt(params.page ?? "1", 10) || 1));
  const filtre = { portee, categorie };

  const [utilisateur, vedette, total, agenda, enBref] = await Promise.all([
    getCurrentUser(),
    actualiteALaUne(filtre),
    compterActualites(filtre),
    page === 1 ? agendaLome(4).catch(() => []) : Promise.resolve([]),
    listerActualites(filtre, { limite: 8 }),
  ]);
  const articles = await listerActualites(filtre, {
    limite: TAILLE_PAGE,
    decalage: (page - 1) * TAILLE_PAGE,
    sauf: vedette?.id,
  });
  const totalGrille = total - (vedette ? 1 : 0);

  return (
    <VueActualites
      portee={portee}
      categorie={categorie}
      page={page}
      vedette={vedette}
      articles={articles}
      enBref={enBref}
      agenda={agenda}
      total={total}
      suite={page * TAILLE_PAGE < totalGrille}
      admin={utilisateur?.role === "admin"}
    />
  );
}

import Link from "next/link";
import { ActionsActualite } from "./ActionsActualite";
import { CarteActualite, Rubrique } from "./ActualiteCards";
import { CouvertureActualite } from "./CouvertureActualite";
import { FormCommentaire } from "./FormCommentaire";
import { GalerieActualite } from "./GalerieActualite";
import { BoutonEnquete } from "./BoutonEnquete";
import { DossierActualite, type PersonneAffichee } from "./DossierActualite";
import { TexteAvecNoms } from "./TexteAvecNoms";
import { NavActu } from "./NavActu";
import { ProgressionLecture } from "./ProgressionLecture";
import { TitreSection } from "./TitreSection";
import { VideosActualite } from "./VideosActualite";
import { retirerCommentaire } from "@/app/actions/actualites";
import { formatDateHeureFr } from "@/lib/format";
import {
  contenuLangue,
  dateLongue,
  etatEvenement,
  fr,
  ilYa,
  libelleDates,
  type Actualite,
  type CommentaireActualite,
} from "@/lib/actualites-commun";
import { TEXTES, avecLangue, fmt, nombre, type Langue } from "@/lib/actualites-i18n";

// Page d'un article : grande image pleine largeur, titre centré sur fond encre,
// puis lecture sur fond clair. Les données (base) sont fournies par la page.
export function VueArticle({
  a,
  langue = "fr",
  chemin,
  utilisateur,
  commentaires,
  liees,
  aime,
  artiste,
  personnes = [],
}: {
  a: Actualite;
  langue?: Langue;
  // Adresse de l'article sans langue (ex. « /actualites/3-titre »).
  chemin: string;
  utilisateur: { id: number; role: string } | null;
  commentaires: CommentaireActualite[];
  liees: Actualite[];
  aime: boolean;
  artiste?: { slug: string; nom: string; discipline: string; portrait_url: string | null } | null;
  personnes?: PersonneAffichee[];
}) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  const typo = (texte: string) => (langue === "fr" ? fr(texte) : texte);
  const admin = utilisateur?.role === "admin";
  // Blocs de l'article : un bloc commençant par « ## » est un intertitre.
  const blocs = (c.contenu ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b, i) => (b.startsWith("## ") ? { titre: b.slice(3).trim(), id: `partie-${i}` } : { texte: b }));
  const intertitres = blocs.flatMap((b) => ("titre" in b && b.titre ? [{ titre: b.titre, id: b.id }] : []));
  const mots = `${c.resume} ${c.contenu ?? ""}`.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(mots / 210));
  const redaction = a.source_nom === "ArTova";
  // Les portraits de la rubrique « Découvertes » ont une photo de personne : format portrait.
  const portrait = a.categorie === "decouverte" && Boolean(a.image_url);
  const credit = a.credit_image ?? a.source_nom;
  const etat = a.evenement_debut ? etatEvenement(a.evenement_debut, a.evenement_fin, undefined, langue) : null;
  const cheminLangue = avecLangue(chemin, langue);
  // Chaque personne citée est liée une seule fois dans le texte, vers sa fiche.
  const nomsLies = new Set<string>();
  const nomsCites = personnes.map((p) => p.nom);

  return (
    <div lang={langue}>
      <ProgressionLecture />
      <NavActu langue={langue} chemin={chemin} />
      {portrait ? (
        // Portrait d'artiste : la photo garde ses proportions, à côté du titre.
        <header className="border-b border-fil bg-craie">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-14 md:py-16">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl bg-panel md:max-w-none">
              <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} prioritaire />
            </div>
            <div>
              <Rubrique a={a} langue={langue} />
              <h1 className="mt-4 font-display text-[2.4rem] font-medium leading-[1.04] text-balance sm:text-5xl lg:text-6xl">{typo(c.titre)}</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-encre/75">{typo(c.resume)}</p>
              <p className="mt-6 text-sm text-gris">
                {redaction ? t.redaction : `${t.par} ${a.source_nom}`} ·{" "}
                <time dateTime={new Date(a.publie_le).toISOString()} title={formatDateHeureFr(a.publie_le)}>
                  {dateLongue(a.publie_le, langue)}
                </time>
              </p>
            </div>
          </div>
        </header>
      ) : (
        <header className="border-b border-fil bg-craie">
          <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 md:pb-10 md:pt-14">
            <Rubrique a={a} langue={langue} />
            <h1 className="mt-4 font-display text-[2.5rem] font-medium leading-[1.03] text-balance sm:text-6xl lg:text-7xl">{typo(c.titre)}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-encre/75 sm:text-xl">{typo(c.resume)}</p>
            <p className="mt-6 text-sm text-gris">
              {redaction ? t.redaction : `${t.par} ${a.source_nom}`} ·{" "}
              <time dateTime={new Date(a.publie_le).toISOString()} title={formatDateHeureFr(a.publie_le)}>
                {dateLongue(a.publie_le, langue)}
              </time>
              {" · "}
              {fmt(t.lecture, { n: minutes })}
            </p>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 md:pb-14">
            <div className="relative aspect-[4/3] max-h-[620px] w-full overflow-hidden rounded-3xl bg-panel sm:aspect-[16/9] lg:aspect-[2/1]">
              <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} prioritaire />
            </div>
            {a.image_url && <p className="mt-2 text-xs text-gris">{fmt(t.image, { source: credit })}</p>}
          </div>
        </header>
      )}

      <article className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 md:pt-14">
        <nav aria-label={t.arianeAria} className="mb-8 text-sm text-gris">
          <Link href="/" className="hover:text-encre">{t.accueil}</Link> /{" "}
          <Link href={avecLangue("/actualites", langue)} className="hover:text-encre">{t.actuArt}</Link> /{" "}
          <Link href={avecLangue(`/actualites?categorie=${a.categorie}`, langue)} className="hover:text-encre">
            {t.categories[a.categorie]}
          </Link>
        </nav>
        {admin && <BoutonEnquete id={a.id} />}
        {a.statut !== "publie" && (
          <p role="status" className="mb-8 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            {t.masquee}
          </p>
        )}

        {a.evenement_debut && etat && (
          <div className="mb-10 rounded-2xl border border-fil bg-craie p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-3xl font-medium leading-none">{libelleDates(a.evenement_debut, a.evenement_fin, langue)}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  etat.ton === "en_cours"
                    ? "bg-terracotta text-craie"
                    : etat.ton === "bientot"
                      ? "bg-encre text-craie"
                      : "border border-gris/40 text-gris"
                }`}
              >
                {etat.texte}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gris">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21Z" />
                <circle cx="12" cy="9.8" r="2.4" />
              </svg>
              {a.lieu ?? t.lieuADefaut}
            </p>
          </div>
        )}

        {intertitres.length >= 3 && (
          <nav aria-label={t.sommaire} className="mb-10 rounded-2xl border border-fil bg-craie p-5">
            <p className="text-sm font-medium text-terracotta">{t.sommaire}</p>
            <ol className="mt-3 space-y-1.5">
              {intertitres.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="inline-flex min-h-9 items-center text-[15px] underline-offset-4 hover:text-terracotta hover:underline">
                    {typo(h.titre)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {blocs.map((b, i) =>
          "titre" in b && b.titre ? (
            <TitreSection key={b.id} id={b.id} className="mt-14">
              {typo(b.titre)}
            </TitreSection>
          ) : (
            <p
              key={i}
              className={`text-[18px] leading-[1.8] text-encre/85 ${i > 0 ? "mt-6" : ""} ${i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-terracotta" : ""}`}
            >
              <TexteAvecNoms texte={typo("texte" in b ? (b.texte ?? "") : "")} noms={nomsCites} vus={nomsLies} langue={langue} />
            </p>
          ),
        )}

        <DossierActualite personnes={personnes} enquete={a.enquete} langue={langue} />

        <GalerieActualite images={a.images} titre={c.titre} credit={credit} langue={langue} />

        <VideosActualite videos={a.videos} titre={c.titre} langue={langue} />

        {artiste && (
          <Link
            href={`/artistes/${artiste.slug}`}
            className="group mt-12 flex items-center gap-5 rounded-2xl border border-fil bg-craie p-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(27,26,23,0.35)]"
          >
            {artiste.portrait_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artiste.portrait_url} alt={artiste.nom} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            )}
            <span className="min-w-0">
              <span className="block text-xs font-medium text-terracotta">{t.artisteSur}</span>
              <span className="block font-display text-2xl leading-tight transition-colors group-hover:text-terracotta">{artiste.nom}</span>
              <span className="mt-1 block text-sm text-gris">{t.decouvrirArtiste}</span>
            </span>
          </Link>
        )}

        {a.url_source && (
          <div className="mt-10 border-y border-fil py-6">
            <p className="text-sm text-gris">
              {redaction ? t.sourcePourAllerPlusLoin : fmt(t.sourceResume, { source: a.source_nom })}
            </p>
            <a
              href={a.url_source}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-encre px-6 text-sm font-medium text-creme transition-colors hover:bg-terracotta"
            >
              {redaction ? t.consulterSource : fmt(t.lireSource, { source: a.source_nom })}
            </a>
          </div>
        )}

        <div className="mt-10">
          <ActionsActualite
            id={a.id}
            titre={c.titre}
            resume={c.resume}
            chemin={cheminLangue}
            connecte={Boolean(utilisateur)}
            aimeInitial={aime}
            likesInitial={a.nb_likes}
            nbCommentaires={commentaires.length}
            langue={langue}
            textes={{
              jaime: t.jaime,
              vous_aimez: t.vous_aimez,
              partager: t.partager,
              partagerNatif: t.partagerNatif,
              copierLien: t.copierLien,
              lienCopie: t.lienCopie,
              nbCommentaires: t.nbCommentaires,
            }}
          />
        </div>

        <section id="commentaires" className="mt-16 scroll-mt-24">
          <TitreSection id="titre-commentaires">
            {commentaires.length > 0 ? nombre(t.nbCommentaires, commentaires.length) : t.commentaires}
          </TitreSection>
          {commentaires.length === 0 && <p className="mt-3 text-sm text-gris">{t.aucunCommentaire}</p>}
          <ul className="mt-6 divide-y divide-fil border-y border-fil">
            {commentaires.map((co) => (
              <li key={co.id} className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm">
                    <span className="font-medium">{co.auteur.split(" ")[0]}</span>
                    <span className="ml-3 text-xs text-gris">{ilYa(co.cree_le, langue)}</span>
                  </p>
                  {utilisateur && (admin || utilisateur.id === co.utilisateur_id) && (
                    <form action={retirerCommentaire.bind(null, co.id)}>
                      <button type="submit" className="text-xs text-gris underline underline-offset-4 hover:text-terracotta">
                        {t.retirer}
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-encre/85">{co.texte}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <FormCommentaire
              actualiteId={a.id}
              connecte={Boolean(utilisateur)}
              chemin={cheminLangue}
              langue={langue}
              textes={{
                commentaireLabel: t.commentaireLabel,
                commentairePlaceholder: t.commentairePlaceholder,
                commentairePublier: t.commentairePublier,
                commentairePublication: t.commentairePublication,
                invite: t.invite,
                seConnecter: t.seConnecter,
                creerCompte: t.creerCompte,
              }}
            />
          </div>
        </section>
      </article>

      {liees.length > 0 && (
        <section className="border-t border-fil bg-craie">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8 md:py-16">
            <TitreSection id="a-lire-aussi">{t.aLireAussi}</TitreSection>
            <div className="defile-x -mx-4 mt-8 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {liees.map((l) => (
                <div key={l.id} className="w-[82%] sm:w-auto">
                  <CarteActualite a={l} langue={langue} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

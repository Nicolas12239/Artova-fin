import Link from "next/link";
import { ActionsActualite } from "./ActionsActualite";
import { CarteActualite, Rubrique } from "./ActualiteCards";
import { CouvertureActualite } from "./CouvertureActualite";
import { FormCommentaire } from "./FormCommentaire";
import { GalerieActualite } from "./GalerieActualite";
import { SelecteurLangue } from "./SelecteurLangue";
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
}) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  const typo = (texte: string) => (langue === "fr" ? fr(texte) : texte);
  const admin = utilisateur?.role === "admin";
  const paragraphes = (c.contenu ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const redaction = a.source_nom === "ArTova";
  const credit = a.credit_image ?? a.source_nom;
  const etat = a.evenement_debut ? etatEvenement(a.evenement_debut, a.evenement_fin, undefined, langue) : null;
  const cheminLangue = avecLangue(chemin, langue);

  return (
    <div lang={langue}>
      <header className="bg-encre text-craie">
        <div className="relative aspect-[4/3] max-h-[640px] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} prioritaire />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-8 text-center sm:px-6 md:pb-20 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={avecLangue("/actualites", langue)}
              className="font-condense text-[13px] font-semibold uppercase tracking-[0.08em] text-craie/60 underline-offset-4 hover:text-craie hover:underline"
            >
              {t.retour}
            </Link>
            <SelecteurLangue langue={langue} chemin={chemin} claire />
          </div>
          <div className="mt-8">
            <Rubrique a={a} langue={langue} claire centree />
          </div>
          <h1 className="mt-5 font-display text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl">{typo(c.titre)}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-craie/75">{typo(c.resume)}</p>
          <p className="mt-7 font-condense text-[14px] font-medium uppercase tracking-[0.06em] text-craie/60">
            {redaction ? t.redaction : `${t.par} ${a.source_nom}`} ·{" "}
            <time dateTime={new Date(a.publie_le).toISOString()} title={formatDateHeureFr(a.publie_le)}>
              {dateLongue(a.publie_le, langue)}
            </time>
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 md:pt-14">
        {a.statut !== "publie" && (
          <p role="status" className="mb-8 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            {t.masquee}
          </p>
        )}

        {a.evenement_debut && etat && (
          <div className="mb-10 border-y-[3px] border-encre py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-condense text-3xl font-bold uppercase leading-none">
                {libelleDates(a.evenement_debut, a.evenement_fin, langue)}
              </p>
              <span
                className={`px-2.5 py-1 font-condense text-[13px] font-semibold uppercase tracking-[0.08em] ${
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
            <p className="mt-2 font-condense text-base font-medium uppercase tracking-[0.05em] text-gris">
              {a.lieu ?? t.lieuADefaut}
            </p>
          </div>
        )}

        {paragraphes.map((p, i) => (
          <p key={i} className={`text-[18px] leading-[1.8] text-encre/85 ${i > 0 ? "mt-6" : ""}`}>
            {typo(p)}
          </p>
        ))}
        {a.image_url && !a.images && <p className="mt-8 text-xs text-gris">{fmt(t.image, { source: credit })}</p>}

        <GalerieActualite images={a.images} titre={c.titre} credit={credit} langue={langue} />

        <VideosActualite videos={a.videos} titre={c.titre} langue={langue} />

        {artiste && (
          <Link
            href={`/artistes/${artiste.slug}`}
            className="group mt-12 flex items-center gap-5 border border-fil bg-craie p-4 transition-colors hover:border-encre"
          >
            {artiste.portrait_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artiste.portrait_url} alt={artiste.nom} className="h-20 w-20 shrink-0 object-cover" />
            )}
            <span className="min-w-0">
              <span className="block font-condense text-[13px] font-semibold uppercase tracking-[0.08em] text-terracotta">
                {t.artisteSur}
              </span>
              <span className="block font-display text-2xl leading-tight group-hover:underline">{artiste.nom}</span>
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
              className="mt-4 inline-block bg-encre px-6 py-3 text-sm tracking-wide text-creme transition-colors hover:bg-terracotta"
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
          <h2 className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
            {commentaires.length > 0 ? nombre(t.nbCommentaires, commentaires.length) : t.commentaires}
          </h2>
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
        <section className="border-t-[5px] border-encre bg-craie">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8">
            <h2 className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">{t.aLireAussi}</h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {liees.map((l) => (
                <CarteActualite key={l.id} a={l} langue={langue} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

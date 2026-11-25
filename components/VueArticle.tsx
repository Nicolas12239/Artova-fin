import Link from "next/link";
import { ActionsActualite } from "./ActionsActualite";
import { CarteActualite, Rubrique } from "./ActualiteCards";
import { CouvertureActualite } from "./CouvertureActualite";
import { FormCommentaire } from "./FormCommentaire";
import { retirerCommentaire } from "@/app/actions/actualites";
import { formatDateHeureFr } from "@/lib/format";
import {
  dateLongue,
  etatEvenement,
  fr,
  ilYa,
  libelleDates,
  type Actualite,
  type CommentaireActualite,
} from "@/lib/actualites-commun";

// Page d'un article : grande image pleine largeur, titre centré sur fond encre,
// puis lecture sur fond clair. Les liens d'article et d'adresse sont fournis
// par la page (lecture en base de données).
export function VueArticle({
  a,
  chemin,
  utilisateur,
  commentaires,
  liees,
  aime,
}: {
  a: Actualite;
  chemin: string;
  utilisateur: { id: number; role: string } | null;
  commentaires: CommentaireActualite[];
  liees: Actualite[];
  aime: boolean;
}) {
  const admin = utilisateur?.role === "admin";
  const paragraphes = (a.contenu ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const redaction = a.source_nom === "ArTova";
  const etat = a.evenement_debut ? etatEvenement(a.evenement_debut, a.evenement_fin) : null;

  return (
    <>
      <header className="bg-encre text-craie">
        <div className="relative aspect-[4/3] max-h-[640px] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <CouvertureActualite src={a.image_url} alt={a.titre} source={a.source_nom} portee={a.portee} prioritaire />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-10 text-center sm:px-6 md:pb-20 md:pt-14">
          <Link
            href="/actualites"
            className="font-condense text-[13px] font-semibold uppercase tracking-[0.08em] text-craie/60 underline-offset-4 hover:text-craie hover:underline"
          >
            ← L&apos;actualité de l&apos;art
          </Link>
          <div className="mt-6">
            <Rubrique a={a} claire centree />
          </div>
          <h1 className="mt-5 font-display text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl">{fr(a.titre)}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-craie/75">{fr(a.resume)}</p>
          <p className="mt-7 font-condense text-[14px] font-medium uppercase tracking-[0.06em] text-craie/60">
            {redaction ? "Rédaction ArTova" : `Par ${a.source_nom}`} ·{" "}
            <time dateTime={new Date(a.publie_le).toISOString()} title={formatDateHeureFr(a.publie_le)}>
              {dateLongue(a.publie_le)}
            </time>
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 md:pt-14">
        {a.statut !== "publie" && (
          <p role="status" className="mb-8 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            Cette actualité est masquée : seule l&apos;administration la voit.
          </p>
        )}

        {a.evenement_debut && etat && (
          <div className="mb-10 border-y-[3px] border-encre py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-condense text-3xl font-bold uppercase leading-none">
                {libelleDates(a.evenement_debut, a.evenement_fin)}
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
              {a.lieu ?? "Lomé"}
            </p>
          </div>
        )}

        {paragraphes.map((p, i) => (
          <p key={i} className={`text-[18px] leading-[1.8] text-encre/85 ${i > 0 ? "mt-6" : ""}`}>
            {p}
          </p>
        ))}
        {a.image_url && !redaction && <p className="mt-8 text-xs text-gris">Image : {a.source_nom}</p>}

        {a.url_source && (
          <div className="mt-10 border-y border-fil py-6">
            <p className="text-sm text-gris">
              Ce résumé est rédigé par ArTova. Les faits et les images appartiennent à {a.source_nom}.
            </p>
            <a
              href={a.url_source}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-block bg-encre px-6 py-3 text-sm tracking-wide text-creme transition-colors hover:bg-terracotta"
            >
              Lire l&apos;article complet sur {a.source_nom} ↗
            </a>
          </div>
        )}

        <div className="mt-10">
          <ActionsActualite
            id={a.id}
            titre={a.titre}
            resume={a.resume}
            chemin={chemin}
            connecte={Boolean(utilisateur)}
            aimeInitial={aime}
            likesInitial={a.nb_likes}
            nbCommentaires={commentaires.length}
          />
        </div>

        <section id="commentaires" className="mt-16 scroll-mt-24">
          <h2 className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
            {commentaires.length > 0
              ? `${commentaires.length} commentaire${commentaires.length > 1 ? "s" : ""}`
              : "Commentaires"}
          </h2>
          {commentaires.length === 0 && (
            <p className="mt-3 text-sm text-gris">Personne n&apos;a encore réagi. Lancez la conversation.</p>
          )}
          <ul className="mt-6 divide-y divide-fil border-y border-fil">
            {commentaires.map((c) => (
              <li key={c.id} className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm">
                    <span className="font-medium">{c.auteur.split(" ")[0]}</span>
                    <span className="ml-3 text-xs text-gris">{ilYa(c.cree_le)}</span>
                  </p>
                  {utilisateur && (admin || utilisateur.id === c.utilisateur_id) && (
                    <form action={retirerCommentaire.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-gris underline underline-offset-4 hover:text-terracotta">
                        Retirer
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-encre/85">{c.texte}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <FormCommentaire actualiteId={a.id} connecte={Boolean(utilisateur)} chemin={chemin} />
          </div>
        </section>
      </article>

      {liees.length > 0 && (
        <section className="border-t-[5px] border-encre bg-craie">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8">
            <h2 className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">À lire aussi</h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {liees.map((l) => (
                <CarteActualite key={l.id} a={l} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

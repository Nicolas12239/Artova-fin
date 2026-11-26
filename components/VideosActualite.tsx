import { LecteurVideo } from "./LecteurVideo";
import { TitreSection } from "./TitreSection";
import { lireVideos } from "@/lib/actualites-commun";
import { TEXTES, fmt, type Langue } from "@/lib/actualites-i18n";

const NOMS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;
const LIRE = { fr: "Lire la vidéo", en: "Play video", de: "Video abspielen" } as const;

// Vidéos intégrées (TikTok, Instagram, YouTube) : vignette, lecteur au clic, et un
// lien vers la page d'origine. Défilement horizontal aimanté sur mobile.
export function VideosActualite({ videos, titre, langue = "fr" }: { videos: string | null; titre: string; langue?: Langue }) {
  const liste = lireVideos(videos);
  if (liste.length === 0) return null;
  const t = TEXTES[langue];
  return (
    <section aria-labelledby="en-video" className="mt-16">
      <TitreSection id="en-video">{t.enVideo}</TitreSection>
      <div className="defile-x -mx-4 mt-8 items-start gap-x-6 px-4 pb-2 sm:mx-0 sm:flex-wrap sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0">
        {liste.map((v) => (
          <figure key={v.lecteur} className={v.plateforme === "youtube" ? "w-[88%] sm:w-full" : "max-w-[88%]"}>
            <LecteurVideo
              video={v}
              titre={titre}
              libelleLire={LIRE[langue]}
              titreIframe={fmt(t.videoTitre, { plateforme: NOMS[v.plateforme], titre })}
            />
            <figcaption className="mt-2 text-xs text-gris">
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center underline underline-offset-4 hover:text-terracotta">
                {v.profil ? t.voirProfil : t.voirSur} {NOMS[v.plateforme]} ↗
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

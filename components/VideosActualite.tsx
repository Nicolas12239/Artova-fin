import { lireVideos, type VideoIntegree } from "@/lib/actualites-commun";
import { TEXTES, fmt, type Langue } from "@/lib/actualites-i18n";

const NOMS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;

function tailleLecteur(v: VideoIntegree): string {
  if (v.plateforme === "tiktok") return "h-[740px] w-[325px] max-w-full";
  if (v.plateforme === "instagram" && v.profil) return "h-[780px] w-[540px] max-w-full";
  if (v.plateforme === "instagram") return "h-[640px] w-[400px] max-w-full";
  return "aspect-video w-full";
}

// Vidéos intégrées (TikTok, Instagram, YouTube) : chargées à l'approche de
// l'écran, avec un lien vers la page d'origine.
export function VideosActualite({ videos, titre, langue = "fr" }: { videos: string | null; titre: string; langue?: Langue }) {
  const liste = lireVideos(videos);
  if (liste.length === 0) return null;
  const t = TEXTES[langue];
  return (
    <section aria-labelledby="en-video" className="mt-14">
      <h2 id="en-video" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
        {t.enVideo}
      </h2>
      <div className="mt-6 flex flex-wrap items-start gap-x-8 gap-y-10">
        {liste.map((v) => (
          <figure key={v.lecteur} className={v.plateforme === "youtube" ? "w-full" : ""}>
            <div className={`overflow-hidden bg-panel ${tailleLecteur(v)}`}>
              <iframe
                src={v.lecteur}
                title={fmt(t.videoTitre, { plateforme: NOMS[v.plateforme], titre })}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-full w-full border-0"
              />
            </div>
            <figcaption className="mt-2 text-xs text-gris">
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-terracotta">
                {v.profil ? t.voirProfil : t.voirSur} {NOMS[v.plateforme]} ↗
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

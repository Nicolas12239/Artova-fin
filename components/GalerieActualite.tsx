import { TEXTES, fmt, type Langue } from "@/lib/actualites-i18n";

// Photos supplémentaires d'une actualité : grille d'images avec le crédit.
// (Une adresse par ligne dans le champ « images ».)
export function GalerieActualite({
  images,
  titre,
  credit,
  langue,
}: {
  images: string | null;
  titre: string;
  credit: string;
  langue: Langue;
}) {
  const liste = (images ?? "")
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (liste.length === 0) return null;
  const t = TEXTES[langue];
  return (
    <section aria-labelledby="galerie" className="mt-14">
      <h2 id="galerie" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
        {t.galerie}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {liste.map((src, i) => (
          <figure key={src} className={liste.length % 2 === 1 && i === 0 ? "col-span-2" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${titre} (${i + 1}/${liste.length})`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="aspect-[4/3] w-full bg-panel object-cover"
            />
          </figure>
        ))}
      </div>
      <p className="mt-2 text-xs text-gris">{fmt(t.image, { source: credit })}</p>
    </section>
  );
}

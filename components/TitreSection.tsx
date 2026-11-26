import type { ReactNode } from "react";

// Titre de section de la rubrique « Actu art » : un repère terre cuite, puis un
// titre en Cormorant. Remplace les anciens filets épais et capitales condensées.
export function TitreSection({
  id,
  children,
  sous,
  niveau = 2,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  sous?: ReactNode;
  niveau?: 1 | 2 | 3;
  className?: string;
}) {
  const Balise = `h${niveau}` as "h1" | "h2" | "h3";
  return (
    <div className={className}>
      <span aria-hidden="true" className="mb-3 block h-[3px] w-10 rounded-full bg-terracotta" />
      <Balise id={id} className="scroll-mt-28 font-display text-[2rem] font-medium leading-[1.05] tracking-[-0.005em] text-balance sm:text-[2.5rem]">
        {children}
      </Balise>
      {sous && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gris">{sous}</p>}
    </div>
  );
}

// Squelette affiché pendant le chargement de la rubrique : la page ne reste jamais blanche.
export default function Chargement() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="h-[58px] border-b border-fil bg-craie" />
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 md:px-8">
        <div className="squelette h-16 w-3/4 max-w-xl rounded-xl sm:h-24" />
        <div className="squelette mt-6 h-5 w-full max-w-2xl rounded-full" />
        <div className="squelette mt-10 aspect-[4/5] w-full rounded-3xl sm:aspect-[16/8]" />
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="squelette aspect-[4/3] rounded-2xl" />
              <div className="squelette mt-4 h-4 w-1/3 rounded-full" />
              <div className="squelette mt-3 h-7 w-full rounded-lg" />
              <div className="squelette mt-2 h-7 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

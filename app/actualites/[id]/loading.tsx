// Squelette d'un article pendant son chargement.
export default function ChargementArticle() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="h-[58px] border-b border-fil bg-craie" />
      <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
        <div className="squelette h-4 w-40 rounded-full" />
        <div className="squelette mt-5 h-14 w-full rounded-xl sm:h-20" />
        <div className="squelette mt-3 h-14 w-2/3 rounded-xl sm:h-20" />
        <div className="squelette mt-6 h-5 w-full max-w-2xl rounded-full" />
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="squelette aspect-[4/3] w-full rounded-3xl sm:aspect-[2/1]" />
      </div>
      <div className="mx-auto mt-12 max-w-2xl space-y-3 px-4 sm:px-6">
        {[100, 96, 100, 90, 98, 70].map((l, i) => (
          <div key={i} className="squelette h-5 rounded-full" style={{ width: `${l}%` }} />
        ))}
      </div>
    </div>
  );
}

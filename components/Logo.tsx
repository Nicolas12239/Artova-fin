export function Monogramme({ className }: { className?: string }) {
  return (
    <img
      src="/logo/ArTova_monogramme_AT_bicolore.svg"
      alt="ArTova"
      className={className}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/logo/ArTova_wordmark_seul.svg"
      alt="ArTova"
      className={className}
    />
  );
}

export function LogoComplet({ className }: { className?: string }) {
  return (
    <img
      src="/logo/ArTova_logo_complet_fondclair.svg"
      alt="ArTova — plateforme d'art togolais"
      className={className}
    />
  );
}

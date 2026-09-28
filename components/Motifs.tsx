export function MotifPinceau({
  className,
  couleur = "#1c1c1c",
}: {
  className?: string;
  couleur?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M20 160C60 120 80 60 150 30"
        stroke={couleur}
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M40 180C90 150 120 100 180 80"
        stroke={couleur}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M10 90C40 70 60 40 90 20"
        stroke={couleur}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function MotifCollage({
  className,
  couleur = "#c05a2e",
}: {
  className?: string;
  couleur?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      <rect x="20" y="20" width="70" height="90" fill={couleur} opacity="0.85" />
      <rect x="100" y="60" width="80" height="60" fill={couleur} opacity="0.55" />
      <circle cx="60" cy="150" r="30" fill={couleur} opacity="0.35" />
      <rect x="140" y="140" width="40" height="40" fill={couleur} opacity="0.7" />
    </svg>
  );
}

export function MotifPierre({
  className,
  couleur = "#8a7a6a",
}: {
  className?: string;
  couleur?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="100" cy="120" rx="70" ry="45" fill={couleur} opacity="0.8" />
      <ellipse cx="80" cy="70" rx="45" ry="30" fill={couleur} opacity="0.5" />
      <ellipse cx="140" cy="50" rx="30" ry="20" fill={couleur} opacity="0.35" />
      <path
        d="M30 160C70 140 130 140 170 160"
        stroke={couleur}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

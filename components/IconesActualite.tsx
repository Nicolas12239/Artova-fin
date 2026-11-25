export function IconeCoeur({ plein = false, className = "h-4 w-4" }: { plein?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9-9.6C2 7.4 4.2 4.8 7 4.8c1.9 0 3.5 1 5 3 1.5-2 3.1-3 5-3 2.8 0 5 2.6 4 6.1-1.5 5-9 9.6-9 9.6Z" />
    </svg>
  );
}

export function IconeBulle({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 5.5h16v10.5H9.5L5 19.5V16H4V5.5Z" />
    </svg>
  );
}

export function IconeLecture({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" />
    </svg>
  );
}

const formatXof = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export function formatFcfa(montant: number): string {
  return formatXof.format(montant);
}

const fmtDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
});

const fmtDateHeure = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

export function formatDate(date: Date | string): string {
  return fmtDate.format(new Date(date));
}

export function formatDateHeureFr(date: Date | string): string {
  return fmtDateHeure.format(new Date(date));
}

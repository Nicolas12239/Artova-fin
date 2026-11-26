import { ViewTransition } from "react";

// Fondu court entre deux pages (l'en-tête reste immobile, voir globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition default="page">{children}</ViewTransition>;
}

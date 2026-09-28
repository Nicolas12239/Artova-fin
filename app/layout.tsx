import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ArTova — L'art togolais qui fait vivre",
    template: "%s — ArTova",
  },
  description:
    "ArTova est le mouvement qui fait vivre l'art togolais : découvrez les artistes peintres, plasticiens et sculpteurs du Togo, leurs histoires et leurs œuvres (toiles et sculptures).",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const utilisateur = await getCurrentUser();

  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-creme text-encre">
        <Header utilisateur={utilisateur} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { BandeauInstallation, EnregistrerServiceWorker } from "@/components/ApplicationMobile";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

// Caractères condensés des rubriques de l'actualité (façon presse quotidienne).
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DESCRIPTION =
  "ArTova, la plateforme de l'art togolais : découvrez les peintres, plasticiens et sculpteurs du Togo, leurs histoires et leurs œuvres originales, des toiles et des sculptures à commander depuis Lomé.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArTova | Art togolais : peintres, plasticiens et sculpteurs du Togo",
    template: "%s | ArTova",
  },
  description: DESCRIPTION,
  applicationName: "ArTova",
  keywords: [
    "ArTova",
    "art togolais",
    "artistes togolais",
    "peintre togolais",
    "sculpteur togolais",
    "plasticien togolais",
    "art africain",
    "art contemporain Togo",
    "acheter tableau Togo",
    "galerie d'art Lomé",
    "œuvres d'art Lomé",
    "peinture togolaise",
    "sculpture togolaise",
    "exposition Lomé",
    "agenda expositions Lomé",
    "actualité art Togo",
    "artiste plasticien Togo",
    "art contemporain Lomé",
  ],
  authors: [{ name: "ArTova" }],
  creator: "ArTova",
  publisher: "ArTova",
  category: "art",
  appleWebApp: { capable: true, title: "ArTova", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "ArTova",
    title: "ArTova | L'art togolais, maintenant",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "ArTova | L'art togolais, maintenant",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#f6f4ed",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const utilisateur = await getCurrentUser();

  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable} ${barlow.variable}`}>
      <body className="bg-creme text-encre">
        <Header utilisateur={utilisateur} />
        <main>{children}</main>
        <Footer />
        <EnregistrerServiceWorker />
        <BandeauInstallation />
      </body>
    </html>
  );
}

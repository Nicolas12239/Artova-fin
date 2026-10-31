import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ArTova, l'art togolais",
    short_name: "ArTova",
    description:
      "Peintres, plasticiens et sculpteurs du Togo : découvrez leurs histoires et commandez leurs œuvres.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f4ed",
    theme_color: "#f6f4ed",
    lang: "fr",
    dir: "ltr",
    categories: ["shopping", "lifestyle", "art"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Nos artistes",
        url: "/artistes?source=app",
        icons: [{ src: "/icons/raccourci-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Mon compte",
        url: "/compte?source=app",
        icons: [{ src: "/icons/raccourci-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}

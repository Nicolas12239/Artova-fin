import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Firebase Auth : API d'identité Google, fenêtres Google / Apple et iframe
// du domaine d'authentification Firebase (*.firebaseapp.com).
const emulateurFirebase = process.env.FIREBASE_AUTH_EMULATOR_HOST
  ? ` http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
  : "";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com${emulateurFirebase}`,
  `frame-src https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://appleid.apple.com${emulateurFirebase}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Le service worker doit toujours être relu pour que les mises à jour
        // du site arrivent dans l'application installée.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/:path*",
        headers:
          process.env.NODE_ENV === "production"
            ? [
                ...securityHeaders,
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains",
                },
                {
                  key: "Content-Security-Policy",
                  value: CSP,
                },
              ]
            : securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
    // L'espace artiste passe par le proxy : ses envois (bannière + portrait)
    // ne doivent pas être tronqués à la limite par défaut de 10 Mo.
    proxyClientMaxBodySize: "200mb",
  },
};

export default nextConfig;

// Digital Asset Links : prouve à Android que l'application ArTova (Trusted
// Web Activity) et ce site appartiennent au même propriétaire, ce qui permet
// l'affichage plein écran sans barre d'adresse.
// ANDROID_SHA256_FINGERPRINTS : empreintes SHA-256 des certificats de
// signature (clé locale et clé « Play App Signing »), séparées par des virgules.
export const dynamic = "force-dynamic";

export function GET() {
  const paquet = process.env.ANDROID_PACKAGE_NAME || "com.artova.app";
  const empreintes = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((e) => e.trim().toUpperCase())
    .filter(Boolean);

  return Response.json(
    empreintes.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: paquet,
              sha256_cert_fingerprints: empreintes,
            },
          },
        ],
  );
}

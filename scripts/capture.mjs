import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3000";
const OUT = ".captures";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(page, name, fullPage = true) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("capture:", name);
}

async function nouvellePage(contexte, mobile = false) {
  const page = await contexte.newPage();
  await page.setViewport(
    mobile
      ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
      : { width: 1440, height: 900 },
  );
  return page;
}

async function connexion(page, email, motDePasse) {
  await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#mot_de_passe", motDePasse);
  await page.click('main button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.pathname.startsWith("/connexion"),
    { timeout: 20000 },
  );
}

// --- Visiteur anonyme ---
const ctxAnon = await browser.createBrowserContext();
const anon = await nouvellePage(ctxAnon);
await anon.goto(`${BASE}/`, { waitUntil: "networkidle0" });
await shot(anon, "01-accueil-invite-desktop");
await anon.goto(`${BASE}/connexion`, { waitUntil: "networkidle0" });
await shot(anon, "02-connexion-desktop");
await anon.goto(`${BASE}/artistes`, { waitUntil: "networkidle0" });
console.log("anon /artistes redirigé vers :", anon.url());

// --- Parcours client connecté ---
const ctxClient = await browser.createBrowserContext();
const client = await nouvellePage(ctxClient);
await connexion(client, "client@artova.tg", "Client@2026!");
console.log("après connexion client :", client.url());
await client.goto(`${BASE}/`, { waitUntil: "networkidle0" });
await shot(client, "03-accueil-connecte-desktop");
await client.goto(`${BASE}/artistes`, { waitUntil: "networkidle0" });
await shot(client, "04-artistes-desktop");
await client.goto(`${BASE}/artistes/adjovi-klousseh`, { waitUntil: "networkidle0" });
await shot(client, "05-univers-plasticienne-desktop");
await client.goto(`${BASE}/artistes/yao-kpodzro`, { waitUntil: "networkidle0" });
await shot(client, "06-univers-sculpteur-desktop");
await client.goto(`${BASE}/oeuvres/2`, { waitUntil: "networkidle0" });
await shot(client, "07-oeuvre-desktop", false);
await client.goto(`${BASE}/commande/2`, { waitUntil: "networkidle0" });
await shot(client, "08-commande-form-desktop", false);
await client.type("#ville", "Lomé");
await client.click('main button[type="submit"]');
await client.waitForFunction(
  () => window.location.pathname.startsWith("/commande/confirmation/"),
  { timeout: 20000 },
);
console.log("après commande :", client.url());
await shot(client, "09-confirmation-desktop");
await client.goto(`${BASE}/compte`, { waitUntil: "networkidle0" });
await shot(client, "10-compte-desktop");

// --- Parcours admin ---
const ctxAdmin = await browser.createBrowserContext();
const admin = await nouvellePage(ctxAdmin);
await connexion(admin, "admin@artova.tg", "Admin@2026!");
await admin.goto(`${BASE}/admin`, { waitUntil: "networkidle0" });
await shot(admin, "11-admin-dashboard");
await admin.goto(`${BASE}/admin/commandes`, { waitUntil: "networkidle0" });
await shot(admin, "12-admin-commandes");

// --- Mobile ---
const ctxMobile = await browser.createBrowserContext();
const mob = await nouvellePage(ctxMobile, true);
await mob.goto(`${BASE}/`, { waitUntil: "networkidle0" });
await shot(mob, "13-accueil-mobile");
await mob.click('header button[aria-label="Ouvrir le menu"]');
await new Promise((r) => setTimeout(r, 400));
await shot(mob, "14-accueil-mobile-menu", false);
await connexion(mob, "client@artova.tg", "Client@2026!");
await mob.goto(`${BASE}/artistes/kossi-agbeko`, { waitUntil: "networkidle0" });
await shot(mob, "15-univers-peintre-mobile");
await mob.goto(`${BASE}/oeuvres/8`, { waitUntil: "networkidle0" });
await shot(mob, "16-oeuvre-mobile");

await browser.close();
console.log("Terminé.");

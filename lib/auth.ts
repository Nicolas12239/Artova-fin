import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { query } from "./db";
import type { Utilisateur, UtilisateurSession } from "./types";

export const COOKIE_SESSION = "artova_session";
const SESSION_DUREE_SECONDES = 60 * 60 * 24 * 7;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET manquant dans .env.local");
  return new TextEncoder().encode(s);
}

export function hashPassword(motDePasse: string): string {
  return bcrypt.hashSync(motDePasse, 12);
}

export function verifyPassword(motDePasse: string, hash: string): boolean {
  return bcrypt.compareSync(motDePasse, hash);
}

export async function signSession(utilisateur: {
  id: number;
  role: string;
}): Promise<string> {
  return new SignJWT({ role: utilisateur.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(utilisateur.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DUREE_SECONDES}s`)
    .sign(secret());
}

export async function openSession(utilisateur: {
  id: number;
  role: string;
}): Promise<void> {
  const token = await signSession(utilisateur);
  const store = await cookies();
  store.set(COOKIE_SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    // En production locale le site est servi en http (localhost ou IP LAN) :
    // un cookie Secure y serait ignoré par le navigateur et la session perdue.
    secure: (process.env.SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: SESSION_DUREE_SECONDES,
  });
}

export async function closeSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_SESSION);
}

export async function getSessionPayload(): Promise<{
  sub: string;
  role: string;
} | null> {
  const store = await cookies();
  const token = store.get(COOKIE_SESSION)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { sub: payload.sub, role: String(payload.role ?? "") };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UtilisateurSession | null> {
  const session = await getSessionPayload();
  if (!session) return null;
  const rows = await query<Utilisateur>(
    "SELECT id, nom, email, mot_de_passe_hash, telephone, role, cree_le FROM utilisateurs WHERE id = ? LIMIT 1",
    [session.sub],
  );
  if (rows.length === 0) return null;
  const { mot_de_passe_hash: _hash, ...utilisateur } = rows[0];
  return utilisateur;
}

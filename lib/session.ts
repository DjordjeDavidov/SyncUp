import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "syncup_session";
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "syncup-dev-secret";
}

function encode(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function decode(token: string): SessionPayload | null {
  const [value, signature] = token.split(".");

  if (!value || !signature) {
    return null;
  }

  const expected = sign(value);

  if (signature.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as SessionPayload;

  if (parsed.exp < Date.now()) {
    return null;
  }

  return parsed;
}

export async function createSession(userId: string) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + WEEK_IN_SECONDS * 1000,
  };
  const value = encode(payload);
  const token = `${value}.${sign(value)}`;
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return decode(token)?.userId ?? null;
}

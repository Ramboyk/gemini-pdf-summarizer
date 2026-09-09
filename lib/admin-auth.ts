import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 12 * 60 * 60; // 12 saat

interface SessionPayload {
  u: string;
  exp: number;
  nonce: string;
}

/**
 * Zamanlama saldırılarını (timing attacks) önlemek için sabit zamanlı dize karşılaştırması
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Farklı uzunlukta olsa bile zaman sızıntısını önlemek için sahte karşılaştırma yap
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * HMAC imzası oluşturma
 */
function signPayload(payloadB64: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

/**
 * Admin kullanıcı adı ve şifresini doğrular
 */
export function verifyAdminCredentials(
  username?: string,
  password?: string
): boolean {
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envUsername || !envPassword || !username || !password) {
    return false;
  }

  const isUserMatch = safeCompare(username, envUsername);
  const isPassMatch = safeCompare(password, envPassword);

  return isUserMatch && isPassMatch;
}

/**
 * İmzalı admin session token'ı üretir
 */
export function createAdminSessionToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET ortam değişkeni tanımlanmamış.");
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const payload: SessionPayload = {
    u: username,
    exp: Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadB64, secret);

  return `${payloadB64}.${signature}`;
}

/**
 * Token imzasını ve süresini doğrular
 */
export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, providedSig] = parts;
  const expectedSig = signPayload(payloadB64, secret);

  if (!safeCompare(providedSig, expectedSig)) {
    return false;
  }

  try {
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(rawJson);

    // Süre kontrolü
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return false;
    }

    // Kullanıcı adı kontrolü
    const envUsername = process.env.ADMIN_USERNAME || "admin";
    if (payload.u !== envUsername) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Request içerisinden veya next/headers cookies üzerinden admin oturumunu doğrular
 */
export async function isAdminSession(request?: Request): Promise<boolean> {
  // 1. Request nesnesinin Cookie header'ından oku
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
      if (match) {
        const token = match.substring(ADMIN_COOKIE_NAME.length + 1);
        if (verifyAdminSessionToken(token)) {
          return true;
        }
      }
    }
  }

  // 2. Next.js App Router cookies() ile kontrol et
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (cookie?.value && verifyAdminSessionToken(cookie.value)) {
      return true;
    }
  } catch {
    // Next.js context dışında (örn. harici test ortamı) sessizce yoksay
  }

  return false;
}

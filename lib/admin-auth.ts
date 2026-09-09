import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 12 * 60 * 60; // 12 saat

interface SessionPayload {
  u: string;
  exp: number;
  nonce: string;
}

/**
 * Ortam değişkeni veya kullanıcı girişindeki gereksiz boşlukları,
 * tırnak işaretlerini ("...") ve satır sonu (\r) karakterlerini temizler.
 */
export function cleanValue(val?: string | null): string {
  if (!val) return "";
  let str = String(val).trim();
  // Varsa başındaki ve sonundaki çift/tek tırnakları temizle
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str.replace(/\r/g, "");
}

/**
 * Zamanlama saldırılarını (timing attacks) önlemek için sabit zamanlı güvenli karşılaştırma.
 * Her iki dize SHA-256 ile özetlendiğinden (digest) arabellekler daima eşit uzunluktadır (32 bayt).
 * Böylece farklı uzunluktaki dizelerde uzunluk sızıntısı veya hata oluşmaz.
 */
export function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
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
  const rawEnvUser = process.env.ADMIN_USERNAME;
  const rawEnvPass = process.env.ADMIN_PASSWORD;

  const envUser = cleanValue(rawEnvUser);
  const envPass = cleanValue(rawEnvPass);

  const inputUser = cleanValue(username);
  const inputPass = cleanValue(password);

  // Güvenli debug logları (Değerler ASLA loglanmaz, yalnızca durum ve uzunluk eşleşmesi kontrol edilir)
  console.log("[Admin Auth Debug]", {
    adminUsernameConfigured: Boolean(envUser),
    adminPasswordConfigured: Boolean(envPass),
    usernameLengthMatch: inputUser.length === envUser.length,
    passwordLengthMatch: inputPass.length === envPass.length,
  });

  if (!envUser || !envPass || !inputUser || !inputPass) {
    return false;
  }

  // Kullanıcı adı karşılaştırması (büyük/küçük harf toleranslı ve güvenli)
  const isUserMatch = safeCompare(inputUser.toLowerCase(), envUser.toLowerCase());
  // Şifre karşılaştırması (birebir eşleşme ve güvenli)
  const isPassMatch = safeCompare(inputPass, envPass);

  return isUserMatch && isPassMatch;
}

/**
 * İmzalı admin session token'ı üretir
 */
export function createAdminSessionToken(): string {
  const secret =
    cleanValue(process.env.ADMIN_SESSION_SECRET) ||
    cleanValue(process.env.ADMIN_PASSWORD);

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET veya ADMIN_PASSWORD tanımlanmamış.");
  }

  const username = cleanValue(process.env.ADMIN_USERNAME) || "admin";
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

  const secret =
    cleanValue(process.env.ADMIN_SESSION_SECRET) ||
    cleanValue(process.env.ADMIN_PASSWORD);

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
    const envUsername = cleanValue(process.env.ADMIN_USERNAME) || "admin";
    if (payload.u.toLowerCase() !== envUsername.toLowerCase()) {
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
    // Next.js context dışında sessizce yoksay
  }

  return false;
}

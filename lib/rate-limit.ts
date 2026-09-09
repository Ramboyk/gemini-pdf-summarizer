import crypto from "crypto";
import { Redis } from "@upstash/redis";

export interface RateLimitCheckResult {
  allowed: boolean;
  code?: "IP_DAILY_LIMIT_REACHED" | "GLOBAL_DAILY_LIMIT_REACHED";
  error?: string;
  redisUnavailable?: boolean;
  ipKey?: string;
  globalKey?: string;
  ttl?: number;
  ipLimit?: number;
  remaining?: number;
}

export interface UsageRecordResult {
  dailyLimit: number;
  remaining: number;
}

/**
 * Konfigüre edilmiş limitleri döner
 */
export function getRateLimits(): { ipLimit: number; globalLimit: number } {
  const ipLimit = parseInt(process.env.IP_DAILY_LIMIT || "3", 10);
  const globalLimit = parseInt(process.env.GLOBAL_DAILY_LIMIT || "20", 10);

  return {
    ipLimit: Number.isNaN(ipLimit) || ipLimit <= 0 ? 3 : ipLimit,
    globalLimit: Number.isNaN(globalLimit) || globalLimit <= 0 ? 20 : globalLimit,
  };
}

/**
 * Upstash Redis istemcisini döner.
 * Konfigürasyon eksikse null döner.
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

/**
 * İstekten istemci IP adresini güvenli şekilde ayıklar
 */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * IP adresini SHA-256 ile hashler
 */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * Geçerli UTC tarihini YYYY-MM-DD olarak döner
 */
export function getUtcDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Bir sonraki UTC gününe kadar kalan saniye + 1 saat güvenlik payı (TTL)
 */
export function getSecondsUntilNextUtcDay(): number {
  const now = new Date();
  const nextDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );

  const diffSeconds = Math.floor((nextDay.getTime() - now.getTime()) / 1000);
  return Math.max(3600, diffSeconds + 3600); // En az 1 saat ve gün bitimi + 1 saat
}

/**
 * Özetleme işlemi öncesinde limitleri kontrol eder (Kota henüz tüketilmez).
 */
export async function checkRateLimit(
  request: Request
): Promise<RateLimitCheckResult> {
  const { ipLimit, globalLimit } = getRateLimits();
  const redis = getRedisClient();

  // Redis konfigürasyonu yoksa veya erişilemiyorsa fail-closed
  if (!redis) {
    return {
      allowed: false,
      redisUnavailable: true,
      error:
        "Kullanım kontrol servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
    };
  }

  const rawIp = extractClientIp(request);
  const hashedIp = hashIp(rawIp);
  const dateStr = getUtcDateString();

  const ipKey = `rate:ip:${dateStr}:${hashedIp}`;
  const globalKey = `rate:global:${dateStr}`;
  const ttl = getSecondsUntilNextUtcDay();

  try {
    // Mevcut kullanım sayılarını oku
    const [rawIpCount, rawGlobalCount] = await redis.mget<[number | null, number | null]>(
      ipKey,
      globalKey
    );

    const currentIpCount = Number(rawIpCount) || 0;
    const currentGlobalCount = Number(rawGlobalCount) || 0;

    // 1. IP Günlük Limiti Kontrolü
    if (currentIpCount >= ipLimit) {
      return {
        allowed: false,
        code: "IP_DAILY_LIMIT_REACHED",
        error: `Bugünkü ${ipLimit} ücretsiz özetleme hakkınızı kullandınız. Yarın tekrar deneyebilirsiniz.`,
      };
    }

    // 2. Global Günlük Limit Kontrolü
    if (currentGlobalCount >= globalLimit) {
      return {
        allowed: false,
        code: "GLOBAL_DAILY_LIMIT_REACHED",
        error: "Bugünkü demo kullanım limiti doldu. Yarın tekrar deneyebilirsiniz.",
      };
    }

    return {
      allowed: true,
      ipKey,
      globalKey,
      ttl,
      ipLimit,
      remaining: Math.max(0, ipLimit - currentIpCount),
    };
  } catch (error) {
    // Redis bağlantı veya sorgu hatasında fail-closed davran
    return {
      allowed: false,
      redisUnavailable: true,
      error:
        "Kullanım kontrol servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
    };
  }
}

/**
 * Yalnızca başarılı Gemini API çağrısı sonrasında çalışır ve sayaçları artırır.
 * Başarısız Gemini isteklerinde bu fonksiyon çağrılmaz; dolayısıyla kota korunur.
 */
export async function recordSuccessfulUsage(
  ipKey: string,
  globalKey: string,
  ttl: number,
  ipLimit: number
): Promise<UsageRecordResult> {
  const redis = getRedisClient();

  if (!redis) {
    return {
      dailyLimit: ipLimit,
      remaining: 0,
    };
  }

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(ipKey);
    pipeline.expire(ipKey, ttl);
    pipeline.incr(globalKey);
    pipeline.expire(globalKey, ttl);

    const results = await pipeline.exec();
    const newIpCount = Number(results[0]) || 1;

    return {
      dailyLimit: ipLimit,
      remaining: Math.max(0, ipLimit - newIpCount),
    };
  } catch {
    // Artırma sırasında hata oluşsa bile kullanıcıya işlemi başarıyla döneceğiz
    return {
      dailyLimit: ipLimit,
      remaining: Math.max(0, ipLimit - 1),
    };
  }
}

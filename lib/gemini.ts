import { GoogleGenAI } from "@google/genai";
import { GeminiSummaryData, SummaryLength } from "@/types";
import { shouldChunk, splitIntoChunks } from "./chunking";

const DEFAULT_MODEL = "gemini-3.6-flash";

/**
 * Sunucu tarafında Gemini API istemcisini başlatır.
 * API anahtarını güvenli şekilde process.env.GEMINI_API_KEY üzerinden okur.
 */
export function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY ortam değişkeni ayarlanmamış veya geçersiz. Lütfen .env.local dosyasına geçerli bir Google Gemini API anahtarı ekleyin."
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const client = new GoogleGenAI({ apiKey: apiKey.trim() });

  return { client, model };
}

/**
 * Yapılandırılmış JSON çıktısı için şema tanımı
 */
const summaryResponseSchema = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description: "Belgenin özeti. İstenen derinliğe uygun ve belgenin dilinde yazılmış.",
    },
    keyPoints: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Belgedeki kilit noktalar ve önemli bulgular.",
    },
    keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Belge ile ilgili en önemli anahtar kelimeler.",
    },
    actionItems: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Belgede geçen somut eylem adımları, görevler veya tavsiyeler. Yoksa boş liste dön.",
    },
  },
  required: ["summary", "keyPoints", "keywords", "actionItems"],
};

/**
 * Seçilen özet derinliğine göre sistem talimatı üretir.
 */
function getSystemInstruction(level: SummaryLength): string {
  let lengthRule = "";
  if (level === "short") {
    lengthRule =
      "- Özet Derinliği: KISA (Short). 2-3 vurucu ve özlü cümle ile belgenin temel ana fikrini yansıt.";
  } else if (level === "medium") {
    lengthRule =
      "- Özet Derinliği: ORTA (Medium). Dengeli 2-3 paragrafta önemli bulguları ve sonuçları açıkla.";
  } else {
    lengthRule =
      "- Özet Derinliği: DETAYLI (Detailed). Bölüm bölüm derinlemesine analiz, tüm önemli detaylar ve çıkarımları kapsayan zengin bir özet hazırla.";
  }

  return `Sen profesyonel, titiz ve analitik bir belge özetleme uzmanısın.
Görevlerin ve kesin kuralların:
1. Kesinlikle dokümanda yer almayan hiçbir bilgi ekleme (No hallucination). Yalnızca verilen metne sadık kal.
2. Belgenin dilini otomatik olarak tespit et ve özeti, anahtar kelimeleri, kilit noktaları tamamen aynı dilde oluştur.
3. ${lengthRule}
4. Kilit Noktalar (keyPoints): Belgenin en kritik 3-7 ana fikrini madde madde çıkar.
5. Anahtar Kelimeler (keywords): Belgeyi en iyi tanımlayan 4-8 anahtar kelime veya kavram belirle.
6. Eylem Adımları (actionItems): Belgede açıkça belirtilen yapılacak işler, kararlar veya öneriler varsa listele. Eğer belgede herhangi bir eylem adımı veya görev yoksa mutlaka boş dizi [] dön.
7. Çıktıyı kesinlikle belirtilen JSON şemasına uygun biçimde üret.`;
}

/**
 * Hata mesajlarından API anahtarlarını ve hassas parametreleri temizler.
 */
function sanitizeErrorMessage(msg: string): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  let sanitized = msg;
  if (apiKey && apiKey.length > 5) {
    sanitized = sanitized.replaceAll(apiKey, "[REDACTED_API_KEY]");
  }
  sanitized = sanitized.replace(/(key|apiKey|api_key)=([a-zA-Z0-9_\-.]+)/gi, "$1=[REDACTED]");
  return sanitized;
}

/**
 * Ham JSON metnini güvenli bir şekilde ayrıştırır.
 */
function parseGeminiJsonResponse(rawText: string): GeminiSummaryData {
  try {
    const cleanJson = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
    };
  } catch {
    throw new Error("Gemini yanıtı geçerli bir JSON formatında çözümlenemedi.");
  }
}

/**
 * Kalıcı hataları tespit eder (400, 401, 403, 404 vb.).
 * Bu hatalarda kesinlikle retry yapılmaz.
 */
export function isPermanentError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  const status =
    (error as any)?.status ||
    (error as any)?.code ||
    (error as any)?.statusCode ||
    (error as any)?.response?.status;

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return true;
  }

  if (
    msg.includes("400") ||
    msg.includes("INVALID_ARGUMENT") ||
    msg.includes("401") ||
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API KEY NOT VALID") ||
    msg.includes("403") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("404") ||
    msg.includes("NOT_FOUND") ||
    msg.includes("GEMINI_API_KEY")
  ) {
    return true;
  }

  return false;
}

/**
 * Geçici hataları tespit eder (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED veya network hataları).
 */
export function isTransientError(error: unknown): boolean {
  if (isPermanentError(error)) {
    return false;
  }

  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  const status =
    (error as any)?.status ||
    (error as any)?.code ||
    (error as any)?.statusCode ||
    (error as any)?.response?.status;

  if (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504
  ) {
    return true;
  }

  if (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("RATE LIMIT") ||
    msg.includes("502") ||
    msg.includes("504") ||
    msg.includes("FETCH FAILED") ||
    msg.includes("NETWORK") ||
    msg.includes("TIMEOUT") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("SOCKET") ||
    msg.includes("UND_ERR")
  ) {
    return true;
  }

  return true;
}

/**
 * Gemini API çağrıları için dayanıklı retry mekanizması.
 * 503, 429 ve geçici network hatalarında:
 * - 1. deneme sonrası 2 saniye
 * - 2. deneme sonrası 4 saniye
 * - 3. deneme sonrası 8 saniye
 * 400, 401, 403, 404 gibi kalıcı hatalarda hemen sonlanır.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  customDelays: number[] = [2000, 4000, 8000]
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= customDelays.length; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 400, 401, 403, 404 gibi kalıcı hatalarda retry yapma
      if (isPermanentError(error) || attempt === customDelays.length) {
        break;
      }

      // 503, 429 veya geçici hata ise exponential backoff ile bekle
      if (isTransientError(error)) {
        const delayMs = customDelays[attempt];
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      break;
    }
  }

  // Retry sonunda yine geçici bir hatadan dolayı başarısızsa
  if (isTransientError(lastError)) {
    throw new Error("Gemini servisi şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin.");
  }

  throw lastError;
}

/**
 * Gemini API kullanarak PDF metnini özetler.
 * Metin çok uzunsa chunking mekanizması devreye girer.
 */
export async function summarizeWithGemini(
  text: string,
  summaryLevel: SummaryLength
): Promise<GeminiSummaryData> {
  const { client, model } = getGeminiClient();
  const systemInstruction = getSystemInstruction(summaryLevel);

  try {
    // 1. Durum: Metin güvenli boyutlarda ise doğrudan tek çağrı ile özetle (Gereksiz API çağrısını önle)
    if (!shouldChunk(text)) {
      const response = await withRetry(() =>
        client.models.generateContent({
          model,
          contents: `Aşağıdaki belge metnini dikkatle analiz et ve kurallara uygun olarak özetle:\n\n${text}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: summaryResponseSchema,
          },
        })
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini API boş bir yanıt döndürdü.");
      }

      return parseGeminiJsonResponse(responseText);
    }

    // 2. Durum: Metin aşırı uzunsa modüler chunking sistemi kullan
    const chunks = splitIntoChunks(text);

    // Her parça için ara özet üret (Map adımı - her chunk kendi retry döngüsüne sahip)
    const intermediateSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkPrompt = `Aşağıdaki metin, büyük bir belgenin ${i + 1}/${chunks.length} numaralı parçasıdır. Bu parçadaki kilit bilgileri, bulguları ve olası eylem adımlarını belgenin dilinde özetle:\n\n${chunk}`;

      const chunkResponse = await withRetry(() =>
        client.models.generateContent({
          model,
          contents: chunkPrompt,
          config: {
            systemInstruction:
              "Sen belge analiz uzmanısın. Yalnızca verilen metindeki kritik bilgileri ve bulguları hallucination yapmadan özetle.",
          },
        })
      );

      if (chunkResponse.text) {
        intermediateSummaries.push(`[Bölüm ${i + 1} Özeti]:\n${chunkResponse.text.trim()}`);
      }
    }

    // Ara özetleri birleştirerek nihai yapılandırılmış özeti üret (Reduce adımı)
    const combinedNotes = intermediateSummaries.join("\n\n────────────────\n\n");
    const finalPrompt = `Aşağıda büyük bir belgenin farklı bölümlerinden çıkarılmış ara özetler yer almaktadır. Bu ara özetleri sentezleyerek tüm belgeyi temsil eden nihai, bütüncül ve yapılandırılmış özeti oluştur:\n\n${combinedNotes}`;

    const finalResponse = await withRetry(() =>
      client.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: summaryResponseSchema,
        },
      })
    );

    const finalResponseText = finalResponse.text;
    if (!finalResponseText) {
      throw new Error("Gemini API nihai özetleme adımında boş bir yanıt döndürdü.");
    }

    return parseGeminiJsonResponse(finalResponseText);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const errorMessage = sanitizeErrorMessage(rawMessage);

    // Servis yoğunluğu veya retry sonu bildirimi
    if (errorMessage.includes("Gemini servisi şu anda yoğun")) {
      throw new Error("Gemini servisi şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin.");
    }

    // Kullanıcı dostu hata mesajları
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not valid")) {
      throw new Error("Geçersiz Gemini API anahtarı. Lütfen .env.local dosyanızdaki API anahtarını kontrol edin.");
    }
    if (
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("429") ||
      errorMessage.includes("503") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      throw new Error("Gemini servisi şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin.");
    }
    if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      throw new Error(
        `Seçilen Gemini modeli (${model}) bulunamadı veya bu API anahtarı ile erişilemiyor. Lütfen .env.local dosyasındaki GEMINI_MODEL ayarını kontrol edin.`
      );
    }
    if (errorMessage.includes("GEMINI_API_KEY")) {
      throw error;
    }

    throw new Error(`Gemini API işleminde hata: ${errorMessage}`);
  }
}

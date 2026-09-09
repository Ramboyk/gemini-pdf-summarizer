import { NextResponse } from "next/server";
import { SummaryLength } from "@/types";
import { summarizeWithGemini } from "@/lib/gemini";
import { isAdminSession } from "@/lib/admin-auth";
import { checkRateLimit, recordSuccessfulUsage } from "@/lib/rate-limit";

const VALID_LEVELS: SummaryLength[] = ["short", "medium", "detailed"];

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz istek gövdesi. JSON formatında veri bekleniyor.",
        },
        { status: 400 }
      );
    }

    const { text, summaryLevel } = body;

    // 1. Text doğrulama
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Özetlenecek metin boş olamaz. Lütfen geçerli bir PDF belgesi yükleyin.",
        },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Özetlenecek metin çok kısa. Anlamlı bir özet oluşturabilmek için en az birkaç cümle gereklidir.",
        },
        { status: 400 }
      );
    }

    // 2. summaryLevel doğrulama
    if (!summaryLevel || !VALID_LEVELS.includes(summaryLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz özet derinliği ('summaryLevel'). Yalnızca 'short', 'medium' veya 'detailed' değerleri kabul edilir.",
        },
        { status: 400 }
      );
    }

    // 3. Admin kontrolü
    const isAdmin = await isAdminSession(request);

    let rateCheck = null;

    if (!isAdmin) {
      // 4. Normal kullanıcılar için rate limit kontrolü
      rateCheck = await checkRateLimit(request);

      if (rateCheck.redisUnavailable) {
        return NextResponse.json(
          {
            success: false,
            error: rateCheck.error,
          },
          { status: 503 }
        );
      }

      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            code: rateCheck.code,
            error: rateCheck.error,
          },
          { status: 429 }
        );
      }
    }

    // 5. Gemini API ile özet oluşturma
    const summaryData = await summarizeWithGemini(trimmedText, summaryLevel);

    // 6. Admin ise sayaçları artırma, admin bayrağıyla dön
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        data: summaryData,
        admin: true,
      });
    }

    // 7. Normal kullanıcı başarılı özet ürettiğinde kotayı artır
    let usageInfo = {
      dailyLimit: rateCheck?.ipLimit ?? 3,
      remaining: Math.max(0, (rateCheck?.remaining ?? 3) - 1),
    };

    if (rateCheck?.ipKey && rateCheck?.globalKey && rateCheck?.ttl) {
      const recordResult = await recordSuccessfulUsage(
        rateCheck.ipKey,
        rateCheck.globalKey,
        rateCheck.ttl,
        rateCheck.ipLimit ?? 3
      );
      usageInfo = recordResult;
    }

    return NextResponse.json({
      success: true,
      data: summaryData,
      usage: usageInfo,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Özetleme işlemi sırasında beklenmedik bir hata oluştu.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

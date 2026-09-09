import { NextResponse } from "next/server";
import { SummaryLength } from "@/types";
import { summarizeWithGemini } from "@/lib/gemini";

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

    // 3. Gemini API ile özet oluşturma
    const summaryData = await summarizeWithGemini(trimmedText, summaryLevel);

    return NextResponse.json({
      success: true,
      data: summaryData,
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

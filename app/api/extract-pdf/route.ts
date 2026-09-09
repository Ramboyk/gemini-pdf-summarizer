import { NextResponse } from "next/server";
import { extractText } from "unpdf";

// Maksimum dosya boyutu: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Lütfen geçerli bir PDF dosyası yükleyin.",
        },
        { status: 400 }
      );
    }

    // Yalnızca PDF dosya kontrolü
    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        {
          success: false,
          error: "Yalnızca PDF formatındaki dosyalar desteklenmektedir.",
        },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (10 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Dosya boyutu 10 MB sınırını aşamaz.",
        },
        { status: 400 }
      );
    }

    // Dosya içeriğini Uint8Array olarak al
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // unpdf ile sayfa ve metin çıkarma
    const extractionResult = await extractText(uint8Array, { mergePages: true });
    const totalPages = extractionResult.totalPages || 0;
    const extractedText = (extractionResult.text || "").trim();

    // Metin içermeyen veya taranmış PDF kontrolü
    if (!extractedText || extractedText.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "PDF dosyasında okunabilir metin bulunamadı. Belge taranmış görsel veya şifreli olabilir.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      pageCount: totalPages,
      characterCount: extractedText.length,
      text: extractedText,
    });
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "PDF dosyası işlenirken bir hata meydana geldi: " +
          (error instanceof Error ? error.message : "Geçersiz veya bozuk dosya."),
      },
      { status: 500 }
    );
  }
}

// Güvenli tekil metin eşik değeri (karakter bazlı).
// Bu eşiğin altındaki metinler için tek geçişli doğrudan özetleme yapılır.
export const CHUNK_THRESHOLD = 12000;

// Parça boyutu ve örtüşme (overlap) miktarı
export const DEFAULT_CHUNK_SIZE = 10000;
export const DEFAULT_OVERLAP = 500;

/**
 * Verilen metnin parçalara bölünmesinin gerekip gerekmediğini denetler.
 */
export function shouldChunk(text: string, threshold: number = CHUNK_THRESHOLD): boolean {
  return text.length > threshold;
}

/**
 * Uzun metinleri mantıksal paragraf ve cümle sınırlarına dikkat ederek
 * güvenli boyutlarda parçalara (chunks) böler.
 */
export function splitIntoChunks(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= chunkSize) {
    return [trimmed];
  }

  // Öncelikle paragraflara ayır
  const paragraphs = trimmed.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    // Eğer tek bir paragraf tek başına chunkSize'tan büyükse, cümlelere böl
    if (cleanPara.length > chunkSize) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      const sentences = cleanPara.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [cleanPara];
      for (const sentence of sentences) {
        if ((currentChunk + " " + sentence).length > chunkSize) {
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
            // Örtüşme (overlap) için son kısmı koru
            const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - overlap));
            currentChunk = overlapText + " " + sentence;
          } else {
            // Tek bir cümle bile chunkSize'tan büyükse zorunlu parçala
            chunks.push(sentence.slice(0, chunkSize));
            currentChunk = sentence.slice(chunkSize);
          }
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        }
      }
      continue;
    }

    if ((currentChunk + "\n\n" + cleanPara).length > chunkSize) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        // Örtüşme (overlap) sağla
        const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - overlap));
        currentChunk = overlapText + "\n\n" + cleanPara;
      } else {
        currentChunk = cleanPara;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${cleanPara}` : cleanPara;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

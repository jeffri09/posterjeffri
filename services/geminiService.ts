import { GoogleGenAI, Type } from "@google/genai";
import { PosterFormData } from "../types";

const getAiClient = () => {
  // @ts-ignore
  const systemApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  const apiKey = localStorage.getItem('geminiApiKey') || systemApiKey;
  if (!apiKey) {
    throw new Error("API Key belum dikonfigurasi. Silakan isi API Key di menu Pengaturan.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates ALL poster content in a single request using Gemini 3.1 Flash Lite.
 */
export const generatePosterContent = async (topic: string): Promise<Partial<PosterFormData>> => {
  const ai = getAiClient();

  const prompt = `
    Anda adalah Ustadz bermanhaj Salaf & Art Director Profesional.
    Buat konten poster dakwah ringkas, terstruktur & visual premium untuk topik: "${topic}".

    **DALIL:** Seleksi dalil manhaj salaf SANGAT KETAT:
    0. DILARANG KERAS MENGARANG ATAU MEMALSUKAN DALIL/HADITS. Hanya gunakan dalil yang Anda yakini kesahihannya 100%.
    1. Pilih dalil yang PALING RELEVAN dan TEPAT SASARAN dengan topik, baik itu Ayat Al-Qur'an ATAUPUN Hadits Shahih.
    2. Jika menggunakan Al-Qur'an, teks Arab WAJIB menggunakan rasm Utsmani (standar Mushaf Madinah).
    3. Jika menggunakan Hadits, WAJIB Hadits Shahih (seperti riwayat Bukhari atau Muslim).
    4. Terjemahan WAJIB sesuai pemahaman manhaj salaf atau ulama manhaj salaf seperti Ibnu Katsir, At-Thabari, Al-Baghawi, dan As-Sa'di. Anda WAJIB merujuk pada basis data situs resmi: IbnTaymiyyah.com, IbnAlQayyim.com, BinBaz.org.sa, AlAlbany.net, BinOthaimeen.net, AlFawzan.af.org.sa, Muqbil.net, Rabee.net, Alifta.gov.sa (Lajnah Da'imah), Wafee.co, Tafsir.net, EbookSunnah.com, atau IslamHouse.com (id).
    5. WAJIB cantumkan sumber/referensi dalil (misal: "QS. Al-Baqarah: 123" atau "HR. Bukhari & Muslim") tepat di akhir teks "quoteTranslation", diletakkan di dalam tanda kurung. Contoh: "Allah tidak menerima shalat... (HR. Bukhari & Muslim)".
    **JUDUL:** Maks 6 kata (Emotional hook menarik).
    **NASIHAT:** Maks 2 kalimat singkat yang menyentuh hati.
    **VISUAL:** Deskripsi background ringkas (1-2 kalimat). WAJIB adaptif dengan topik (misal: gurun untuk sabar, api untuk neraka). Desain premium, banyak negative space. Jika ada manusia/hewan, WAJIB siluet/kartun tanpa wajah.
    **PALET WARNA:** Tentukan warna Dominan, Aksen, & Mood.
    **PENTING**: WAJIB kembalikan BENTUK JSON SAJA tanpa markdown (\`\`\`json) atau teks lainnya! Format JSON-nya:
    {
      "title": "...",
      "quoteArabic": "...",
      "quoteTranslation": "...",
      "advice": "...",
      "visualContext": "...",
      "colorPalette": "..."
    }
  `;

  const savedModel = localStorage.getItem('geminiModel');
  const modelsToTry = savedModel ? [savedModel, 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'] : [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 3;
    while (retries > 0) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout setelah 20 detik")), 20000);
        });

        const fetchPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1, // Sangat ketat, anti-halusinasi
            topP: 0.8
          }
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]) as any;

        const text = response.text;
        if (!text) {
          throw new Error(`Respons kosong dari model ${modelName}`);
        }

        // Clean up markdown just in case
        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
      } catch (e: any) {
        lastError = e;
        const msg = (e.message || String(e)).toLowerCase();

        // Pengecualian: Jika model tidak ada (404), langsung beralih ke model berikutnya.
        if (msg.includes('404') || msg.includes('not found')) {
          console.warn(`[Gemini Fallback] Model ${modelName} tidak ditemukan. Beralih model...`);
          break; // Keluar dari while, lanjut loop for
        }

        retries--;
        console.warn(`[Gemini Fallback] Gagal (${modelName}). Sisa percobaan: ${retries}. Error: ${e.message}`);

        if (retries > 0) {
          // Tunggu 1 detik sebelum mencoba lagi untuk menghindari rate limit
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  throw new Error(lastError?.message || "Semua model AI gagal memproses permintaan setelah beberapa kali percobaan.");
};

// ═══════════════════════════════════════
// BATCH GENERATION — Multi-prompt dengan chunking
// ═══════════════════════════════════════

const CHUNK_SIZE = 5;       // Maks 5 variasi per panggilan API
const CHUNK_DELAY_MS = 5000; // 5 detik jeda antar chunk (aman untuk 15 RPM)
const BATCH_TIMEOUT_MS = 45000; // 45 detik timeout per chunk

/**
 * Generates multiple unique poster contents in batches.
 * Uses chunking to stay within API rate limits (15 RPM).
 */
export const generateBatchPosterContent = async (
  topic: string,
  count: number,
  onProgress?: (completed: number, total: number) => void
): Promise<Partial<PosterFormData>[]> => {
  const ai = getAiClient();
  const allResults: Partial<PosterFormData>[] = [];
  const usedDalilList: string[] = []; // Anti-duplikasi dalil lintas chunk

  const totalChunks = Math.ceil(count / CHUNK_SIZE);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const remaining = count - allResults.length;
    const chunkCount = Math.min(CHUNK_SIZE, remaining);

    // Bangun instruksi anti-duplikasi
    const antiDuplicateInstruction = usedDalilList.length > 0
      ? `\n    **LARANGAN DUPLIKASI:** Dalil-dalil berikut SUDAH DIGUNAKAN dan DILARANG diulang:\n    ${usedDalilList.map((d, i) => `    ${i + 1}. ${d}`).join('\n')}\n    Kamu WAJIB memilih dalil LAIN yang belum ada di daftar di atas.`
      : '';

    const prompt = `
    Anda adalah Ustadz bermanhaj Salaf & Art Director Profesional.
    Buat ${chunkCount} VARIASI konten poster dakwah yang SEMUANYA BERBEDA untuk topik: "${topic}".

    **ATURAN VARIASI:**
    - Setiap variasi WAJIB menggunakan DALIL YANG BERBEDA (jangan mengulang ayat/hadits yang sama).
    - Setiap variasi WAJIB menggunakan JUDUL yang BERBEDA dengan sudut pandang/angle yang berbeda.
    - Setiap variasi WAJIB menggunakan VISUAL yang BERBEDA (warna, suasana, elemen visual berbeda).
    - Setiap variasi WAJIB menggunakan NASIHAT yang BERBEDA.
    ${antiDuplicateInstruction}

    **DALIL:** Seleksi dalil manhaj salaf SANGAT KETAT:
    0. DILARANG KERAS MENGARANG ATAU MEMALSUKAN DALIL/HADITS. Hanya gunakan dalil yang Anda yakini kesahihannya 100%.
    1. Pilih dalil yang PALING RELEVAN dan TEPAT SASARAN dengan topik, baik itu Ayat Al-Qur'an ATAUPUN Hadits Shahih.
    2. Jika menggunakan Al-Qur'an, teks Arab WAJIB menggunakan rasm Utsmani (standar Mushaf Madinah).
    3. Jika menggunakan Hadits, WAJIB Hadits Shahih (seperti riwayat Bukhari atau Muslim).
    4. Terjemahan WAJIB sesuai pemahaman manhaj salaf atau ulama manhaj salaf seperti Ibnu Katsir, At-Thabari, Al-Baghawi, dan As-Sa'di. Anda WAJIB merujuk pada basis data situs resmi: IbnTaymiyyah.com, IbnAlQayyim.com, BinBaz.org.sa, AlAlbany.net, BinOthaimeen.net, AlFawzan.af.org.sa, Muqbil.net, Rabee.net, Alifta.gov.sa (Lajnah Da'imah), Wafee.co, Tafsir.net, EbookSunnah.com, atau IslamHouse.com (id).
    5. WAJIB cantumkan sumber/referensi dalil (misal: "QS. Al-Baqarah: 123" atau "HR. Bukhari & Muslim") tepat di akhir teks "quoteTranslation", diletakkan di dalam tanda kurung.
    **JUDUL:** Maks 6 kata (Emotional hook menarik).
    **NASIHAT:** Maks 2 kalimat singkat yang menyentuh hati.
    **VISUAL:** Deskripsi background ringkas (1-2 kalimat). WAJIB adaptif dengan topik. Desain premium, banyak negative space. Jika ada manusia/hewan, WAJIB siluet/kartun tanpa wajah.
    **PALET WARNA:** Tentukan warna Dominan, Aksen, & Mood.
    **PENTING**: WAJIB kembalikan BENTUK JSON ARRAY SAJA tanpa markdown (\`\`\`json) atau teks lainnya! Format JSON Array-nya:
    [
      {
        "title": "...",
        "quoteArabic": "...",
        "quoteTranslation": "...",
        "advice": "...",
        "visualContext": "...",
        "colorPalette": "..."
      }
    ]
    Hasilkan tepat ${chunkCount} objek dalam array.
  `;

    // Coba kirim ke AI dengan fallback model
    const savedModel = localStorage.getItem('geminiModel');
    const modelsToTry = savedModel ? [savedModel, 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'] : [
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash'
    ];
    let chunkSuccess = false;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let retries = 2;
      while (retries > 0) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout setelah 45 detik")), BATCH_TIMEOUT_MS);
          });

          const fetchPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7, // Lebih tinggi untuk variasi
              topP: 0.95
            }
          });

          const response = await Promise.race([fetchPromise, timeoutPromise]) as any;
          const text = response.text;
          if (!text) throw new Error(`Respons kosong dari model ${modelName}`);

          const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed = JSON.parse(cleanedText);

          // Normalisasi: jika AI mengembalikan objek tunggal, bungkus dalam array
          if (!Array.isArray(parsed)) parsed = [parsed];

          // Simpan hasil dan catat dalil yang sudah dipakai
          for (const item of parsed) {
            allResults.push(item);
            if (item.quoteTranslation) {
              usedDalilList.push(item.quoteTranslation.substring(0, 80));
            }
          }

          chunkSuccess = true;
          break; // Keluar dari retry loop
        } catch (e: any) {
          lastError = e;
          const msg = (e.message || String(e)).toLowerCase();
          if (msg.includes('404') || msg.includes('not found')) {
            console.warn(`[Batch] Model ${modelName} tidak ditemukan. Beralih...`);
            break;
          }
          retries--;
          console.warn(`[Batch] Gagal chunk ${chunkIndex + 1} (${modelName}). Sisa: ${retries}. Error: ${e.message}`);
          if (retries > 0) await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (chunkSuccess) break;
    }

    if (!chunkSuccess) {
      throw new Error(`Gagal memproses chunk ${chunkIndex + 1}: ${lastError?.message || 'Unknown error'}`);
    }

    // Update progress
    onProgress?.(allResults.length, count);

    // Jeda antar chunk (kecuali chunk terakhir) — 5 detik untuk mematuhi 15 RPM
    if (chunkIndex < totalChunks - 1) {
      await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
    }
  }

  // Potong hasil jika melebihi jumlah yang diminta (karena chunk terakhir bisa lebih)
  return allResults.slice(0, count);
};
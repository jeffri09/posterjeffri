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

    **DALIL:** 1 Ayat Al-Qur'an atau Hadits Shahih (Bukhari/Muslim) relevan & terjemahannya (manhaj Salaf).
    **JUDUL:** Maks 5 kata (Emotional hook menarik).
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
            responseMimeType: 'application/json'
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
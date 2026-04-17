import { GoogleGenAI, Type } from "@google/genai";
import { PosterFormData } from "../types";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates ALL poster content in a single request using Gemini 3.1 Flash Lite.
 */
export const generatePosterContent = async (topic: string): Promise<Partial<PosterFormData>> => {
  const ai = getAiClient();
  
  const prompt = `
    Anda adalah Ustadz bermanhaj Salaf & Art Director Profesional.
    Buat konten poster dakwah untuk topik: "${topic}".

    **DALIL:** Cari Ayat Al-Qur'an yang relevan. Jika tidak ada, gunakan Hadits SHAHIH (Bukhari/Muslim). Terjemahan sesuai pemahaman Salafush Shalih.

    **JUDUL:** Buat emotional hook maksimal 5 kata. Contoh formula: pertanyaan retoris, pernyataan berani, kontradiksi, atau urgensi lembut.

    **NASIHAT:** 2-3 kalimat yang menyentuh hati dan memotivasi.

    **VISUAL (PENTING — HARUS ADAPTIF SESUAI TOPIK):**
    Buat deskripsi visual background yang SESUAI dengan topik, bukan ornamen generik.
    Panduan:
    - Neraka/Azab → Api membara, lava, suasana gelap dramatis
    - Surga/Pahala → Taman hijau subur, sungai jernih, cahaya terang indah
    - Sabar/Ujian → Gurun luas, pohon kokoh sendirian, ombak tenang
    - Sedekah/Memberi → Hujan rahmat, air mengalir, tangan memberi (kartun tanpa wajah)
    - Taubat/Ampunan → Cahaya terang menembus kegelapan, pintu terbuka
    - Kematian → Jalan sunyi berkabut, matahari terbenam
    - Birrul Walidain → Siluet/kartun tanpa wajah anak & orang tua
    - Persaudaraan → Kartun tanpa wajah berjabat tangan
    - Topik lain → Pilih visual yang paling merepresentasikan pesan

    ATURAN MAKHLUK BERNYAWA: Jika topik memerlukan manusia/hewan, tampilkan sebagai KARTUN TANPA WAJAH (tanpa mata, hidung, mulut — hanya bentuk tubuh/siluet). Gaya ilustrasi minimalis.

    Desain harus terlihat PROFESIONAL dan PREMIUM, bukan generik.
    Fokus pada negative space agar teks mudah dibaca.

    **PALET WARNA:** Tentukan warna yang cocok dengan topik & visual.
    Format: Dominan: [Warna] ([Hex]) | Aksen: [Warna] ([Hex]) | Brand Footer: Biru Tua (#0E2F73) | Mood: [Kata Sifat]
  `;

  const modelsToTry = [
    'gemini-3.1-flash-lite', 
    'gemini-2.5-flash-lite', 
    'gemini-2.5-flash'
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                quoteArabic: { type: Type.STRING },
                quoteTranslation: { type: Type.STRING },
                advice: { type: Type.STRING },
                visualContext: { type: Type.STRING },
                colorPalette: { type: Type.STRING }
              }
            }
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error(`Respons kosong dari model ${modelName}`);
        }

        return JSON.parse(text);
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
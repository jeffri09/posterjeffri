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
    Anda adalah seorang Ustadz bermanhaj Salaf sekaligus Art Director Profesional.
    Tugas: Buat konten lengkap untuk poster dakwah berdasarkan topik: "${topic}".

    **INSTRUKSI LOGIKA DALIL (MANHAJ SALAF):**
    1. **PRIORITAS UTAMA:** Cari Ayat Al-Qur'an yang relevan.
    2. Jika tidak ada ayat yang spesifik, cari Hadits yang **SHAHIH** (Riwayat Bukhari, Muslim, Tirmidzi, dll).
    3. Pastikan terjemahan sesuai dengan pemahaman Salafush Shalih (tidak menyimpang).

    **INSTRUKSI KONTEN LAIN:**
    1. **JUDUL (HEADLINE):** Buat judul yang menggunakan EMOTIONAL HOOK (pilih salah satu formula):
       - PERTANYAAN RETORIS: "Masihkah Kamu Ragu Bersedekah?"
       - PERNYATAAN BERANI: "HARTA TIDAK AKAN BERKURANG"
       - KONTRADIKSI: "MEMBERI JUSTRU MENAMBAH"
       - URGENSI LEMBUT: "JANGAN TUNDA KEBAIKAN INI"
       Panjang maksimal: 5 kata. Hindari judul terlalu umum seperti "KEUTAMAAN SEDEKAH".
    2. **NASIHAT:** Buat penjelasan singkat (2-3 kalimat) yang lembut, menyentuh hati, dan memotivasi untuk mengamalkan dalil tersebut.
    3. **VISUAL (PENTING):** Buat deskripsi visual untuk background poster.
       - **VISUAL STORYTELLING:** Pilih SATU visual metaphor yang merepresentasikan TRANSFORMASI atau HARAPAN. (Contoh untuk sedekah: Tangan yang memberi, benih yang tumbuh, air mengalir).
       - **HINDARI:** Masjid generik, kaligrafi dekoratif tanpa makna.
       - **GAYA:** Minimalis, Alam (Nature), atau Abstrak Islami yang Premium & Elegan.
       - **READABILITY:** Fokus pada "Wide Negative Space" agar teks mudah dibaca.
    4. **PALET WARNA:** Tentukan warna dominan, aksen, dan mood berdasarkan topik.
       Format output WAJIB seperti ini:
       - Dominan: [Warna Dominan] ([Kode Hex])
       - Aksen: [Warna Aksen] ([Kode Hex])
       - Brand Footer: Biru Tua (#0E2F73)
       - Mood: [Kata Sifat Mood]

       Panduan Warna:
       - Sedekah/Rezeki: Hijau Zamrud + Gold (ketenangan, kemakmuran)
       - Sabar/Ujian: Biru Langit + Abu Silver (ketenangan, harapan)
       - Taubat/Dosa: Ungu Tua + Putih (kekhusyukan, kesucian)
       - Syukur: Orange Hangat + Krem (kehangatan, kegembiraan)
       - Akhirat/Mati: Hitam + Gold (keagungan, keseriusan)
       - Atau warna lain yang sesuai jika topik berbeda.
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
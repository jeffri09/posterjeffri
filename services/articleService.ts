import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // @ts-ignore
  const systemApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  const apiKey = localStorage.getItem('geminiApiKey') || systemApiKey;
  if (!apiKey) {
    throw new Error("API Key belum dikonfigurasi. Silakan isi API Key di menu Pengaturan.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ArticleParagraph {
  type: 'latin' | 'arabic';
  text: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface ArticleContent {
  title: string;
  paragraphs: ArticleParagraph[];
}

export const generateArticleContent = async (topic: string, reference?: string): Promise<ArticleContent> => {
  const ai = getAiClient();
  
  const prompt = `
    Anda adalah seorang Ustadz bermanhaj Salaf yang ahli dalam menulis karya ilmiah dan artikel dakwah yang panjang, mendalam, dan terstruktur.
    Tugas Anda: Buat artikel dakwah bermanhaj salaf yang komprehensif dan mendalam, sepanjang kurang lebih 1500 kata (setara 3-4 halaman) tentang topik: "${topic}".
    ${reference ? `\nReferensi atau rujukan materi yang diberikan pengguna:\n"${reference}"\nEksplorasi dan jadikan referensi ini sebagai bahan utama tulisan jika relevan.` : ''}

    ATURAN KETAT (WAJIB DIIKUTI):
    1. Takhrij Hadits WAJIB Shahih (seperti riwayat Bukhari dan Muslim). DILARANG KERAS menggunakan hadits dha'if atau maudhu'.
    2. Rujukan pemahaman, kutipan, atau tafsir WAJIB merujuk pada: 
       - Ulama Salaf: Tafsir Ibnu Katsir, At-Thabari, Al-Baghawi, As-Sa'di, Syaikhul Islam Ibnu Taimiyah, Ibnul Qayyim al-Jauziyyah.
       - Ulama Kontemporer: Syaikh Abdul Aziz bin Baz, Syaikh Muhammad Nashiruddin al-Albani, Syaikh Muhammad bin Shalih al-Utsaimin, Syaikh Muqbil bin Hadi al-Wadi'i, Syaikh Rabi' bin Hadi al-Madkhali.
    3. Teks Al-Qur'an (Arab) WAJIB menggunakan rasm Utsmani.
    4. Struktur Artikel: Pendahuluan, Pembahasan Mendalam (dengan beberapa sub-judul), dan Kesimpulan. Tulislah panjang lebar dengan penjabaran poin per poin.
    5. Di akhir artikel, paragraf terakhir WAJIB berisi sumber tulisan dengan format: "Diringkas dari buku [Nama Buku/Kitab], karya [Nama Penulis]" atau sesuaikan dengan referensi yang dipakai.

    PENTING: Output WAJIB dalam bentuk JSON murni (tanpa markdown \`\`\`json) dengan format berikut:
    {
      "title": "Judul Artikel yang Menarik",
      "paragraphs": [
        {
          "type": "latin",
          "text": "Teks paragraf bahasa Indonesia di sini...",
          "bold": false,
          "align": "justify"
        },
        {
          "type": "arabic",
          "text": "Teks Arab (Dalil) di sini...",
          "bold": false,
          "align": "right"
        }
      ]
    }

    Catatan Format JSON:
    - Pisahkan teks Arab dan teks Latin ke dalam objek 'paragraphs' yang berbeda. JANGAN menggabungkan teks Arab dan Latin dalam satu nilai 'text'.
    - Gunakan properti "bold": true untuk sub-judul atau penekanan.
    - Gunakan properti "align": "center" untuk judul bagian, atau "justify" untuk paragraf biasa, dan "right" untuk arabic.
    - Elaborasi penjelasan dengan sangat detail agar artikel mencapai panjang yang optimal. Buat banyak paragraf yang ekstensif.
  `;

  const savedModel = localStorage.getItem('geminiModel');
  const modelsToTry = savedModel ? [savedModel, 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'] : [
    'gemini-3.1-flash-lite-preview', 
    'gemini-2.5-flash-lite', 
    'gemini-2.5-flash'
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 2;
    while (retries > 0) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout setelah 90 detik")), 90000);
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

        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as ArticleContent;
      } catch (e: any) {
        lastError = e;
        const msg = (e.message || String(e)).toLowerCase();
        
        if (msg.includes('404') || msg.includes('not found')) {
          console.warn(`[Gemini Fallback] Model ${modelName} tidak ditemukan. Beralih model...`);
          break;
        }

        retries--;
        console.warn(`[Gemini Fallback] Gagal (${modelName}). Sisa percobaan: ${retries}. Error: ${e.message}`);
        
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  }

  throw new Error(lastError?.message || "Semua model AI gagal memproses artikel.");
};

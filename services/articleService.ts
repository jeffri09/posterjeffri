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
    Tugas Anda: Buat artikel dakwah bermanhaj salaf yang SANGAT PANJANG, komprehensif, dan mendalam, dengan target 2500 hingga 3500 kata (MINIMAL 4 halaman F4 penuh) tentang topik: "${topic}".
    Anda HARUS membedah topik ini secara rinci dari berbagai sudut pandang (dalil, asbabun nuzul, penjelasan tafsir ulama secara luas, penjabaran faedah hukum/adab, hingga implementasi/studi kasus nyata masa kini).
    ${reference ? `\nReferensi atau rujukan materi yang diberikan pengguna:\n"${reference}"\nEksplorasi dan elaborasi referensi ini secara maksimal menjadi paragraf-paragraf yang panjang.` : ''}

    ATURAN KETAT (WAJIB DIIKUTI):
    0. DILARANG KERAS MENGARANG (HALUSINASI) ISI, FATWA, ATAU DALIL. Anda harus bertindak secara ilmiah dan amanah secara ilmiah. Jika Anda tidak tahu dalil atau pendapat ulama yang sahih tentang suatu sub-topik, JANGAN ditulis. Kutip hanya yang pasti benar.
    1. Takhrij Hadits WAJIB Shahih (seperti riwayat Bukhari dan Muslim). DILARANG KERAS menggunakan hadits dha'if atau maudhu'.
    2. Rujukan pemahaman, kutipan, atau tafsir WAJIB merujuk pada: 
       - Ulama Salaf: Tafsir Ibnu Katsir, At-Thabari, Al-Baghawi, As-Sa'di, Syaikhul Islam Ibnu Taimiyah, Ibnul Qayyim al-Jauziyyah.
       - Ulama Kontemporer: Syaikh Abdul Aziz bin Baz, Syaikh Muhammad Nashiruddin al-Albani, Syaikh Muhammad bin Shalih al-Utsaimin, Syaikh Shalih al-Fauzan, Syaikh Muqbil bin Hadi al-Wadi'i, Syaikh Rabi' bin Hadi al-Madkhali.
       - PENTING: Jika tidak ditemukan pendapat spesifik ulama tersebut, ATAU jika topiknya menyangkut masalah Muamalah Kontemporer (seperti Affiliate, Digital Marketing, dll), maka WAJIB jadikan fatwa kolektif Lajnah Da'imah sebagai prioritas utama.
    3. Teks Al-Qur'an (Arab) WAJIB menggunakan rasm Utsmani.
    4. PANJANG ARTIKEL & STRUKTUR: Artikel HARUS memiliki Pendahuluan, banyak Sub-Judul (minimal 5 sub-judul utama) untuk Pembahasan Mendalam, dan Kesimpulan. Setiap sub-judul HARUS diuraikan dalam minimal 3-4 paragraf yang panjang. JANGAN menyingkat penjelasan. Jabarkan tafsir dan asbabul wurud dengan sedetail mungkin. Targetkan total minimal 15-25 paragraf panjang untuk mencapai kuota 4 halaman.
    5. Di akhir artikel, paragraf terakhir WAJIB berisi sumber tulisan dengan format: "Diringkas dari buku [Nama Buku/Kitab/Fatwa], karya [Nama Penulis / Lembaga]" atau sesuaikan referensinya.

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
            responseMimeType: 'application/json',
            temperature: 0.1, // Sangat ketat, tidak mengarang bebas
            topP: 0.8
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

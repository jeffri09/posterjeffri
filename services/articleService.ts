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
    TARGET PEMBACA: Penuntut Ilmu (Thalibul 'Ilmi). Gunakan bahasa yang akademis, ilmiah, sangat mendalam, dan terstruktur rapi.
    Tugas Anda: Buat artikel dakwah bermanhaj salaf yang SANGAT PANJANG, komprehensif, dan mendalam, dengan target MINIMAL 3500 kata (PASTIKAN MENCAPAI 4 halaman F4 penuh) tentang topik: "${topic}".
    Anda HARUS membedah topik ini secara rinci dari berbagai sudut pandang (dalil, asbabun nuzul, penjelasan tafsir ulama secara luas, penjabaran faedah hukum/adab, hingga implementasi/studi kasus nyata masa kini).
    Jika bahasan utama dirasa kurang panjang untuk mencapai 4 halaman, Anda WAJIB menambahkan faedah turunan, hukum-hukum cabang, atau studi kasus yang MASIH DALAM SATU TOPIK (SEALUR) dengan topik awal. DILARANG KERAS menyimpang atau melompat ke topik lain yang berbeda (misal: dari bahas Affiliate tiba-tiba bahas Haji).
    ${reference ? `\nReferensi atau rujukan materi yang diberikan pengguna:\n"${reference}"\nEksplorasi dan elaborasi referensi ini secara maksimal menjadi paragraf-paragraf yang panjang.` : ''}

    ATURAN KETAT (WAJIB DIIKUTI):
    0. DILARANG KERAS MENGARANG (HALUSINASI) ISI, FATWA, ATAU DALIL. Anda harus bertindak secara ilmiah dan amanah secara ilmiah. Jika Anda tidak tahu dalil atau pendapat ulama yang sahih tentang suatu sub-topik, JANGAN ditulis. Kutip hanya yang pasti benar.
    1. Takhrij Hadits WAJIB Shahih (seperti riwayat Bukhari dan Muslim). DILARANG KERAS menggunakan hadits dha'if atau maudhu'.
    2. Rujukan pemahaman, kutipan, atau tafsir WAJIB merujuk pada (Pioritaskan pengetahuan Anda dari domain-domain resmi berikut): 
       - Syaikhul Islam Ibnu Taimiyah (IbnTaymiyyah.com) & Ibnul Qayyim al-Jauziyyah (IbnAlQayyim.com).
       - Ulama Kontemporer: Syaikh Bin Baz (BinBaz.org.sa), Syaikh Al-Albani (AlAlbany.net), Syaikh Al-Utsaimin (BinOthaimeen.net), Syaikh Shalih al-Fauzan (AlFawzan.af.org.sa), Syaikh Muqbil (Muqbil.net), Syaikh Rabi' bin Hadi (Rabee.net).
       - Tafsir Ibnu Katsir, At-Thabari, Al-Baghawi (Wafee.co / Tafsir.net). Tafsir As-Sa'di (EbookSunnah.com).
       - PENTING: Jika tidak ditemukan pendapat spesifik ulama tersebut, ATAU jika topiknya menyangkut masalah Muamalah Kontemporer (seperti Affiliate, Digital Marketing, dll), maka WAJIB jadikan fatwa kolektif Lajnah Da'imah (Alifta.gov.sa) sebagai prioritas utama.
       - Untuk referensi buku berbahasa Indonesia, gunakan EbookSunnah.com atau IslamHouse.com edisi Indonesia.
    3. Teks Al-Qur'an (Arab) WAJIB menggunakan rasm Utsmani.
    4. REFERENSI DALIL GANDA: Anda WAJIB MENCANTUMKAN REFERENSI DALIL (Misal: "(HR. Bukhari & Muslim)" atau "(QS. Al-Baqarah: 123)") tepat di AKHIR TEKS ARAB dan juga tepat di AKHIR TEKS TERJEMAHANNYA (keduanya wajib menggunakan tanda kurung).
    5. PANJANG ARTIKEL & STRUKTUR: Artikel HARUS memiliki Pendahuluan, banyak Sub-Judul (minimal 6 sub-judul utama) untuk Pembahasan Mendalam, dan Kesimpulan. Setiap sub-judul HARUS diuraikan dalam minimal 4-5 paragraf yang panjang. JANGAN menyingkat penjelasan. Jabarkan tafsir dan asbabul wurud dengan sedetail mungkin. Targetkan total minimal 25-35 paragraf panjang untuk memastikan kuota 4 halaman terpenuhi.
    6. Di akhir artikel, paragraf terakhir WAJIB berisi sumber tulisan dengan format: "Diringkas dari buku [Nama Buku/Kitab/Fatwa], karya [Nama Penulis / Lembaga]" atau sesuaikan referensinya.

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
            topP: 0.8,
            tools: [{ googleSearch: {} }]
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

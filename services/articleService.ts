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

// Jeda antar panggilan API untuk menghormati limit RPM free tier
const rateLimitDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

const generateArticlePart = async (
  ai: any,
  modelName: string,
  prompt: string
): Promise<any> => {
  let retries = 3;
  let lastError: any = null;
  let backoffMs = 5000; // Mulai dari 5 detik

  while (retries > 0) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout setelah 3 menit")), 180000);
      });
      
      const fetchPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 16384 // Cukup besar untuk ~8000 kata, aman untuk free tier TPM 205K
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as any;

      const text = response.text;
      if (!text) {
        throw new Error(`Respons kosong dari model ${modelName}`);
      }

      const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e: any) {
      lastError = e;
      const msg = (e.message || String(e)).toLowerCase();
      
      if (msg.includes('404') || msg.includes('not found')) {
        throw e; // Lempar ke luar agar bisa ganti model
      }

      retries--;
      
      // Jika kena rate limit (429), tunggu lebih lama dengan exponential backoff
      if (msg.includes('429') || msg.includes('rate') || msg.includes('quota') || msg.includes('resource_exhausted')) {
        console.warn(`[Rate Limit] Terkena limit API. Menunggu ${backoffMs/1000} detik...`);
        await rateLimitDelay(backoffMs);
        backoffMs *= 2; // Exponential backoff: 5s → 10s → 20s
      } else {
        console.warn(`[Gemini] Gagal. Sisa percobaan: ${retries}. Error: ${e.message}`);
        if (retries > 0) {
          await rateLimitDelay(3000);
        }
      }
    }
  }

  throw new Error(lastError?.message || "Gagal memproses bagian artikel.");
};

export const generateArticleContent = async (topic: string, reference?: string): Promise<ArticleContent> => {
  const ai = getAiClient();
  const savedModel = localStorage.getItem('geminiModel');
  const modelsToTry = savedModel ? [savedModel, 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'] : [
    'gemini-3.1-flash-lite-preview', 
    'gemini-2.5-flash-lite', 
    'gemini-2.5-flash'
  ];

  const baseRules = `
    Anda adalah seorang Ustadz bermanhaj Salaf yang ahli dalam menulis karya ilmiah dan artikel dakwah yang panjang, mendalam, dan terstruktur.
    TARGET PEMBACA: Penuntut Ilmu (Thalibul 'Ilmi). Gunakan bahasa yang akademis, ilmiah, sangat mendalam, dan terstruktur rapi.
    Topik Utama: "${topic}".
    ${reference ? `\nReferensi dari pengguna:\n"${reference}"\nEksplorasi secara maksimal.` : ''}

    KONTEKS FORMAT DOKUMEN (WAJIB DIPAHAMI UNTUK TARGET PANJANG):
    - Dokumen dicetak pada kertas F4 (215x330mm), margin 2cm, font Calibri 11pt, line spacing 1.0.
    - Dengan format ini, SATU HALAMAN F4 berisi sekitar 1000 kata Latin.
    - Target: artikel HARUS mengisi MINIMAL 4 HALAMAN PENUH = MINIMAL 4000 KATA LATIN.
    - Anda WAJIB menulis dengan sangat panjang, detail, dan menyeluruh untuk mencapai target ini.

    ATURAN KETAT (WAJIB DIIKUTI):
    0. DILARANG KERAS MENGARANG (HALUSINASI) ISI, FATWA, ATAU DALIL. Anda harus bertindak secara ilmiah dan amanah.
    1. Takhrij Hadits WAJIB Shahih (Bukhari dan Muslim dll). DILARANG menggunakan hadits dha'if.
    2. Rujukan WAJIB merujuk pada: Ibnu Taimiyah, Ibnul Qayyim, Syaikh Bin Baz, Syaikh Al-Albani, Syaikh Al-Utsaimin, Syaikh Shalih al-Fauzan, Lajnah Da'imah (khusus muamalah kontemporer), dan kitab-kitab tafsir salaf.
    3. Teks Al-Qur'an (Arab) WAJIB rasm Utsmani.
    4. REFERENSI DALIL GANDA: WAJIB mencantumkan referensi dalil (Misal: "(QS. Al-Baqarah: 275)") di AKHIR TEKS ARAB (dengan huruf latin) dan di AKHIR TEKS TERJEMAHAN.

    ATURAN MENULIS PARAGRAF:
    - Pisahkan teks Arab dan teks Latin ke dalam objek 'paragraphs' yang BERBEDA.
    - Gunakan properti "bold": true untuk sub-judul.
    - Gunakan properti "align": "center" untuk judul bagian, "justify" untuk paragraf biasa, dan "right" untuk arabic.
    - SETIAP paragraf Latin WAJIB PANJANG, minimal 4-6 kalimat (sekitar 100-200 kata). DILARANG KERAS menulis paragraf pendek 1-2 kalimat.
    - Untuk setiap poin yang dibahas, WAJIB jelaskan: (a) konteksnya, (b) dalil pendukung, (c) penjelasan ulama, (d) kesimpulan faedahnya.
  `;

  const part1Prompt = `
    ${baseRules}
    Tugas Anda SEKARANG: Buat BAGIAN PERTAMA (dari 3 bagian). Target bagian ini: MINIMAL 1300 KATA LATIN.
    Bagian ini mencakup 2 bab:

    BAB 1: PENDAHULUAN (Tulis MINIMAL 7 paragraf panjang, total ~700 kata)
    Bahas secara mendalam dan elaboratif:
    - Kondisi umat Islam hari ini terkait topik "${topic}" dan fenomena penyimpangan yang terjadi.
    - Urgensi dan latar belakang mengapa topik ini sangat penting untuk dibahas secara ilmiah.
    - Gambaran umum bagaimana para ulama salaf memandang topik ini.
    - Tujuan penulisan artikel ini dan manfaatnya bagi pembaca.

    BAB 2: DEFINISI & HAKIKAT (Tulis MINIMAL 7 paragraf panjang, total ~600 kata)
    Jelaskan secara menyeluruh:
    - Definisi secara bahasa (etimologi/lughawi) dengan akar kata Arabnya.
    - Definisi secara istilah (terminologi/ishtilahi) menurut beberapa ulama.
    - Hakikat dan ruang lingkup topik ini dalam tinjauan syariat Islam.
    - Perbedaan istilah-istilah terkait yang sering dicampuradukkan masyarakat.

    PENTING: Output WAJIB JSON murni:
    {
      "title": "Judul Artikel yang Menarik dan Ilmiah",
      "paragraphs": [
        { "type": "latin", "text": "...", "bold": true, "align": "center" },
        { "type": "latin", "text": "[paragraf panjang 4-6 kalimat]", "bold": false, "align": "justify" },
        { "type": "arabic", "text": "...", "bold": false, "align": "right" }
      ]
    }
  `;

  const part2Prompt = `
    ${baseRules}
    Tugas Anda SEKARANG: Buat BAGIAN KEDUA (dari 3 bagian). Target bagian ini: MINIMAL 1500 KATA LATIN.
    Bagian ini mencakup 2 bab:

    BAB 3: DALIL AL-QUR'AN & TAFSIR RINCI (Tulis MINIMAL 10 paragraf panjang, total ~750 kata Latin)
    Struktur PER AYAT (kutip MINIMAL 5 ayat):
    1. Paragraf sub-judul ayat (bold, center)
    2. Teks Arab ayat dengan rasm Utsmani (type: arabic, align: right) — akhiri dengan referensi latin seperti "(QS. Al-Baqarah: 275)"
    3. Paragraf terjemahan ayat dalam bahasa Indonesia (type: latin, justify)
    4. Paragraf penjelasan tafsir yang PANJANG (4-6 kalimat), mengutip pendapat Ibnu Katsir, At-Thabari, As-Sa'di, atau Al-Baghawi.
    5. Paragraf faedah dan pelajaran dari ayat tersebut (4-6 kalimat).

    BAB 4: DALIL HADITS & SYARAH RINCI (Tulis MINIMAL 10 paragraf panjang, total ~750 kata Latin)
    Struktur PER HADITS (kutip MINIMAL 5 hadits shahih):
    1. Paragraf sub-judul hadits (bold, center)
    2. Teks Arab matan hadits (type: arabic, align: right) — akhiri dengan referensi latin seperti "(HR. Bukhari no. 1234)"
    3. Paragraf terjemahan hadits (type: latin, justify)
    4. Paragraf syarah/penjelasan hadits yang PANJANG (4-6 kalimat), menjelaskan kandungan, konteks, dan faedah.

    PENTING: Output WAJIB JSON murni HANYA BERISI ARRAY PARAGRAPHS:
    {
      "paragraphs": [
        { "type": "latin", "text": "...", "bold": true, "align": "center" },
        { "type": "arabic", "text": "...", "bold": false, "align": "right" },
        { "type": "latin", "text": "[paragraf panjang 4-6 kalimat]", "bold": false, "align": "justify" }
      ]
    }
  `;

  const part3Prompt = `
    ${baseRules}
    Tugas Anda SEKARANG: Buat BAGIAN KETIGA (TERAKHIR). Target bagian ini: MINIMAL 1500 KATA LATIN.
    Bagian ini mencakup 3 bab:

    BAB 5: FATWA & PANDANGAN ULAMA SALAF/KONTEMPORER (MINIMAL 8 paragraf panjang, total ~600 kata Latin)
    Paparkan secara terperinci pandangan masing-masing ulama berikut (setiap ulama MINIMAL 1 paragraf panjang 4-6 kalimat):
    - Syaikh Abdul Aziz bin Baz rahimahullah
    - Syaikh Muhammad bin Shalih Al-Utsaimin rahimahullah
    - Syaikh Muhammad Nashiruddin Al-Albani rahimahullah
    - Syaikh Shalih bin Fauzan Al-Fauzan hafizhahullah
    - Keputusan Lajnah Da'imah lil Ifta (jika ada fatwa terkait)
    Jika ada ucapan ulama dalam bahasa Arab, pisahkan ke paragraf type: arabic.

    BAB 6: HUKUM CABANG & STUDI KASUS KONTEMPORER (MINIMAL 8 paragraf panjang, total ~500 kata Latin)
    Bahas secara mendalam:
    - Hukum-hukum turunan/cabang dari topik utama (minimal 3 hukum cabang, masing-masing 1-2 paragraf).
    - Studi kasus kontemporer: contoh nyata implementasi di kehidupan masa kini (minimal 2 kasus).
    - Panduan praktis bagi umat Islam dalam mengamalkan topik ini.

    BAB 7: KESIMPULAN & PENUTUP (MINIMAL 4 paragraf panjang, total ~400 kata Latin)
    - Rangkum seluruh pembahasan dari Bab 1 hingga Bab 6 secara komprehensif.
    - Sampaikan nasihat dan motivasi penutup.
    - Paragraf TERAKHIR WAJIB berisi sumber: "Diringkas dari buku [Nama Buku/Kitab/Fatwa], karya [Nama Penulis / Lembaga]".

    PENTING: Output WAJIB JSON murni HANYA BERISI ARRAY PARAGRAPHS:
    {
      "paragraphs": [
        { "type": "latin", "text": "...", "bold": true, "align": "center" },
        { "type": "latin", "text": "[paragraf panjang 4-6 kalimat]", "bold": false, "align": "justify" },
        { "type": "arabic", "text": "...", "bold": false, "align": "right" }
      ]
    }
  `;

  // Fungsi hitung jumlah kata Latin dari array paragraphs
  const countLatinWords = (paragraphs: ArticleParagraph[]): number => {
    return paragraphs
      .filter(p => p.type === 'latin')
      .reduce((total, p) => total + p.text.split(/\s+/).filter(w => w.length > 0).length, 0);
  };

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      // === TAHAP 1: Pendahuluan & Definisi ===
      console.log(`[Tahap 1/3] Membuat Pendahuluan & Definisi dengan ${modelName}...`);
      const part1 = await generateArticlePart(ai, modelName, part1Prompt);
      console.log(`[Tahap 1/3] Selesai. Paragraf: ${part1.paragraphs?.length || 0}`);
      
      // Jeda 5 detik antar panggilan untuk menghormati RPM limit (14 RPM = ~4.3 detik antar request)
      await rateLimitDelay(5000);

      // === TAHAP 2: Dalil Al-Qur'an & Hadits ===
      console.log(`[Tahap 2/3] Membuat Dalil Al-Qur'an & Hadits dengan ${modelName}...`);
      const part2 = await generateArticlePart(ai, modelName, part2Prompt);
      console.log(`[Tahap 2/3] Selesai. Paragraf: ${part2.paragraphs?.length || 0}`);
      
      await rateLimitDelay(5000);

      // === TAHAP 3: Fatwa, Studi Kasus & Kesimpulan ===
      console.log(`[Tahap 3/3] Membuat Fatwa, Studi Kasus & Kesimpulan dengan ${modelName}...`);
      const part3 = await generateArticlePart(ai, modelName, part3Prompt);
      console.log(`[Tahap 3/3] Selesai. Paragraf: ${part3.paragraphs?.length || 0}`);

      // Gabungkan semua paragraf
      let allParagraphs: ArticleParagraph[] = [
        ...(part1.paragraphs || []),
        ...(part2.paragraphs || []),
        ...(part3.paragraphs || [])
      ];

      let totalWords = countLatinWords(allParagraphs);
      console.log(`[Validasi] Total kata Latin: ${totalWords}, Total paragraf: ${allParagraphs.length}`);

      // === TAHAP EKSPANSI: Jika kurang dari 3500 kata, tambah konten (maks 2 kali ekspansi) ===
      // Budget: maks 5 panggilan total (3 utama + 2 ekspansi) = aman di bawah 14 RPM
      // Token: 5 × ~20K = ~100K total, aman di bawah 205K TPM
      let expansionAttempt = 0;
      const MAX_EXPANSIONS = 2;

      while (totalWords < 3500 && expansionAttempt < MAX_EXPANSIONS) {
        expansionAttempt++;
        await rateLimitDelay(5000); // Jeda sebelum ekspansi

        const kekurangan = 3500 - totalWords;
        console.log(`[Ekspansi ${expansionAttempt}/${MAX_EXPANSIONS}] Kata baru ${totalWords}/3500 (kurang ~${kekurangan}). Meminta AI menulis tambahan...`);

        const expansionPrompt = `
          ${baseRules}
          Artikel tentang topik "${topic}" SUDAH ditulis tetapi MASIH KURANG PANJANG.
          Status: baru ${totalWords} kata Latin, butuh minimal 3500 kata, kurang ~${kekurangan} kata lagi.
          
          Tugas Anda: Tulis TAMBAHAN konten BARU untuk memperpanjang artikel. JANGAN mengulang yang sudah ada.
          Anda WAJIB menambahkan dari opsi berikut (pilih yang paling relevan dan belum dibahas):
          - Faedah-faedah tambahan dari topik "${topic}" yang belum dibahas
          - Penjelasan lebih mendalam tentang implementasi praktis di kehidupan sehari-hari
          - Adab-adab terkait topik yang belum disebutkan
          - Kisah atau atsar salaf yang shahih terkait topik
          - Hukum-hukum cabang tambahan dan studi kasus
          - Dalil-dalil tambahan (ayat/hadits) beserta penjelasan panjangnya
          
          Target: Tulis MINIMAL ${Math.max(kekurangan, 800)} KATA LATIN.
          SETIAP paragraf WAJIB panjang (4-6 kalimat, ~100-200 kata).

          Output WAJIB JSON murni:
          {
            "paragraphs": [
              { "type": "latin", "text": "...", "bold": true, "align": "center" },
              { "type": "latin", "text": "[paragraf panjang 4-6 kalimat]", "bold": false, "align": "justify" },
              { "type": "arabic", "text": "...", "bold": false, "align": "right" }
            ]
          }
        `;
        
        try {
          const expansion = await generateArticlePart(ai, modelName, expansionPrompt);
          if (expansion.paragraphs?.length > 0) {
            // Sisipkan sebelum kesimpulan (cari paragraf bold terakhir yang berisi "Kesimpulan")
            let insertIndex = allParagraphs.length;
            for (let i = allParagraphs.length - 1; i >= Math.max(0, allParagraphs.length - 10); i--) {
              if (allParagraphs[i].bold && allParagraphs[i].text.toLowerCase().includes('kesimpulan')) {
                insertIndex = i;
                break;
              }
            }
            // Fallback: sisipkan sebelum 5 paragraf terakhir
            if (insertIndex === allParagraphs.length) {
              insertIndex = Math.max(0, allParagraphs.length - 5);
            }

            allParagraphs.splice(insertIndex, 0, ...expansion.paragraphs);
            totalWords = countLatinWords(allParagraphs);
            console.log(`[Ekspansi ${expansionAttempt}] +${expansion.paragraphs.length} paragraf. Total kata sekarang: ${totalWords}`);
          }
        } catch (exErr: any) {
          console.warn(`[Ekspansi ${expansionAttempt}] Gagal: ${exErr.message}. Melanjutkan dengan konten yang ada.`);
          break; // Jangan coba ekspansi lagi jika gagal
        }
      }

      console.log(`[Selesai] Artikel final: ${totalWords} kata Latin, ${allParagraphs.length} paragraf.`);

      return {
        title: part1.title || "Artikel Dakwah Kajian Islam",
        paragraphs: allParagraphs
      };

    } catch (e: any) {
      lastError = e;
      const msg = (e.message || String(e)).toLowerCase();
      
      if (msg.includes('404') || msg.includes('not found')) {
        console.warn(`[Gemini Fallback] Model ${modelName} tidak ditemukan. Beralih model...`);
        continue;
      }

      console.warn(`[Gemini Fallback] Model ${modelName} gagal. Error: ${e.message}`);
    }
  }

  throw new Error(lastError?.message || "Semua model AI gagal memproses artikel secara keseluruhan.");
};

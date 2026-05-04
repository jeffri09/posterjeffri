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

export const generateArticleContent = async (
  topic: string, 
  reference?: string,
  onProgress?: (percent: number, message: string) => void
): Promise<ArticleContent> => {
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
    1. Takhrij Hadits WAJIB Shahih (Bukhari dan Muslim dll). DILARANG menggunakan hadits dha'if atau maudhu'. Jika tidak ada hadits spesifik, gunakan hadits keumuman syariat.
    2. Rujukan WAJIB merujuk pada: Sahabat, Tabi'in, Ulama Salaf, Ibnu Taimiyah, Ibnul Qayyim, Syaikh Bin Baz, Syaikh Al-Albani, Syaikh Al-Utsaimin, Syaikh Shalih al-Fauzan, Lajnah Da'imah, dan kitab-kitab tafsir mu'tabar.
    3. Teks Al-Qur'an (Arab) WAJIB rasm Utsmani dan teks Hadits WAJIB teks asli Arabnya.
    4. REFERENSI DALIL GANDA: WAJIB mencantumkan referensi dalil di AKHIR TEKS ARAB (dengan huruf latin) dan di AKHIR TEKS TERJEMAHAN.
    5. KUTIPAN & FOOTNOTE HARUS FAKTUAL: JANGAN PERNAH MENGARANG ANGKA JILID/HALAMAN ATAU NOMOR HADITS. Jika Anda tidak yakin 100% dengan nomor/halamannya, CUKUP SEBUTKAN NAMA KITAB DAN BAB PEMBAHASAN ATAU NAMA PENGARANGNYA SAJA. DILARANG MENGARANG REFERENSI YANG TIDAK ADA HUBUNGANNYA DENGAN TOPIK.

    ATURAN MENULIS PARAGRAF & PENCAPAIAN PANJANG ARTIKEL:
    - Pisahkan teks Arab dan teks Latin ke dalam objek 'paragraphs' yang BERBEDA.
    - Gunakan properti "bold": true untuk sub-judul.
    - Gunakan properti "align": "center" untuk judul bagian, "justify" untuk paragraf biasa, dan "right" untuk arabic.
    - FOKUS PADA DALIL & ATSAR: Untuk mencapai target panjang 4000 kata, PERBANYAK jumlah dalil Al-Qur'an, Hadits, Atsar Sahabat, dan perkataan Ulama Salaf (beserta teks Arabnya). 
    - DILARANG KERAS memperpanjang artikel dengan opini pribadi, karangan bebas, atau retorika latin yang bertele-tele. Artikel harus terasa seperti kitab ulama salaf yang padat dengan nukilan (qola Allah, qola Rasul, qola ulama).
    - Untuk setiap poin yang dibahas, WAJIB jelaskan: (a) konteksnya, (b) dalil pendukung (Arab & terjemah), (c) penjelasan ulama (syarah/tafsir asli), (d) kesimpulan faedahnya.
  `;

  const part1Prompt = `
    ${baseRules}
    Tugas Anda SEKARANG: Buat BAGIAN PERTAMA (dari 3 bagian). Target bagian ini: MINIMAL 1300 KATA LATIN.
    Bagian ini mencakup 2 bab:

    BAB 1: PENDAHULUAN (Fokus pada pengantar ilmiah)
    Bahas secara mendalam namun padat dengan rujukan kebenaran:
    - Kondisi umat Islam hari ini terkait topik "${topic}" dan fenomena penyimpangan yang terjadi.
    - Urgensi dan latar belakang mengapa topik ini sangat penting untuk dibahas secara ilmiah.
    - Gambaran umum bagaimana para ulama salaf memandang topik ini (sertakan nukilan perkataan ulama jika ada).
    - Tujuan penulisan artikel ini dan manfaatnya bagi pembaca.

    BAB 2: DEFINISI & HAKIKAT (Kutip pendapat para ulama bahasa dan syar'i)
    Jelaskan secara menyeluruh:
    - Definisi secara bahasa (etimologi/lughawi) dengan akar kata Arabnya.
    - Definisi secara istilah (terminologi/ishtilahi) menurut penjelasan para ulama (sertakan teks Arab kutipannya).
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

    BAB 3: DALIL AL-QUR'AN & TAFSIR RINCI (Kutip SEBANYAK MUNGKIN ayat yang relevan, MINIMAL 7-10 ayat)
    Struktur PER AYAT (ulangi untuk setiap ayat):
    1. Paragraf sub-judul ayat (bold, center)
    2. Teks Arab ayat dengan rasm Utsmani (type: arabic, align: right) — akhiri dengan referensi latin "(QS. Nama Surat: Ayat)"
    3. Paragraf terjemahan ayat dalam bahasa Indonesia (type: latin, justify)
    4. Paragraf penjelasan tafsir, MENGUTIP LANGSUNG perkataan ahli tafsir (seperti Ibnu Katsir, As-Sa'di, dll) tanpa mengarang nomor halaman.
    5. Paragraf faedah dan pelajaran ringkas dari ayat tersebut.

    BAB 4: DALIL HADITS & SYARAH RINCI (Kutip SEBANYAK MUNGKIN hadits shahih, MINIMAL 7-10 hadits)
    Struktur PER HADITS (ulangi untuk setiap hadits):
    1. Paragraf sub-judul hadits (bold, center)
    2. Teks Arab matan hadits (type: arabic, align: right) — akhiri dengan referensi latin "(HR. Bukhari / Muslim / dll)"
    3. Paragraf terjemahan hadits (type: latin, justify)
    4. Paragraf syarah/penjelasan hadits, MENGUTIP LANGSUNG penjelasan ulama dari kitab syarah (seperti Fathul Bari, Syarah Nawawi, dll).

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

    BAB 5: ATSAR SALAF & PANDANGAN ULAMA (Kutip BANYAK Atsar Sahabat, Tabi'in, dan Ulama)
    Paparkan secara terperinci pandangan para ulama berikut beserta TEKS ARAB ucapan mereka jika memungkinkan:
    - Perkataan Sahabat Nabi dan Tabi'in yang relevan dengan topik.
    - Perkataan ulama salaf terdahulu (Imam Ahmad, Syafi'i, Ibnu Taimiyah, Ibnul Qayyim, dll).
    - Fatwa ulama kontemporer (Syaikh Bin Baz, Syaikh Al-Utsaimin, Syaikh Al-Albani, Syaikh Shalih Al-Fauzan, Lajnah Da'imah).
    *Setiap kutipan WAJIB menyertakan nama ulama atau kitab, JANGAN mengarang nomor halaman jika tidak yakin. Pisahkan ucapan Arab ke paragraf type: arabic.

    BAB 6: HUKUM CABANG & STUDI KASUS (Berdasarkan Fatwa Ulama)
    Bahas secara ilmiah dan berlandaskan dalil:
    - Hukum-hukum turunan/cabang dari topik utama (minimal 3 hukum cabang).
    - Studi kasus kontemporer: contoh nyata implementasi di kehidupan masa kini (minimal 2 kasus).
    - Panduan praktis bagi umat Islam dalam mengamalkan topik ini sesuai sunnah.

    BAB 7: KESIMPULAN & PENUTUP
    - Rangkum seluruh poin dalil dari Bab 1 hingga Bab 6.
    - Sampaikan nasihat dan motivasi penutup bersandarkan dalil.
    - Paragraf TERAKHIR WAJIB berisi "Daftar Rujukan" yang SANGAT LENGKAP, PROFESIONAL, dan DAPAT DIPERTANGGUNGJAWABKAN berdasarkan apa yang benar-benar Anda kutip di bagian sebelumnya.
    - Format Rujukan (WAJIB DIIKUTI TAPI JANGAN MENGARANG DATA):
      1. Tafsir: Sebutkan Nama Kitab, Penulis (Misal: Tafsir Al-Qur'an Al-'Azhim karya Ibnu Katsir).
      2. Hadits: Sebutkan kitab asal (Kutub as-Sittah dll), periwayat, status derajat hadits (shahih/hasan), dan kitab syarah yang digunakan (Misal: Fathul Bari Syarah Shahih Al-Bukhari karya Ibnu Hajar Al-Asqalani).
      3. Kitab/Buku Ulama: Sebutkan Judul Kitab/Buku, Nama Penulis, dan (HANYA JIKA ANDA TAHU DATA VALIDNYA) Penerbit atau pentahqiq-nya.
    - ATURAN KETAT RUJUKAN: DATA HARUS 100% VALID. JANGAN PERNAH mengarang nama penerbit, mengarang halaman, atau mencantumkan kitab fiktif. Jika Anda tidak yakin dengan detail penerbitnya, cukup cantumkan Judul Kitab dan Penulis aslinya.

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
      if (onProgress) onProgress(10, `[1/3] Menyusun Pendahuluan & Definisi...`);
      console.log(`[Tahap 1/3] Membuat Pendahuluan & Definisi dengan ${modelName}...`);
      const part1 = await generateArticlePart(ai, modelName, part1Prompt);
      console.log(`[Tahap 1/3] Selesai. Paragraf: ${part1.paragraphs?.length || 0}`);
      
      // Jeda 5 detik antar panggilan untuk menghormati RPM limit (14 RPM = ~4.3 detik antar request)
      if (onProgress) onProgress(25, `Menunggu jeda API rate-limit...`);
      await rateLimitDelay(5000);

      // === TAHAP 2: Dalil Al-Qur'an & Hadits ===
      if (onProgress) onProgress(35, `[2/3] Menyusun Dalil Al-Qur'an & Hadits...`);
      console.log(`[Tahap 2/3] Membuat Dalil Al-Qur'an & Hadits dengan ${modelName}...`);
      const part2 = await generateArticlePart(ai, modelName, part2Prompt);
      console.log(`[Tahap 2/3] Selesai. Paragraf: ${part2.paragraphs?.length || 0}`);
      
      if (onProgress) onProgress(55, `Menunggu jeda API rate-limit...`);
      await rateLimitDelay(5000);

      // === TAHAP 3: Fatwa, Studi Kasus & Kesimpulan ===
      if (onProgress) onProgress(65, `[3/3] Menyusun Fatwa, Kasus & Kesimpulan...`);
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
        if (onProgress) onProgress(75 + (expansionAttempt * 10), `Memperpanjang artikel (Ekspansi ${expansionAttempt}/2)...`);
        await rateLimitDelay(5000); // Jeda sebelum ekspansi

        const kekurangan = 3500 - totalWords;
        console.log(`[Ekspansi ${expansionAttempt}/${MAX_EXPANSIONS}] Kata baru ${totalWords}/3500 (kurang ~${kekurangan}). Meminta AI menulis tambahan...`);

        const expansionPrompt = `
          ${baseRules}
          Artikel tentang topik "${topic}" SUDAH ditulis tetapi MASIH KURANG PANJANG.
          Status: baru ${totalWords} kata Latin, butuh minimal 3500 kata, kurang ~${kekurangan} kata lagi.
          
          Tugas Anda: Tulis TAMBAHAN konten BARU berupa KUMPULAN DALIL, ATSAR, ATAU FATWA ULAMA untuk memperpanjang artikel. JANGAN menambahkan opini atau karangan bebas latin.
          Anda WAJIB menambahkan dari opsi berikut (pilih yang belum dibahas):
          - Dalil-dalil tambahan (ayat/hadits) beserta teks Arab dan tafsir/syarahnya
          - Kisah atau atsar salaf yang shahih terkait topik beserta teks Arabnya
          - Fatwa-fatwa tambahan dari para ulama
          - Hukum-hukum cabang tambahan berlandaskan dalil
          
          Target: Tambahkan konten HINGGA mencapai panjang minimal yang diminta.
          PERBANYAK TEKS ARAB (AYAT, HADITS, PERKATAAN ULAMA) DAN TERJEMAHANNYA UNTUK MENCAPAI TARGET PANJANG INI, BUKAN DENGAN MENGARANG OPINI.

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
      if (onProgress) onProgress(100, `Selesai! Menyiapkan dokumen...`);

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

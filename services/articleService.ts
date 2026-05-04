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

export interface ArticleStats {
  totalLatinWords: number;
  totalEffectiveWords: number;
  totalParagraphs: number;
  ayatCount: number;
  haditsCount: number;
  ulamaQuoteCount: number;
  dalilRatio: number;
}

export interface ArticleContent {
  title: string;
  paragraphs: ArticleParagraph[];
  stats?: ArticleStats;
}

// Jeda antar panggilan API untuk menghormati limit RPM free tier
const rateLimitDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ═══ HELPER: Validasi struktur JSON paragraf dari AI ═══
const validateAndCleanParagraphs = (data: any): ArticleParagraph[] => {
  const paragraphs = data?.paragraphs;
  if (!paragraphs || !Array.isArray(paragraphs)) {
    throw new Error("Respons AI tidak mengandung array 'paragraphs' yang valid.");
  }
  return paragraphs.filter((p: any) => {
    if (!p.type || !['latin', 'arabic'].includes(p.type)) return false;
    if (!p.text || typeof p.text !== 'string' || p.text.trim().length === 0) return false;
    const lower = p.text.toLowerCase().trim();
    if (lower.startsWith('headline:') || lower.startsWith('nasihat:') || lower.startsWith('dalil:')) return false;
    return true;
  }).map((p: any) => ({
    type: p.type as 'latin' | 'arabic',
    text: p.text.trim(),
    bold: p.bold === true,
    align: ['left', 'center', 'right', 'justify'].includes(p.align) ? p.align : (p.type === 'arabic' ? 'right' : 'justify'),
  }));
};

// ═══ HELPER: Ekstrak konteks dari bagian sebelumnya untuk chain context ═══
const extractChainContext = (paragraphs: ArticleParagraph[]): { topics: string[], dalilUsed: string[] } => {
  const topics: string[] = [];
  const dalilUsed: string[] = [];
  for (const p of paragraphs) {
    if (p.bold && p.type === 'latin') topics.push(p.text);
    const text = p.text;
    const qsMatches = text.match(/QS\.\s*[A-Za-z'\-]+[\s:]*\d+/g);
    if (qsMatches) dalilUsed.push(...qsMatches);
    const hrMatches = text.match(/HR\.\s*[A-Za-z'\-]+/g);
    if (hrMatches) dalilUsed.push(...hrMatches);
  }
  return { topics, dalilUsed: [...new Set(dalilUsed)] };
};

// ═══ HELPER: Hitung kata efektif (Latin + kontribusi Arab ke halaman) ═══
const countEffectiveWords = (paragraphs: ArticleParagraph[]): number => {
  return paragraphs.reduce((total, p) => {
    const words = p.text.split(/\s+/).filter(w => w.length > 0).length;
    return total + (p.type === 'arabic' ? Math.round(words * 1.8) : words);
  }, 0);
};

// ═══ HELPER: Hitung statistik kualitas artikel ═══
const computeStats = (paragraphs: ArticleParagraph[]): ArticleStats => {
  let ayatCount = 0, haditsCount = 0, ulamaQuoteCount = 0, dalilParas = 0;
  for (const p of paragraphs) {
    const t = p.text;
    const qs = t.match(/QS\./g); if (qs) ayatCount += qs.length;
    const hr = t.match(/HR\./g); if (hr) haditsCount += hr.length;
    if (/(?:rahimahullah|hafizhahullah|berkata|berfatwa|menafsirkan)/i.test(t)) ulamaQuoteCount++;
    if (p.type === 'arabic') dalilParas++;
  }
  const totalLatinWords = paragraphs.filter(p => p.type === 'latin').reduce((s, p) => s + p.text.split(/\s+/).filter(w => w.length > 0).length, 0);
  return {
    totalLatinWords, totalEffectiveWords: countEffectiveWords(paragraphs),
    totalParagraphs: paragraphs.length, ayatCount, haditsCount, ulamaQuoteCount,
    dalilRatio: paragraphs.length > 0 ? Math.round((dalilParas / paragraphs.length) * 100) : 0,
  };
};

const generateArticlePart = async (
  ai: any,
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<any> => {
  let retries = 3;
  let lastError: any = null;
  let backoffMs = 5000; // Mulai dari 5 detik

  while (retries > 0) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout setelah 3 menit")), 180000);
      });
      
      const config: any = {
          responseMimeType: 'application/json',
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 16384,
      };
      if (systemInstruction) config.systemInstruction = systemInstruction;

      const fetchPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
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

  // ═══ SYSTEM INSTRUCTION — aturan ketat level sistem, lebih dihormati model ═══
  const sysInstruction = `Anda adalah seorang Ustadz bermanhaj Salaf yang ahli dalam menulis karya ilmiah dan artikel dakwah.
TARGET PEMBACA: Penuntut Ilmu (Thalibul 'Ilmi). Bahasa akademis, ilmiah, dan terstruktur rapi.

KONTEKS FORMAT: Kertas F4 (215x330mm), margin 2cm, Calibri 11pt, spasi 1.0. Target: MINIMAL 4 HALAMAN = 4000 KATA LATIN.

ATURAN KETAT:
0. DILARANG KERAS MENGARANG (HALUSINASI) ISI, FATWA, ATAU DALIL.
1. Hadits WAJIB Shahih. DILARANG hadits dha'if/maudhu'.
2. Rujukan: Sahabat, Tabi'in, Ulama Salaf, Ibnu Taimiyah, Ibnul Qayyim, Bin Baz, Al-Albani, Al-Utsaimin, Al-Fauzan, Lajnah Da'imah, kitab tafsir mu'tabar.
3. Teks Al-Qur'an WAJIB rasm Utsmani, Hadits WAJIB teks Arab asli.
4. Referensi dalil WAJIB di AKHIR TEKS ARAB (huruf latin) DAN di AKHIR TERJEMAHAN.
5. JANGAN MENGARANG angka jilid/halaman/nomor hadits. Cukup nama kitab dan pengarang saja jika tidak yakin.

ATURAN FORMAT OUTPUT:
- Pisahkan teks Arab dan Latin ke paragraf BERBEDA.
- "bold": true untuk sub-judul, "align": "center" untuk judul, "justify" untuk paragraf, "right" untuk arabic.
- FOKUS DALIL & ATSAR: Perbanyak kutipan Al-Qur'an, Hadits, Atsar, perkataan Ulama (beserta teks Arab). Kualitas dan relevansi dalil LEBIH PENTING daripada kuantitas.
- DILARANG memperpanjang dengan opini/karangan bebas. Artikel harus padat nukilan (qola Allah, qola Rasul, qola ulama).

CONTOH FORMAT BENAR:
[
  { "type": "latin", "text": "Dalil Pertama: Kewajiban Bertauhid", "bold": true, "align": "center" },
  { "type": "arabic", "text": "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ (QS. Adz-Dzariyat: 56)", "bold": false, "align": "right" },
  { "type": "latin", "text": "\\"Dan Aku tidak menciptakan jin dan manusia melainkan supaya mereka beribadah kepada-Ku.\\" (QS. Adz-Dzariyat: 56)", "bold": false, "align": "justify" },
  { "type": "latin", "text": "Imam Ibnu Katsir rahimahullah berkata dalam tafsirnya: \\"Makna ayat ini adalah bahwa Allah menciptakan makhluk agar beribadah kepada-Nya semata.\\" (Tafsir Al-Qur'an Al-'Azhim, Surat Adz-Dzariyat)", "bold": false, "align": "justify" }
]
FORMAT SALAH: Menggabung Arab+terjemah dalam 1 paragraf, menulis "menurut para ulama" tanpa nama spesifik, mengarang nomor halaman.`;

  const topicCtx = `Topik Utama: "${topic}".${reference ? `\nReferensi pengguna: "${reference}"\nEksplorasi secara maksimal.` : ''}`;

  const part1Prompt = `
    ${topicCtx}
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
      "paragraphs": [...]
    }
  `;

  // part2 dan part3 prompt dibangun DINAMIS setelah bagian sebelumnya selesai (chain context)
  // Ini mencegah pengulangan dalil dan menjaga konsistensi gaya

  const jsonOutputNote = `PENTING: Output WAJIB JSON murni: { "paragraphs": [...] }`;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      // === TAHAP 1: Pendahuluan & Definisi ===
      if (onProgress) onProgress(5, `[1/5] Menyusun Pendahuluan & Definisi...`);
      console.log(`[Tahap 1/5] Membuat Pendahuluan & Definisi dengan ${modelName}...`);
      const part1Raw = await generateArticlePart(ai, modelName, part1Prompt, sysInstruction);
      const part1Paras = validateAndCleanParagraphs(part1Raw);
      console.log(`[Tahap 1/5] Selesai. Paragraf: ${part1Paras.length}`);

      if (onProgress) onProgress(15, `Menunggu jeda API...`);
      await rateLimitDelay(5000);

      // === TAHAP 2: Dalil Al-Qur'an & Hadits (dengan chain context dari part1) ===
      const ctx1 = extractChainContext(part1Paras);
      const part2Prompt = `${topicCtx}
    KONTEKS BAGIAN SEBELUMNYA (JANGAN ULANGI):
    - Bab yang sudah ditulis: ${ctx1.topics.join(', ')}
    - Dalil yang sudah digunakan: ${ctx1.dalilUsed.join(', ') || 'belum ada'}

    Tugas: Buat BAGIAN KEDUA. Target: MINIMAL 1500 KATA LATIN.

    BAB 3: DALIL AL-QUR'AN & TAFSIR RINCI
    Kutip SEMUA ayat yang BENAR-BENAR RELEVAN dengan topik (kualitas > kuantitas).
    Struktur PER AYAT: sub-judul (bold) → teks Arab (arabic, right) → terjemahan (latin, justify) → tafsir mengutip ulama → faedah.

    BAB 4: DALIL HADITS & SYARAH RINCI
    Kutip hadits-hadits shahih yang RELEVAN (kualitas > kuantitas).
    Struktur PER HADITS: sub-judul (bold) → matan Arab (arabic, right) → terjemahan (latin, justify) → syarah mengutip kitab ulama.

    ${jsonOutputNote}`;

      if (onProgress) onProgress(25, `[2/5] Menyusun Dalil Al-Qur'an & Hadits...`);
      console.log(`[Tahap 2/5] Membuat Dalil dengan chain context...`);
      const part2Raw = await generateArticlePart(ai, modelName, part2Prompt, sysInstruction);
      const part2Paras = validateAndCleanParagraphs(part2Raw);
      console.log(`[Tahap 2/5] Selesai. Paragraf: ${part2Paras.length}`);

      if (onProgress) onProgress(35, `Menunggu jeda API...`);
      await rateLimitDelay(5000);

      // === TAHAP 3: Fatwa, Studi Kasus & Kesimpulan (chain context, TANPA rujukan) ===
      const ctx2 = extractChainContext([...part1Paras, ...part2Paras]);
      const part3Prompt = `${topicCtx}
    KONTEKS BAGIAN SEBELUMNYA (JANGAN ULANGI):
    - Bab yang sudah ditulis: ${ctx2.topics.join(', ')}
    - Dalil yang sudah digunakan: ${ctx2.dalilUsed.join(', ')}

    Tugas: Buat BAGIAN KETIGA. Target: MINIMAL 1500 KATA LATIN.

    BAB 5: ATSAR SALAF & PANDANGAN ULAMA
    Kutip perkataan Sahabat, Tabi'in, ulama salaf (Imam Ahmad, Syafi'i, Ibnu Taimiyah, Ibnul Qayyim dll), dan fatwa ulama kontemporer (Bin Baz, Al-Utsaimin, Al-Albani, Al-Fauzan, Lajnah Da'imah). Sertakan TEKS ARAB ucapan mereka. JANGAN mengarang nomor halaman.

    BAB 6: HUKUM CABANG & STUDI KASUS
    Bahas hukum-hukum turunan (min 3), studi kasus kontemporer (min 2), panduan praktis sesuai sunnah. Berlandaskan dalil dan fatwa.

    BAB 7: KESIMPULAN & PENUTUP
    Rangkum poin-poin dalil utama. Nasihat penutup bersandarkan dalil. JANGAN buat daftar rujukan di sini (akan dibuat terpisah).

    ${jsonOutputNote}`;

      if (onProgress) onProgress(45, `[3/5] Menyusun Fatwa, Kasus & Kesimpulan...`);
      console.log(`[Tahap 3/5] Membuat Fatwa & Kesimpulan dengan chain context...`);
      const part3Raw = await generateArticlePart(ai, modelName, part3Prompt, sysInstruction);
      const part3Paras = validateAndCleanParagraphs(part3Raw);
      console.log(`[Tahap 3/5] Selesai. Paragraf: ${part3Paras.length}`);

      // Gabungkan semua paragraf
      let allParagraphs: ArticleParagraph[] = [...part1Paras, ...part2Paras, ...part3Paras];
      let totalWords = countEffectiveWords(allParagraphs);
      console.log(`[Validasi] Total kata efektif: ${totalWords}, Total paragraf: ${allParagraphs.length}`);

      // === TAHAP EKSPANSI: Jika kurang dari 3500 kata efektif ===
      if (totalWords < 3500) {
        if (onProgress) onProgress(55, `Memperpanjang artikel (ekspansi dalil)...`);
        await rateLimitDelay(5000);
        const kekurangan = 3500 - totalWords;
        const expansionPrompt = `${topicCtx}
    Artikel SUDAH ditulis tapi KURANG PANJANG (${totalWords} kata, butuh 3500).
    Tulis TAMBAHAN berupa dalil/atsar/fatwa BARU (jangan ulangi yang sudah ada).
    Dalil yang sudah digunakan: ${extractChainContext(allParagraphs).dalilUsed.join(', ')}
    Target tambahan: ~${kekurangan} kata. Perbanyak teks Arab + terjemah + syarah.
    ${jsonOutputNote}`;
        try {
          const expRaw = await generateArticlePart(ai, modelName, expansionPrompt, sysInstruction);
          const expParas = validateAndCleanParagraphs(expRaw);
          if (expParas.length > 0) {
            let insertIdx = allParagraphs.length;
            for (let i = allParagraphs.length - 1; i >= Math.max(0, allParagraphs.length - 10); i--) {
              if (allParagraphs[i].bold && allParagraphs[i].text.toLowerCase().includes('kesimpulan')) { insertIdx = i; break; }
            }
            if (insertIdx === allParagraphs.length) insertIdx = Math.max(0, allParagraphs.length - 5);
            allParagraphs.splice(insertIdx, 0, ...expParas);
            totalWords = countEffectiveWords(allParagraphs);
            console.log(`[Ekspansi] +${expParas.length} paragraf. Total kata: ${totalWords}`);
          }
        } catch (exErr: any) {
          console.warn(`[Ekspansi] Gagal: ${exErr.message}. Melanjutkan.`);
        }
      }

      // === TAHAP 4: Generate Daftar Rujukan dari konten nyata (#2) ===
      if (onProgress) onProgress(75, `[4/5] Menyusun Daftar Rujukan...`);
      await rateLimitDelay(5000);

      const articleText = allParagraphs.map(p => `[${p.type}] ${p.text}`).join('\n');
      const refPrompt = `Berikut adalah artikel lengkap yang sudah ditulis tentang "${topic}":

---
${articleText}
---

Tugas Anda: Baca artikel di atas dan KOMPILASI Daftar Rujukan berdasarkan SEMUA sumber yang BENAR-BENAR dikutip di dalamnya.

FORMAT SETIAP ENTRI RUJUKAN:
1. Al-Qur'an: Cukup satu entri "Al-Qur'an Al-Karim".
2. Hadits: "Kitab [Nama Kitab] karya [Periwayat/Penulis], derajat: Shahih" — misalnya Shahih Al-Bukhari karya Imam Al-Bukhari.
3. Tafsir: "Kitab [Nama Tafsir] karya [Penulis]" — misalnya Tafsir Al-Qur'an Al-'Azhim karya Ibnu Katsir.
4. Kitab Syarah: "Kitab [Nama] karya [Penulis]".
5. Kitab/Fatwa Ulama: "Kitab [Nama] karya [Penulis]" atau "Fatwa [Lembaga/Ulama]".

ATURAN KETAT:
- HANYA cantumkan sumber yang BENAR-BENAR muncul/dikutip dalam artikel di atas.
- JANGAN mengarang nama kitab, penerbit, atau halaman yang tidak ada dalam artikel.
- Urutkan: Al-Qur'an → Hadits → Tafsir → Kitab Ulama → Fatwa.

Output JSON: { "paragraphs": [ { "type": "latin", "text": "Daftar Rujukan", "bold": true, "align": "center" }, { "type": "latin", "text": "1. ...", "bold": false, "align": "justify" } ] }`;

      try {
        console.log(`[Tahap 4/5] Generate Daftar Rujukan dari konten nyata...`);
        const refRaw = await generateArticlePart(ai, modelName, refPrompt, sysInstruction);
        const refParas = validateAndCleanParagraphs(refRaw);
        if (refParas.length > 0) {
          allParagraphs.push(...refParas);
          console.log(`[Tahap 4/5] Selesai. +${refParas.length} paragraf rujukan.`);
        }
      } catch (refErr: any) {
        console.warn(`[Rujukan] Gagal: ${refErr.message}. Melanjutkan tanpa rujukan terpisah.`);
      }

      // === TAHAP 5: Hitung statistik kualitas (#11) ===
      if (onProgress) onProgress(90, `[5/5] Memvalidasi kualitas artikel...`);
      const stats = computeStats(allParagraphs);
      console.log(`[Selesai] Artikel final: ${stats.totalLatinWords} kata Latin, ${stats.totalEffectiveWords} kata efektif, ${stats.totalParagraphs} paragraf, ${stats.ayatCount} ayat, ${stats.haditsCount} hadits, ${stats.ulamaQuoteCount} kutipan ulama, rasio dalil ${stats.dalilRatio}%`);

      if (onProgress) onProgress(100, `Selesai! Menyiapkan dokumen...`);

      return {
        title: part1Raw.title || "Artikel Dakwah Kajian Islam",
        paragraphs: allParagraphs,
        stats,
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

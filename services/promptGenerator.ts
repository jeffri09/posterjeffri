// ═══════════════════════════════════════
// JEFFRI POSTER — Modular Prompt Generator Engine
// Composes prompt from selected techniques
// ═══════════════════════════════════════

import { PosterCategory, PosterFormData } from '../types';
import { TECHNIQUE_GENERATORS } from './promptTechniques';

/**
 * Generates the core layout/rules section that is ALWAYS included
 * regardless of which techniques are selected.
 */
const generateCoreRules = (data: PosterFormData): string => {
  const d = (val: string | undefined, fb: string) => val?.trim() || fb;

  return `
════════════════════════════════════
ATURAN MUTLAK — TIDAK BOLEH DILANGGAR
════════════════════════════════════
❌ DILARANG KERAS menampilkan:
   - Manusia, wajah, tangan, tubuh (dalam bentuk apapun)
   - Hewan atau makhluk hidup apapun
   - Simbol agama selain Islam
   - Elemen klise: bulan-bintang besar, Ka'bah ilustratif
   - Teks selain yang tertera dalam hierarki konten

✅ WAJIB menggunakan elemen visual:
   - Geometri Islami (pola arabesque, tessellation, girih)
   - Tekstur alam non-makhluk: batu marmer, kayu, air tenang, pasir, kain linen, keramik
   - Cahaya & bayangan abstrak (godrays, warm light, soft bokeh halus, lens flare halus)
   - Motif kaligrafi sebagai elemen dekoratif (bukan konten utama)
   - Ruang kosong (negative space) yang luas agar teks bernafas

════════════════════════════════════
ATURAN LOGO
════════════════════════════════════
File: logo.png
- Posisi: POJOK KANAN ATAS
- Scale: Proporsional, tidak boleh diubah bentuk atau warna
- Hanya ukuran yang boleh disesuaikan

════════════════════════════════════
SPESIFIKASI TEKNIS
════════════════════════════════════
- Resolusi: 3280 x 4096 pixel (Rasio 4:5 / Portrait)
- Kualitas: High resolution, hyper-realistic texture, professional lighting
- Style: Minimalis Elegan — sedikit elemen, kualitas tinggi
- Komposisi: Clean, balanced, tidak penuh sesak

PALET WARNA:
${d(data.colorPalette, "- Dominan: Hijau Zamrud Tua (#1B4332) atau Emas Gelap (#B8860B)\n- Aksen: Putih Bersih (#FFFFFF) dan Krem (#FAF7F2)\n- Brand Footer: Biru Tua (#0E2F73)\n- Mood: Hangat, menenangkan, penuh harapan")}

TIPOGRAFI:
- Headline: Serif Bold / Slab Serif — kesan otoritatif dan tegas
- Narasi: Sans-Serif ringan — mudah dibaca, terasa lembut
- Arab: Font khusus Arabic yang jelas (karakter Uthmanic/Naskh)
- ATURAN: Headline minimal 3x lebih besar dari narasi

════════════════════════════════════
LAYOUT ZONES (WAJIB DIIKUTI)
════════════════════════════════════
┌──────────────────────────────┐
│  [Zone A] Logo + Margin 10%  │
├──────────────────────────────┤
│                              │
│  [Zone B] Konten Utama  55%  │
│  Headline + Narasi + Dalil   │
│                              │
├──────────────────────────────┤
│  [Zone C] Visual Accent  25% │
│  Background pattern/tekstur  │
│  "mengintip" di balik konten │
├──────────────────────────────┤
│  [Zone D] Footer Strip  10%  │
└──────────────────────────────┘

MARGIN: Minimal 120px di semua sisi. Tidak ada elemen menyentuh tepi 
kecuali footer strip.

════════════════════════════════════
HIERARKI KONTEN TEKS (URUTAN WAJIB)
════════════════════════════════════

[1] HEADLINE — Paling Dominan
"${d(data.title, "[Judul Poster]")}"
→ Font Serif Bold, ukuran terbesar, warna sesuai palet aksen (putih/emas/krem)
→ Tambahkan garis emas tipis di bawah headline sebagai pemisah elegan

[2] NARASI — Ukuran Sedang
"${d(data.advice, "[Isi Nasihat]")}"
→ Font Sans-Serif, warna terang sesuai palet, line-height lega

[3] DALIL — Ayat/Hadits & Terjemahan
Arab:
"${d(data.quoteArabic, "[Teks Arab]")}"
→ Font Arabic Naskh/Uthmanic, jelas dan besar, rata tengah

Terjemahan:
"${d(data.quoteTranslation, "[Terjemahan]")}"
→ Font Sans-Serif italic, warna terang sesuai palet, ukuran lebih kecil dari Arab

[4] SIGNATURE ELEMENT (Delight Factor)
→ Satu ornamen arabesque halus atau pola geometri islami 
   di sudut bawah kiri, opacity 15-20%, sebagai aksen premium.
→ Tidak boleh mendominasi atau mengganggu keterbacaan teks.

════════════════════════════════════
VISUAL BACKGROUND
════════════════════════════════════
Deskripsi: ${d(data.visualContext, "Permukaan marmer hijau tua dengan urat-urat emas alami, diterangi cahaya pagi yang masuk dari samping kiri (soft godrays), menciptakan gradasi dari terang ke gelap secara halus. Di sudut tertentu terdapat pola geometri islami yang terukir sangat halus — seperti relief batu — dengan kedalaman tekstur yang terasa nyata.")}

Atmosfer: Tenang, mewah, penuh harapan, dan berwibawa.
Tidak ada makhluk hidup dalam frame manapun.
Tidak ada benda spesifik lainnya yang bisa mengalihkan perhatian dari teks.

════════════════════════════════════
ATURAN FOOTER (WAJIB — SELALU TAMPIL)
════════════════════════════════════
- Visual: Strip putih horizontal solid, full width, bagian paling bawah
- Warna teks: Biru Tua (#0E2F73) — kontras maksimal di atas putih
- Konten (rata tengah / centered):
  [Ikon IG] @kuncikebaikantv  
  [Ikon FB] Yayasan Kunci Kebaikan OKU Timur  
  [Ikon Web] www.kuncikebaikan.com
- Ikon: Gunakan ikon sosial media flat/outline yang bersih
- Tinggi strip footer: cukup untuk teks terbaca nyaman (±180–220px)`;
};

/**
 * Main prompt generator function.
 * Composes the final prompt by combining selected technique sections
 * with the core rules section.
 */
export const generatePosterPrompt = (
  category: PosterCategory,
  data: PosterFormData,
  selectedTechniques: string[] = ['role-context', 'instruction', 'zero-shot'],
  _encryptOutput: boolean = false
): string => {
  const parts: string[] = [];

  // --- Header ---
  parts.push(`╔══════════════════════════════════════════════╗
║  JEFFRI POSTER — Prompt Poster Dakwah Salaf  ║
║  Teknik Aktif: ${selectedTechniques.length} / ${Object.keys(TECHNIQUE_GENERATORS).length}                          ║
╚══════════════════════════════════════════════╝`);

  // --- Generate technique sections in order ---
  // We follow a logical order: reasoning → generation → optimization → validation
  const techniqueOrder = [
    // Reasoning first
    'role-context', 'step-back', 'cot', 'react', 'tot', 'got',
    // Then generation
    'few-shot', 'zero-shot', 'scamper', 'persona-problem', 'what-if',
    'generate-knowledge', 'rag', 'directional-stimulus',
    // Then optimization
    'instruction', 'meta-prompting', 'least-to-most',
    'skeleton-of-thought', 'prompt-chaining', 'pal', 'active-prompt',
    // Then validation
    'self-consistency', 'reflexion', 'competitive-gap', 'reverse-engineering',
  ];

  for (const id of techniqueOrder) {
    if (selectedTechniques.includes(id) && TECHNIQUE_GENERATORS[id]) {
      parts.push(TECHNIQUE_GENERATORS[id](data));
    }
  }

  // --- Core rules always included ---
  parts.push(generateCoreRules(data));

  // --- Footer instruction ---
  parts.push(`
════════════════════════════════════
OUTPUT INSTRUCTION
════════════════════════════════════
Gabungkan SEMUA instruksi di atas menjadi SATU poster visual yang kohesif.
Hasilkan SATU gambar poster dengan semua elemen yang telah ditentukan.
Jangan membuat variasi — langsung hasilkan versi TERBAIK.`);

  return parts.join('\n');
};
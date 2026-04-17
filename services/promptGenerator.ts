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
ATURAN MUTLAK
════════════════════════════════════
❌ DILARANG:
   - Wajah realistis, foto manusia/hewan realistis
   - Simbol agama selain Islam
   - Teks selain yang tertera dalam hierarki konten

⚠️ ATURAN MAKHLUK BERNYAWA:
   - BOLEH menampilkan manusia/hewan dalam gaya KARTUN TANPA WAJAH
   - Wajah KOSONG (tanpa mata, hidung, mulut) — hanya siluet/bentuk tubuh
   - Gaya: Ilustrasi minimalis, flat design, atau watercolor
   - Gunakan HANYA jika topik memerlukan (birrul walidain, persaudaraan, sedekah, dll)

✅ VISUAL ADAPTIF SESUAI TOPIK:
   - Pilih elemen visual yang RELEVAN dengan topik poster
   - Contoh: Api untuk neraka, taman untuk surga, hujan untuk rahmat
   - Desain PROFESIONAL dan PREMIUM — bukan generik
   - Geometri islami OPSIONAL — gunakan hanya jika cocok dengan topik
   - Ruang kosong (negative space) agar teks mudah dibaca

════════════════════════════════════
LOGO & SPESIFIKASI TEKNIS
════════════════════════════════════
Logo: logo.png — Pojok kanan atas, proporsional
Resolusi: 3280 x 4096 pixel (4:5 Portrait)
Kualitas: High resolution, professional lighting
Style: Premium & modern — desain mendukung penyampaian pesan dakwah

PALET WARNA:
${d(data.colorPalette, "- Dominan: Sesuai topik\\n- Aksen: Sesuai mood\\n- Brand Footer: Biru Tua (#0E2F73)\\n- Mood: Sesuai pesan dakwah")}

TIPOGRAFI:
- Headline: Serif Bold — kesan otoritatif, minimal 3x lebih besar dari narasi
- Narasi: Sans-Serif ringan — mudah dibaca
- Arab: Font Naskh/Uthmanic yang jelas

════════════════════════════════════
LAYOUT ZONES
════════════════════════════════════
┌──────────────────────────────┐
│  [Zone A] Logo + Margin 10%  │
├──────────────────────────────┤
│  [Zone B] Konten Utama  55%  │
│  Headline + Narasi + Dalil   │
├──────────────────────────────┤
│  [Zone C] Visual Accent  25% │
├──────────────────────────────┤
│  [Zone D] Footer Strip  10%  │
└──────────────────────────────┘
MARGIN: Minimal 120px semua sisi.

════════════════════════════════════
HIERARKI KONTEN
════════════════════════════════════
[1] HEADLINE: "${d(data.title, "[Judul Poster]")}"
→ Font Serif Bold, ukuran terbesar, warna aksen

[2] NASIHAT: "${d(data.advice, "[Isi Nasihat]")}"
→ Font Sans-Serif, warna terang

[3] DALIL:
Arab: "${d(data.quoteArabic, "[Teks Arab]")}"
Terjemahan: "${d(data.quoteTranslation, "[Terjemahan]")}"

════════════════════════════════════
VISUAL BACKGROUND
════════════════════════════════════
${d(data.visualContext, "Visual yang sesuai dengan topik poster — desain profesional dan mendukung penyampaian pesan dakwah.")}

════════════════════════════════════
FOOTER (WAJIB)
════════════════════════════════════
Strip putih horizontal, full width, paling bawah.
Warna teks: Biru Tua (#0E2F73)
Konten: [IG] @kuncikebaikantv | [FB] Yayasan Kunci Kebaikan OKU Timur | [Web] www.kuncikebaikan.com`;
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
// ═══════════════════════════════════════
// JEFFRI POSTER — Prompt Technique Implementations
// Each technique generates a section of the final prompt
// ═══════════════════════════════════════

import { PosterFormData } from '../types';

// --- Helper: get data with fallback ---
const d = (val: string | undefined, fallback: string) => val?.trim() || fallback;

// ══════════════════════════════════════════════
// REASONING TECHNIQUES
// ══════════════════════════════════════════════

export const techniqueRoleContext = (data: PosterFormData): string => `
ROLE: Anda adalah DUA persona sekaligus:
1. **Ustadz bermanhaj Salaf** — ahli tafsir Al-Qur'an, hafal ribuan hadits shahih, memahami aqidah Ahlus Sunnah wal Jamaah sesuai pemahaman Salafush Shalih (Sahabat, Tabi'in, Tabi'ut Tabi'in). Referensi utama: Kitab Tauhid (Muhammad bin Abdul Wahhab), Riyadhus Shalihin (Imam Nawawi), Shahih Bukhari, Shahih Muslim.
2. **Art Director & Visual Designer Premium** — spesialis branding Islami level editorial/museum-grade dengan 20+ tahun pengalaman dalam desain poster dakwah berkelas internasional.

CONTEXT: Anda sedang membuat poster dakwah visual untuk lembaga sosial Islam "Yayasan Kunci Kebaikan" yang bergerak di bidang dakwah, pendidikan, dan kemanusiaan. Target audiens: Muslim Indonesia segala usia. Poster akan dicetak dalam ukuran besar dan juga dishare di media sosial.`;

export const techniqueChainOfThought = (data: PosterFormData): string => `
═══ CHAIN OF THOUGHT — Alur Berpikir Sistematis ═══
Sebelum membuat poster, IKUTI alur berpikir ini secara berurutan:

LANGKAH 1 — ANALISIS TOPIK:
→ Apa inti pesan dari topik "${d(data.title, '[Topik]')}"?
→ Siapa yang paling membutuhkan pesan ini?
→ Emosi apa yang ingin dibangkitkan? (Takut? Harap? Syukur? Taubat?)

LANGKAH 2 — SELEKSI DALIL (Manhaj Salaf):
→ PERTAMA: Cari Ayat Al-Qur'an yang paling relevan dan kuat
→ KEDUA: Jika perlu penguatan, cari Hadits SHAHIH (Bukhari/Muslim prioritas)
→ KETIGA: Pastikan terjemahan sesuai tafsir mu'tabar (Ibnu Katsir, As-Sa'di, Ath-Thabari)
→ KEEMPAT: Verifikasi tidak ada penafsiran yang menyimpang dari manhaj Salaf

LANGKAH 3 — FORMULASI PESAN:
→ Judul: Buat HOOK emosional dalam ≤5 kata
→ Nasihat: Buat penjelasan yang menyentuh hati dalam 2-3 kalimat
→ Pastikan koherensi: Judul ↔ Dalil ↔ Nasihat harus satu alur

LANGKAH 4 — DESAIN VISUAL:
→ Pilih visual metaphor yang merepresentasikan pesan
→ Tentukan palet warna berdasarkan mood pesan
→ Rancang komposisi yang bersih dan bernafas`;

export const techniqueTreeOfThoughts = (data: PosterFormData): string => `
═══ TREE OF THOUGHTS — Eksplorasi Multi-Path ═══
Eksplorasi 3 jalur visual sebelum memilih yang terbaik:

🌿 PATH A — MINIMALIS ELEGAN:
   Latar polos dengan tekstur premium (marmer, granite, linen)
   Fokus pada tipografi yang kuat dan ruang kosong yang luas
   Satu ornamen geometri islami sebagai aksen subtle

🏔️ PATH B — NATURE MAJESTY:
   Pemandangan alam yang agung (langit sunrise, gurun pasir, air tenang)
   Tanpa makhluk hidup — hanya kebesaran ciptaan Allah
   Gradasi cahaya alami yang dramatis

🔷 PATH C — TOPIK-DRIVEN:
   Visual yang langsung merepresentasikan topik
   Contoh: Api membara untuk neraka, taman indah untuk surga
   Kartun tanpa wajah untuk topik yang melibatkan manusia

→ PILIH path yang paling cocok dengan mood topik "${d(data.title, '[Topik]')}"
→ Atau KOMBINASIKAN elemen terbaik dari setiap path`;

export const techniqueStepBack = (data: PosterFormData): string => `
═══ STEP-BACK — Prinsip Dasar Dakwah ═══
Sebelum masuk ke detail teknis, mundur dan renungkan:

PRINSIP 1: "ادْعُ إِلَىٰ سَبِيلِ رَبِّكَ بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ"
(Serulah ke jalan Tuhanmu dengan hikmah dan pelajaran yang baik — QS. An-Nahl: 125)
→ Poster ini HARUS berdakwah dengan HIKMAH, bukan menakut-nakuti

PRINSIP 2: Dakwah yang efektif menyentuh HATI, bukan sekedar mata
→ Visual harus menguatkan pesan, bukan mengalihkan perhatian

PRINSIP 3: Kesederhanaan adalah kekuatan
→ Lebih sedikit elemen = lebih kuat dampaknya
→ Satu pesan utama, satu dalil, satu visual story`;

export const techniqueReAct = (data: PosterFormData): string => `
═══ ReAct — Reason + Act + Observe ═══
REASON: Topik "${d(data.title, '[Topik]')}" memerlukan pendekatan yang [tentukan: lembut/tegas/menghibur/memotivasi]
→ Analisis: Apa yang biasanya salah dipahami jamaah tentang topik ini?
→ Kesimpulan: Pesan kunci yang harus disampaikan

ACT: Berdasarkan reasoning di atas, buat:
→ Judul yang menantang kebiasaan berpikir jamah
→ Dalil yang paling tepat menjawab kebutuhan
→ Visual yang memperkuat emosi pesan

OBSERVE: Setelah membuat draft, evaluasi:
→ Apakah pesan sudah jelas tanpa perlu penjelasan tambahan?
→ Apakah dalil shahih dan sesuai konteks?
→ Apakah visual mendukung atau justru mengganggu?

REFINE: Perbaiki berdasarkan observasi di atas`;

export const techniqueGraphOfThoughts = (data: PosterFormData): string => `
═══ GRAPH OF THOUGHTS — Relasi Semantik ═══
Bangun jaringan hubungan antara semua elemen poster:

                    ┌─────────┐
              ┌────→│  DALIL   │←────┐
              │     └────┬────┘      │
              │          │           │
         ┌────┴───┐  ┌───┴────┐ ┌───┴────┐
         │ JUDUL  │──│ NASIHAT│ │ VISUAL │
         └────┬───┘  └───┬────┘ └───┬────┘
              │          │          │
              │     ┌────┴────┐    │
              └────→│  MOOD   │←───┘
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │  WARNA  │
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │TIPOGRAFI│
                    └─────────┘

→ Setiap elemen HARUS terhubung secara semantik
→ Warna dipilih berdasarkan MOOD, bukan acak
→ Tipografi memperkuat JUDUL, bukan sekedar dekoratif
→ Visual adalah METAFORA dari DALIL, bukan hiasan`;

// ══════════════════════════════════════════════
// GENERATION TECHNIQUES
// ══════════════════════════════════════════════

export const techniqueFewShot = (data: PosterFormData): string => `
═══ FEW-SHOT — Contoh Poster Sukses ═══
Berikut 3 contoh poster yang berhasil dan berkualitas tinggi. Gunakan sebagai REFERENSI KUALITAS:

CONTOH 1 — Topik: Sedekah
├─ Judul: "MEMBERI JUSTRU MENAMBAH"
├─ Dalil: QS. Al-Baqarah: 261 (Perumpamaan orang yang menafkahkan...)
├─ Nasihat: "Setiap rupiah yang engkau keluarkan di jalan Allah, bukan berkurang melainkan berlipat ganda pahalanya."
├─ Visual: Butiran air yang jatuh ke permukaan air tenang, menciptakan riak konsentris yang meluas — metafora kebaikan yang menyebar
└─ Warna: Hijau zamrud + Emas — Mood: Harapan, Kemakmuran

CONTOH 2 — Topik: Sabar
├─ Judul: "ALLAH BERSAMA ORANG SABAR"
├─ Dalil: QS. Al-Baqarah: 153
├─ Nasihat: "Kesabaran bukan berarti diam tanpa usaha, tapi teguh menjalani ujian sambil yakin pertolongan Allah pasti datang."
├─ Visual: Gurun pasir luas dengan satu pohon kokoh di tengah — bertahan di kondisi keras
└─ Warna: Biru langit + Silver — Mood: Ketenangan, Keteguhan

CONTOH 3 — Topik: Taubat
├─ Judul: "PINTU TAUBAT MASIH TERBUKA"
├─ Dalil: QS. Az-Zumar: 53
├─ Nasihat: "Betapapun banyak dosamu, jangan pernah berputus asa dari rahmat Allah. Dia Maha Pengampun lagi Maha Penyayang."
├─ Visual: Cahaya emas terang menembus celah sempit di antara dinding batu gelap — metafora harapan di balik kegelapan
└─ Warna: Ungu tua + Putih — Mood: Kekhusyukan, Harapan

→ BUAT poster dengan kualitas SETARA atau LEBIH BAIK dari contoh di atas`;

export const techniqueZeroShot = (data: PosterFormData): string => `
═══ ZERO-SHOT — Kreasi Murni dari Instruksi ═══
Tanpa contoh apapun, buat poster berdasarkan INSTRUKSI MURNI berikut:
→ Topik harus diinterpretasikan secara SEGAR dan ORISINAL
→ Jangan meniru pola yang sudah umum
→ Cari sudut pandang BARU yang belum pernah dipakai poster dakwah lain
→ Kejutkan pembaca dengan perspektif yang tidak terduga tapi tetap shahih`;

export const techniqueSCAMPER = (data: PosterFormData): string => `
═══ SCAMPER — Variasi Kreatif ═══
Aplikasikan metode SCAMPER untuk kreativitas visual:

S (Substitute): Ganti tekstur latar biasa → gunakan material PREMIUM (marmer Carrara, obsidian, kayu jati tua, kain sutra)
C (Combine): Gabungkan 2 elemen: geometri islami + tekstur alam = relief batu berukir pola arabesque
A (Adapt): Adaptasi teknik fotografi high-end: bokeh, golden hour lighting, depth of field
M (Modify): Ubah skala ornamen — buat SANGAT besar (full-bleed) tapi opacity rendah (8-15%)
P (Put to other use): Gunakan pola kaligrafi sebagai TEKSTUR background, bukan teks terbaca
E (Eliminate): Hapus SEMUA elemen yang tidak esensial — less is more
R (Reverse): Balik konvensi — headline di BAWAH, bukan atas. Atau visual gelap → terang (bukan sebaliknya)`;

export const techniquePersonaProblem = (data: PosterFormData): string => `
═══ PERSONA + PROBLEM-FIRST ═══
PERSONA: Bayangkan seorang Muslim Indonesia berusia 25-45 tahun:
→ Bekerja keras setiap hari, kadang lupa ibadah
→ Ingin menjadi lebih baik tapi sering terjatuh
→ Butuh pengingat yang LEMBUT, bukan menghakimi
→ Scroll media sosial setiap hari — poster harus MENGHENTIKAN scroll-nya

PROBLEM: Apa masalah NYATA yang dihadapi jamaah terkait "${d(data.title, '[Topik]')}"?
→ Identifikasi pain point: ketakutan, keraguan, kemalasan, atau kebingungan
→ Poster HARUS menjawab pain point tersebut
→ Bukan sekedar mengingatkan, tapi MEMBERIKAN SOLUSI dari Al-Qur'an/Sunnah`;

export const techniqueWhatIf = (data: PosterFormData): string => `
═══ "WHAT IF" THINKING ═══
Eksplorasi skenario berbeda untuk menemukan angle terbaik:

WHAT IF poster ini dilihat oleh:
→ Seorang anak muda yang baru mulai belajar agama? → Gunakan bahasa SEDERHANA
→ Seorang ibu yang sedang menghadapi cobaan berat? → Gunakan nada MENGHIBUR
→ Seorang pengusaha yang ragu bersedekah? → Gunakan dalil tentang JAMINAN ALLAH
→ Seorang muallaf yang masih belajar Islam? → Gunakan pendekatan PENUH KASIH

WHAT IF poster ini dipasang di:
→ Masjid — formal, tenang, penuh wibawa
→ Instagram — eye-catching, stop-scroll, modern
→ Banner jalan — terbaca dari kejauhan, high contrast

→ PILIH angle yang paling UNIVERSAL dan MENYENTUH untuk topik ini`;

export const techniqueGenerateKnowledge = (data: PosterFormData): string => `
═══ GENERATE KNOWLEDGE — Enrichment Konten ═══
Sebelum membuat poster, ENRICHKAN pengetahuan tentang topik:

1. FAKTA DALIL: Sebutkan minimal 2 dalil yang relevan (Ayat + Hadits)
2. KONTEKS HISTORIS: Kapan/mengapa dalil ini turun? (Asbabun Nuzul/Wurud)
3. HIKMAH SALAF: Bagaimana para Sahabat/Ulama Salaf mempraktikkan topik ini?
4. RELEVANSI MODERN: Bagaimana topik ini relevan untuk Muslim hari ini?
5. MISCONCEPTION: Apa kesalahpahaman umum tentang topik ini yang perlu diluruskan?

→ Gunakan knowledge ini untuk membuat konten yang DALAM dan BERBOBOT
→ Bukan sekedar poster cantik, tapi poster yang MENDIDIK`;

export const techniqueRAG = (data: PosterFormData): string => `
═══ RAG — Retrieval dari Sumber Terpercaya ═══
REFERENSI DATABASE yang WAJIB digunakan:

SUMBER DALIL (Prioritas):
├─ Al-Qur'an + Tafsir Ibnu Katsir / Tafsir As-Sa'di
├─ Shahih Bukhari & Shahih Muslim (prioritas tertinggi)
├─ Sunan Abu Dawud, Sunan Tirmidzi, Sunan An-Nasa'i, Sunan Ibnu Majah
├─ Riyadhush Shalihin (Imam Nawawi)
└─ Kitab Tauhid (Muhammad bin Abdul Wahhab)

SUMBER YANG DIHINDARI:
├─ ❌ Hadits Dha'if (lemah) atau Maudhu' (palsu)
├─ ❌ Israiliyyat (kisah-kisah dari Bani Israel yang tidak terkonfirmasi)
├─ ❌ Pendapat ulama yang menyelisihi ijma' Salaf
└─ ❌ Penafsiran sufi/liberal yang menyimpang

→ Setiap dalil HARUS disertai sumber lengkap (Nama Kitab, Nomor Hadits, Perawi)`;

export const techniqueDirectionalStimulus = (data: PosterFormData): string => `
═══ DIRECTIONAL STIMULUS — Keyword Pemicu Kualitas ═══
INSTRUKSI KUALITAS ABSOLUT:

LEVEL KUALITAS: MUSEUM-GRADE × EDITORIAL × AWARD-WINNING
BENCHMARK: Setara dengan poster charity campaign dari agency internasional top
STANDAR: National Geographic level photography meets Islamic art gallery

KEYWORD PEMICU VISUAL:
→ "Ultra-premium texture rendering"
→ "Gallery-worthy composition"
→ "Architectural lighting precision"
→ "Luxurious material authenticity"
→ "Museum-quality color grading"
→ "Hyper-realistic surface detail"
→ "Professional print-ready output"

ANTI-KEYWORD (HINDARI):
→ ❌ "Generic", "Clipart", "Stock photo feel"
→ ❌ "Template", "Basic", "Simple"
→ ✅ "Faceless cartoon/illustration" DIBOLEHKAN jika topik memerlukan`;

// ══════════════════════════════════════════════
// OPTIMIZATION TECHNIQUES
// ══════════════════════════════════════════════

export const techniqueInstruction = (data: PosterFormData): string => `
═══ INSTRUCTION PROMPTING — Step-by-Step Eksplisit ═══
EKSEKUSI langkah berikut secara BERURUTAN dan TEPAT:

STEP 1: Baca semua instruksi dari awal sampai akhir sebelum mulai
STEP 2: Tentukan SATU pesan utama yang ingin disampaikan
STEP 3: Pilih dalil yang paling KUAT untuk pesan tersebut
STEP 4: Buat headline ≤5 kata yang MENGHENTIKAN scroll
STEP 5: Tulis nasihat 2-3 kalimat yang MENYENTUH HATI
STEP 6: Rancang visual background yang mendukung pesan
STEP 7: Tentukan palet warna berdasarkan mood pesan
STEP 8: Susun layout sesuai zona yang ditentukan
STEP 9: Validasi semua elemen sudah sesuai aturan
STEP 10: Output hasil final dalam format yang diminta`;

export const techniqueMetaPrompting = (data: PosterFormData): string => `
═══ META-PROMPTING — Self-Optimization ═══
Sebelum output final, OPTIMASI prompt Anda sendiri:

META-CHECK 1: "Apakah saya sudah memberikan instruksi yang cukup SPESIFIK?"
→ Jika tidak, tambahkan detail yang kurang

META-CHECK 2: "Apakah ada AMBIGUITAS dalam instruksi saya?"
→ Jika ya, klarifikasi dengan contoh konkret

META-CHECK 3: "Apakah output saya akan KONSISTEN jika dijalankan berulang?"
→ Jika tidak, tambahkan constraint yang lebih ketat

META-CHECK 4: "Apakah kualitas output sudah MAKSIMAL?"
→ Jika belum, naikkan standar dengan keyword premium
→ Tambahkan: "Bayangkan ini akan dipajang di galeri seni Islam internasional"`;

export const techniqueLeastToMost = (data: PosterFormData): string => `
═══ LEAST-TO-MOST — Dari Sederhana ke Kompleks ═══
Bangun poster secara BERTAHAP dari elemen paling dasar:

LAYER 1 (Paling Dasar): Background warna solid
LAYER 2: Tambahkan tekstur premium (marmer/kayu/kain)
LAYER 3: Tambahkan pencahayaan dramatis (godrays/golden hour)
LAYER 4: Tambahkan pola geometri islami (opacity rendah)
LAYER 5: Letakkan zona layout (A/B/C/D)
LAYER 6: Masukkan headline dengan tipografi dominant
LAYER 7: Masukkan dalil Arab + terjemahan
LAYER 8: Masukkan nasihat/narasi
LAYER 9: Tambahkan ornamen aksen premium
LAYER 10: Tambahkan logo + footer branding
LAYER 11 (Final): Fine-tune keseluruhan — balance, breathing room, color harmony`;

export const techniqueSkeletonOfThought = (data: PosterFormData): string => `
═══ SKELETON-OF-THOUGHT — Outline Dulu, Detail Kemudian ═══
KERANGKA POSTER (ISI SETIAP BAGIAN):

[SKELETON]
├── 1. IDENTITAS POSTER
│   ├── Nama Lembaga: Yayasan Kunci Kebaikan
│   ├── Topik: ${d(data.title, '[Topik]')}
│   └── Target: Muslim Indonesia, segala usia
│
├── 2. KONTEN (ISI)
│   ├── Headline: [ISI HEADLINE ≤5 KATA]
│   ├── Dalil Arab: [ISI AYAT/HADITS DALAM BAHASA ARAB]
│   ├── Terjemahan: [ISI TERJEMAHAN + SUMBER]
│   └── Nasihat: [ISI NASIHAT 2-3 KALIMAT]
│
├── 3. VISUAL
│   ├── Background: [DESKRIPSI DETAIL BACKGROUND]
│   ├── Lighting: [JENIS & ARAH CAHAYA]
│   ├── Ornamen: [POLA GEOMETRI/ARABESQUE]
│   └── Aksen: [DELIGHT FACTOR]
│
├── 4. WARNA & TIPOGRAFI
│   ├── Dominan: [WARNA + HEX]
│   ├── Aksen: [WARNA + HEX]
│   ├── Font Headline: [JENIS FONT]
│   └── Font Body: [JENIS FONT]
│
└── 5. LAYOUT
    ├── Zone A (10%): Logo
    ├── Zone B (55%): Konten Utama
    ├── Zone C (25%): Visual Accent
    └── Zone D (10%): Footer

→ ISI setiap [PLACEHOLDER] dengan konten berkualitas tinggi`;

export const techniquePromptChaining = (data: PosterFormData): string => `
═══ PROMPT CHAINING — Output Bertahap ═══
Proses pembuatan poster DIRANTAI dalam 3 tahap:

CHAIN 1 (Konten & Dalil):
→ INPUT: Topik "${d(data.title, '[Topik]')}"
→ PROSES: Riset dalil shahih + buat headline + tulis nasihat
→ OUTPUT: Konten tekstual lengkap yang sudah tervalidasi

CHAIN 2 (Visual & Warna):
→ INPUT: Konten dari Chain 1
→ PROSES: Tentukan mood → pilih visual metaphor → tentukan palet warna
→ OUTPUT: Spesifikasi visual yang sesuai dengan konten

CHAIN 3 (Komposisi Final):
→ INPUT: Konten dari Chain 1 + Visual dari Chain 2
→ PROSES: Susun layout → atur tipografi → tambahkan ornamen → fine-tune
→ OUTPUT: Poster final yang siap di-render

→ Setiap chain MENGGUNAKAN output chain sebelumnya`;

export const techniquePAL = (data: PosterFormData): string => `
═══ PAL — Kalkulasi Programatis ═══
HITUNG secara presisi:

CANVAS: 3280 × 4096 px (4:5 Portrait)
MARGIN: 120px semua sisi
USABLE AREA: 3040 × 3856 px

ZONE CALCULATIONS:
├── Zone A (Logo): 3040 × 386px (10% tinggi) → Y: 120 to 506
├── Zone B (Konten): 3040 × 2121px (55% tinggi) → Y: 506 to 2627
├── Zone C (Visual): 3040 × 964px (25% tinggi) → Y: 2627 to 3591
└── Zone D (Footer): 3040 × 386px (10% tinggi) → Y: 3591 to 3976

FONT SIZE RATIOS:
├── Headline: ~120-160pt (dominan)
├── Narasi: ~36-48pt (1/3 dari headline)
├── Dalil Arab: ~72-96pt (2/3 dari headline)
├── Terjemahan: ~28-36pt (italic, lebih kecil)
└── Footer: ~24-28pt

→ PATUHI kalkulasi ini untuk presisi layout`;

export const techniqueActivePrompt = (data: PosterFormData): string => `
═══ ACTIVE-PROMPT — Highlight Area Kritis ═══
⚠️ PERHATIAN EKSTRA pada area-area berikut:

🔴 KRITIS — Dalil:
→ JANGAN PERNAH menggunakan hadits dha'if atau maudhu'
→ Pastikan nomor ayat/hadits BENAR
→ Terjemahan harus AKURAT, bukan parafrase bebas

🟡 PENTING — Tipografi Arab:
→ Karakter Arab harus JELAS dan TERBACA
→ Gunakan font Naskh/Uthmanic yang proper
→ Jangan ada karakter yang terpotong atau overlap

🟡 PENTING — Aturan Syar'i:
→ Makhluk bernyawa BOLEH dalam gaya KARTUN TANPA WAJAH (tanpa mata/hidung/mulut)
→ TIDAK ADA simbol agama selain Islam
→ TIDAK ADA musik, instrumen, atau elemen hiburan

🟢 PERHATIKAN — Kualitas Visual:
→ Resolusi HARUS 3280×4096px
→ Tekstur harus hyper-realistic, bukan flat/cartoon
→ Pencahayaan harus natural dan professional`;

// ══════════════════════════════════════════════
// VALIDATION TECHNIQUES
// ══════════════════════════════════════════════

export const techniqueSelfConsistency = (data: PosterFormData): string => `
═══ SELF-CONSISTENCY — Validasi Koherensi ═══
Sebelum finalisasi, VALIDASI konsistensi berikut:

CHECK 1 — Koherensi Konten:
□ Apakah JUDUL sesuai dengan ISI DALIL?
□ Apakah NASIHAT memperjalas makna DALIL?
□ Apakah ketiga elemen berbicara tentang SATU pesan?

CHECK 2 — Koherensi Visual:
□ Apakah WARNA sesuai dengan MOOD pesan?
□ Apakah VISUAL memperkuat PESAN, bukan mengalihkan?
□ Apakah TIPOGRAFI konsisten di semua elemen?

CHECK 3 — Koherensi Syar'i:
□ Apakah DALIL shahih dan sumbernya benar?
□ Apakah tidak ada elemen yang melanggar syariat?
□ Apakah pesan sesuai pemahaman Salafush Shalih?

→ Jika ada yang TIDAK konsisten, perbaiki SEBELUM output`;

export const techniqueReflexion = (data: PosterFormData): string => `
═══ REFLEXION — Self-Check Mendalam ═══
REFLEKSI sebelum output final:

PERTANYAAN KRITIS:

1. "Apakah poster ini akan membuat seseorang BERHENTI scroll dan MEMBACA?"
   → Jika tidak: Perkuat headline dan kontras visual

2. "Apakah dalil yang saya pilih benar-benar SHAHIH?"
   → Jika ragu: Ganti dengan dalil yang sudah pasti shahih (Bukhari/Muslim)

3. "Apakah terjemahan sesuai tafsir SALAF?"
   → Jika tidak yakin: Gunakan terjemahan Kemenag + tafsir Ibnu Katsir

4. "Apakah ada elemen yang bisa dianggap BID'AH atau SYIRIK?"
   → Jika ada: HAPUS segera

5. "Apakah poster ini cukup PREMIUM untuk mewakili lembaga resmi?"
   → Jika tidak: Naikkan kualitas visual dan tipografi

6. "Apakah saya bangga menunjukkan poster ini ke Ustadz saya?"
   → Jika tidak: Make it better.`;

export const techniqueCompetitiveGap = (data: PosterFormData): string => `
═══ COMPETITIVE GAP — Analisis & Superioritas ═══
KELEMAHAN poster dakwah yang UMUM beredar:

❌ Masalah 1: Desain norak — warna mencolok tanpa harmoni
→ SOLUSI KITA: Palet warna yang dikurasi, harmonis, premium

❌ Masalah 2: Terlalu ramai — terlalu banyak elemen
→ SOLUSI KITA: Minimalis, negative space luas, fokus pada pesan

❌ Masalah 3: Dalil tidak jelas sumbernya
→ SOLUSI KITA: Sumber lengkap, shahih, sesuai manhaj Salaf

❌ Masalah 4: Tipografi buruk — font tidak terbaca
→ SOLUSI KITA: Font premium, hierarki jelas, ukuran proporsional

❌ Masalah 5: Menggunakan gambar makhluk hidup REALISTIS
→ SOLUSI KITA: Aman syar'i — kartun tanpa wajah jika perlu, visual adaptif per topik

→ Poster kita HARUS mengatasi SEMUA kelemahan di atas`;

export const techniqueReverseEngineering = (data: PosterFormData): string => `
═══ REVERSE ENGINEERING — Dari Ideal ke Eksekusi ═══
POSTER IDEAL yang kita inginkan memiliki karakteristik:

TARGET AKHIR:
✓ Dilihat 3 detik → langsung paham pesannya
✓ Dilihat 10 detik → tergerak hatinya
✓ Dilihat 30 detik → ingin mengamalkannya
✓ Di-screenshot → dishare ke orang lain

BREAKDOWN ELEMEN YANG DIBUTUHKAN:
├── IMPACT: Headline yang powerful (≤5 kata, font besar)
├── CREDIBILITY: Dalil shahih dengan sumber jelas
├── EMOTION: Nasihat yang menyentuh kalbu
├── BEAUTY: Visual premium yang memukau mata
├── CLARITY: Layout clean yang mudah dibaca
├── TRUST: Branding lembaga yang professional
└── ACTION: Motivasi untuk beramal

→ SETIAP elemen HARUS ada dan HARUS berkualitas tinggi`;

// ══════════════════════════════════════════════
// TECHNIQUE REGISTRY — Maps ID to function
// ══════════════════════════════════════════════
export const TECHNIQUE_GENERATORS: Record<string, (data: PosterFormData) => string> = {
  'role-context': techniqueRoleContext,
  'cot': techniqueChainOfThought,
  'tot': techniqueTreeOfThoughts,
  'step-back': techniqueStepBack,
  'react': techniqueReAct,
  'got': techniqueGraphOfThoughts,
  'few-shot': techniqueFewShot,
  'zero-shot': techniqueZeroShot,
  'scamper': techniqueSCAMPER,
  'persona-problem': techniquePersonaProblem,
  'what-if': techniqueWhatIf,
  'generate-knowledge': techniqueGenerateKnowledge,
  'rag': techniqueRAG,
  'directional-stimulus': techniqueDirectionalStimulus,
  'instruction': techniqueInstruction,
  'meta-prompting': techniqueMetaPrompting,
  'least-to-most': techniqueLeastToMost,
  'skeleton-of-thought': techniqueSkeletonOfThought,
  'prompt-chaining': techniquePromptChaining,
  'pal': techniquePAL,
  'active-prompt': techniqueActivePrompt,
  'self-consistency': techniqueSelfConsistency,
  'reflexion': techniqueReflexion,
  'competitive-gap': techniqueCompetitiveGap,
  'reverse-engineering': techniqueReverseEngineering,
};

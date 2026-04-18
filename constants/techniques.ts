// ═══════════════════════════════════════
// JEFFRI POSTER — 24 Prompting Techniques
// ═══════════════════════════════════════

import { PromptTechnique, TechniqueCategory } from '../types';

export const TECHNIQUES: PromptTechnique[] = [
  // ── REASONING ──
  {
    id: 'role-context',
    name: 'Role + Context',
    nameEn: 'Role + Context',
    category: 'reasoning',
    description: 'Menetapkan persona AI sebagai Ustadz Salaf + Art Director profesional',
    icon: '🎭',
  },
  {
    id: 'cot',
    name: 'Chain of Thought',
    nameEn: 'Chain of Thought (CoT)',
    category: 'reasoning',
    description: 'Reasoning chain untuk pemilihan dalil: Ayat → Hadits Shahih → Atsar Salaf',
    icon: '🔗',
  },
  {
    id: 'tot',
    name: 'Tree of Thoughts',
    nameEn: 'Tree of Thoughts (ToT)',
    category: 'reasoning',
    description: 'Multiple path visual: Minimalis vs Nature vs Geometric → pilih terbaik',
    icon: '🌳',
  },
  {
    id: 'step-back',
    name: 'Step-Back Prompting',
    nameEn: 'Step-Back Prompting',
    category: 'reasoning',
    description: 'Mundur ke prinsip dasar dakwah sebelum eksekusi detail teknis',
    icon: '⏪',
  },
  {
    id: 'react',
    name: 'ReAct',
    nameEn: 'ReAct (Reason + Act)',
    category: 'reasoning',
    description: 'Reason tentang topik → Act membuat konten → Observe → Refine',
    icon: '⚡',
  },
  {
    id: 'got',
    name: 'Graph of Thoughts',
    nameEn: 'Graph of Thoughts (GoT)',
    category: 'reasoning',
    description: 'Hubungan semantik: Dalil ↔ Visual ↔ Warna ↔ Mood ↔ Tipografi',
    icon: '🕸️',
  },

  // ── GENERATION ──
  {
    id: 'few-shot',
    name: 'Few-Shot',
    nameEn: 'Few-Shot Prompting',
    category: 'generation',
    description: 'Menyertakan 3 contoh poster sukses sebagai referensi kualitas',
    icon: '📝',
  },
  {
    id: 'zero-shot',
    name: 'Zero-Shot',
    nameEn: 'Zero-Shot Prompting',
    category: 'generation',
    description: 'Mode tanpa contoh untuk topik unik, mengandalkan instruksi detail',
    icon: '🎯',
  },
  {
    id: 'scamper',
    name: 'SCAMPER',
    nameEn: 'SCAMPER',
    category: 'generation',
    description: 'Variasi kreatif: Substitute, Combine, Adapt, Modify, Put, Eliminate, Reverse',
    icon: '🔄',
  },
  {
    id: 'persona-problem',
    name: 'Persona Problem-First',
    nameEn: 'Persona + Problem-First',
    category: 'generation',
    description: 'Perspektif jamaah yang membutuhkan nasihat tentang topik',
    icon: '👤',
  },
  {
    id: 'what-if',
    name: '"What If" Thinking',
    nameEn: '"What If" Thinking',
    category: 'generation',
    description: 'Eksplorasi skenario: poster untuk anak muda? orang tua? muallaf?',
    icon: '💭',
  },
  {
    id: 'generate-knowledge',
    name: 'Generate Knowledge',
    nameEn: 'Generate Knowledge',
    category: 'generation',
    description: 'Enrichment: cari fakta, hikmah, dan konteks tambahan terkait topik',
    icon: '📚',
  },
  {
    id: 'rag',
    name: 'RAG',
    nameEn: 'Retrieval Augmented Generation',
    category: 'generation',
    description: 'Referensi database dalil shahih dan kitab-kitab salaf terpercaya',
    icon: '🗄️',
  },
  {
    id: 'directional-stimulus',
    name: 'Directional Stimulus',
    nameEn: 'Directional Stimulus',
    category: 'generation',
    description: 'Keyword pemicu kualitas: PREMIUM, EDITORIAL, MUSEUM-GRADE, AWARD-WINNING',
    icon: '🧭',
  },

  // ── OPTIMIZATION ──
  {
    id: 'instruction',
    name: 'Instruction Prompting',
    nameEn: 'Instruction Prompting',
    category: 'optimization',
    description: 'Instruksi eksplisit step-by-step yang terstruktur dan detail',
    icon: '📋',
  },
  {
    id: 'meta-prompting',
    name: 'Meta-Prompting',
    nameEn: 'Meta-Prompting',
    category: 'optimization',
    description: 'Prompt yang mengoptimalkan dan memperbaiki prompt sendiri',
    icon: '🔮',
  },
  {
    id: 'least-to-most',
    name: 'Least-to-Most',
    nameEn: 'Least-to-Most Prompting',
    category: 'optimization',
    description: 'Mulai dari elemen simpel (warna) → menuju kompleks (komposisi penuh)',
    icon: '📊',
  },
  {
    id: 'skeleton-of-thought',
    name: 'Skeleton of Thought',
    nameEn: 'Skeleton-of-Thought',
    category: 'optimization',
    description: 'Outline kerangka dulu → isi detail per bagian secara sistematis',
    icon: '🦴',
  },
  {
    id: 'prompt-chaining',
    name: 'Prompt Chaining',
    nameEn: 'Prompt Chaining',
    category: 'optimization',
    description: 'Output tahap 1 (konten) → input tahap 2 (visual) → output final',
    icon: '⛓️',
  },
  {
    id: 'pal',
    name: 'PAL',
    nameEn: 'Program-Aided Language',
    category: 'optimization',
    description: 'Kalkulasi layout grid dan proporsi zona secara programatis',
    icon: '🧮',
  },
  {
    id: 'active-prompt',
    name: 'Active-Prompt',
    nameEn: 'Active-Prompt',
    category: 'optimization',
    description: 'Highlight area kritis yang butuh perhatian khusus dan detail ekstra',
    icon: '🎯',
  },

  // ── VALIDATION ──
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    nameEn: 'Self-Consistency',
    category: 'validation',
    description: 'Validasi konsistensi antara dalil, judul, nasihat, dan visual',
    icon: '✅',
  },
  {
    id: 'reflexion',
    name: 'Reflexion',
    nameEn: 'Reflexion',
    category: 'validation',
    description: 'Self-check: dalil shahih? visual sesuai manhaj? tidak ada bid\'ah?',
    icon: '🪞',
  },
  {
    id: 'competitive-gap',
    name: 'Competitive Gap',
    nameEn: 'Competitive Gap',
    category: 'validation',
    description: 'Analisis kelemahan poster dakwah umum → pastikan poster ini lebih baik',
    icon: '📈',
  },
  {
    id: 'reverse-engineering',
    name: 'Reverse Engineering',
    nameEn: 'Reverse Engineering',
    category: 'validation',
    description: 'Dari poster ideal → breakdown dan validasi setiap elemennya',
    icon: '🔬',
  },
];

// --- Preset Mappings ---
export const PRESET_TECHNIQUE_IDS: Record<string, string[]> = {
  quick: ['instruction'],
  standard: ['role-context', 'instruction'],
  advanced: ['role-context', 'instruction', 'directional-stimulus'],
  maximum: ['role-context', 'instruction', 'directional-stimulus', 'scamper'],
};

// --- Category Labels ---
export const CATEGORY_LABELS: Record<TechniqueCategory, { label: string; color: string }> = {
  reasoning: { label: 'Penalaran', color: '#3b82f6' },
  generation: { label: 'Generasi', color: '#10b981' },
  optimization: { label: 'Optimisasi', color: '#8b5cf6' },
  validation: { label: 'Validasi', color: '#d4a853' },
};

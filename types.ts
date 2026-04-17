// ═══════════════════════════════════════
// JEFFRI POSTER — Types & Interfaces
// ═══════════════════════════════════════

// --- App Navigation ---
export type AppTab = 'generator' | 'watermark';

// --- Poster Category ---
export type PosterCategory = 'dakwah';

// --- Prompt Preset Levels ---
export type PromptPreset = 'quick' | 'standard' | 'advanced' | 'maximum';

// --- Prompt Technique Categories ---
export type TechniqueCategory = 'reasoning' | 'generation' | 'optimization' | 'validation';

// --- Prompt Technique Definition ---
export interface PromptTechnique {
  id: string;
  name: string;
  nameEn: string;
  category: TechniqueCategory;
  description: string;
  icon: string;
}

// --- Poster Form Data ---
export interface PosterFormData {
  title?: string;
  quoteArabic?: string;
  quoteTranslation?: string;
  advice?: string;
  visualContext?: string;
  colorPalette?: string;
}

export const INITIAL_FORM_DATA: PosterFormData = {
  title: "JANJI ALLAH ITU PASTI",
  quoteArabic: "وَمَا أَنْفَقْتُمْ مِنْ شَيْءٍ فَهُوَ يُخْلِفُهُ ۖ وَهُوَ خَيْرُ الرَّازِقِينَ",
  quoteTranslation: "Dan apa saja yang kamu infakkan, Allah akan menggantinya dan Dia-lah Pemberi rizki yang terbaik (QS. Saba': 39)",
  advice: "Jangan pernah ragu untuk berbagi. Harta yang dikeluarkan di jalan Allah tidak akan berkurang, justru akan bertambah berkah dan diganti dengan yang lebih baik.",
  visualContext: "Permukaan marmer hijau tua dengan urat-urat emas alami, diterangi cahaya pagi yang masuk dari samping kiri (soft godrays), menciptakan gradasi dari terang ke gelap secara halus. Di sudut tertentu terdapat pola geometri islami yang terukir sangat halus — seperti relief batu — dengan kedalaman tekstur yang terasa nyata. Atmosfer: Tenang, mewah, penuh harapan, dan berwibawa.",
  colorPalette: "Dominan: Hijau Zamrud Tua (#1B4332) atau Emas Gelap (#B8860B)\nAksen: Putih Bersih (#FFFFFF) dan Krem (#FAF7F2)\nBrand Footer: Biru Tua (#0E2F73)\nMood: Hangat, menenangkan, penuh harapan"
};

// --- Watermark Types ---
export type WatermarkMethod = 'alpha-composite' | 'frequency-perturbation' | 'smart-noise' | 'combined';

export interface WatermarkConfig {
  method: WatermarkMethod;
  intensity: number;        // 0-100
  preserveQuality: boolean;
  stripMetadata: boolean;
  outputFormat: 'png' | 'jpeg' | 'webp';
  outputQuality: number;    // 0-100
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  method: 'combined',
  intensity: 70,
  preserveQuality: true,
  stripMetadata: true,
  outputFormat: 'png',
  outputQuality: 95,
};

// --- Watermark Processing State ---
export interface WatermarkState {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  fileName: string | null;
  fileSize: number;
  progress: number;
}

// --- Prompt Generation Context ---
export interface PromptContext {
  category: PosterCategory;
  formData: PosterFormData;
  selectedTechniques: string[];
  preset: PromptPreset;
}

// --- Preset Configurations ---
export const PRESET_CONFIGS: Record<PromptPreset, { label: string; description: string; techniqueCount: string; color: string }> = {
  quick: {
    label: '⚡ Quick',
    description: 'Prompt ringkas & efektif',
    techniqueCount: '3 teknik',
    color: '#10b981',
  },
  standard: {
    label: '📋 Standard',
    description: 'Keseimbangan kualitas & kecepatan',
    techniqueCount: '8 teknik',
    color: '#3b82f6',
  },
  advanced: {
    label: '🚀 Advanced',
    description: 'Prompt detail & mendalam',
    techniqueCount: '15 teknik',
    color: '#8b5cf6',
  },
  maximum: {
    label: '💎 Maximum',
    description: 'Semua teknik aktif, kualitas tertinggi',
    techniqueCount: '24 teknik',
    color: '#d4a853',
  },
};
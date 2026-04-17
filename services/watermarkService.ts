// ═══════════════════════════════════════
// JEFFRI POSTER — Watermark Removal Engine
// Client-side visible watermark removal
// ═══════════════════════════════════════

import { WatermarkConfig } from '../types';
import {
  loadImage,
  imageToCanvas,
  canvasToDataUrl,
  clamp,
  colorDistance,
  gaussianRandom,
  gaussianBlurRegion,
} from '../utils/imageProcessing';

export interface ProcessingResult {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

type ProgressCallback = (progress: number, status: string) => void;

/**
 * Main watermark removal function
 */
export const removeWatermark = async (
  file: File,
  config: WatermarkConfig,
  onProgress?: ProgressCallback
): Promise<ProcessingResult> => {
  onProgress?.(5, 'Memuat gambar...');
  
  const img = await loadImage(file);
  const { canvas, ctx } = imageToCanvas(img);
  const { width, height } = canvas;

  onProgress?.(15, 'Menganalisis gambar...');

  const imageData = ctx.getImageData(0, 0, width, height);

  switch (config.method) {
    case 'gemini-splash':
      await processGeminiSplash(imageData, width, height, onProgress);
      break;
    case 'alpha-composite':
      await processAlphaComposite(imageData, config.intensity, onProgress);
      break;
    case 'frequency-perturbation':
      await processFrequencyPerturbation(imageData, config.intensity, onProgress);
      break;
    case 'smart-noise':
      await processSmartNoise(imageData, config.intensity, onProgress);
      break;
    case 'combined':
    default:
      await processCombined(imageData, width, height, config.intensity, onProgress);
      break;
  }

  onProgress?.(90, 'Merender hasil...');
  ctx.putImageData(imageData, 0, 0);

  // Apply quality preservation if enabled
  if (config.preserveQuality) {
    applyQualityPreservation(ctx, width, height);
  }

  onProgress?.(95, 'Menyiapkan output...');

  const dataUrl = canvasToDataUrl(canvas, config.outputFormat, config.outputQuality / 100);

  onProgress?.(100, 'Selesai!');

  return {
    dataUrl,
    width,
    height,
    originalSize: file.size,
    processedSize: Math.round(dataUrl.length * 0.75), // approximate
  };
};

// ══════════════════════════════════════════════
// METHOD 1: Reverse Alpha Compositing
// For visible semi-transparent watermarks
// ══════════════════════════════════════════════

async function processAlphaComposite(
  imageData: ImageData,
  intensity: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const alpha = (intensity / 100) * 0.5; // watermark alpha estimation

  // Step 1: Detect watermark regions (semi-transparent white/gray overlays)
  onProgress?.(25, 'Mendeteksi area watermark...');
  
  const watermarkMask = new Uint8Array(totalPixels);
  
  // Analyze image for watermark characteristics
  // Watermarks typically: high luminance, low saturation, consistent pattern
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    
    // Calculate luminance and saturation
    const lum = (r * 0.299 + g * 0.587 + b * 0.114);
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
    
    // Watermark detection heuristics:
    // - Higher luminance than surrounding area
    // - Low saturation (grayish)
    // - Semi-transparent appearance
    if (lum > 180 && sat < 0.15) {
      watermarkMask[i] = 255;
    } else if (lum > 150 && sat < 0.1) {
      watermarkMask[i] = 128;
    }
  }

  // Step 2: Reverse alpha compositing on detected regions
  onProgress?.(50, 'Menghapus watermark (Alpha Compositing)...');
  
  for (let i = 0; i < totalPixels; i++) {
    if (watermarkMask[i] === 0) continue;
    
    const idx = i * 4;
    const maskStrength = watermarkMask[i] / 255;
    const effectiveAlpha = alpha * maskStrength * (intensity / 100);
    
    if (effectiveAlpha > 0.01) {
      // Reverse: Original = (Composited - α × Watermark) / (1 - α)
      // Assuming watermark color is white (255, 255, 255)
      const wR = 255, wG = 255, wB = 255;
      
      data[idx] = clamp(Math.round((data[idx] - effectiveAlpha * wR) / (1 - effectiveAlpha)), 0, 255);
      data[idx + 1] = clamp(Math.round((data[idx + 1] - effectiveAlpha * wG) / (1 - effectiveAlpha)), 0, 255);
      data[idx + 2] = clamp(Math.round((data[idx + 2] - effectiveAlpha * wB) / (1 - effectiveAlpha)), 0, 255);
    }
  }

  onProgress?.(80, 'Memperhalus hasil...');
}

// ══════════════════════════════════════════════
// METHOD 2: Frequency Domain Perturbation
// Disrupts watermark patterns in frequency space
// ══════════════════════════════════════════════

async function processFrequencyPerturbation(
  imageData: ImageData,
  intensity: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const strength = intensity / 100;

  onProgress?.(25, 'Menganalisis frekuensi pixel...');

  // Step 1: Detect high-frequency patterns (where watermarks hide)
  // Use Laplacian-like edge detection to find watermark edges
  const edgeMap = new Float64Array(totalPixels);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Laplacian kernel for each channel
      let lap = 0;
      for (let c = 0; c < 3; c++) {
        const center = data[idx + c] * 4;
        const up = data[((y - 1) * width + x) * 4 + c];
        const down = data[((y + 1) * width + x) * 4 + c];
        const left = data[(y * width + (x - 1)) * 4 + c];
        const right = data[(y * width + (x + 1)) * 4 + c];
        lap += Math.abs(center - up - down - left - right);
      }
      edgeMap[y * width + x] = lap / 3;
    }
  }

  onProgress?.(50, 'Menerapkan perturbation frekuensi...');

  // Step 2: Apply targeted perturbation at watermark frequency bands
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const edge = edgeMap[i];
    
    // Only perturb areas with specific edge characteristics
    // (watermark text creates distinctive high-frequency patterns)
    if (edge > 20 && edge < 200) {
      const perturbStrength = strength * (edge / 200) * 0.5;
      
      for (let c = 0; c < 3; c++) {
        const noise = gaussianRandom(0, perturbStrength * 8);
        data[idx + c] = clamp(Math.round(data[idx + c] + noise), 0, 255);
      }
    }
  }

  onProgress?.(80, 'Smoothing hasil...');
}

// ══════════════════════════════════════════════
// METHOD 3: Smart Noise Injection
// Targeted noise to disrupt watermark detection
// ══════════════════════════════════════════════

async function processSmartNoise(
  imageData: ImageData,
  intensity: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const strength = intensity / 100;

  onProgress?.(25, 'Menganalisis distribusi pixel...');

  // Step 1: Calculate local statistics for adaptive noise
  const blockSize = 8;
  const blocksX = Math.ceil(width / blockSize);
  const blocksY = Math.ceil(height / blockSize);
  
  const blockStats: { mean: number; variance: number }[] = [];
  
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let sum = 0, sumSq = 0, count = 0;
      
      for (let y = by * blockSize; y < Math.min((by + 1) * blockSize, height); y++) {
        for (let x = bx * blockSize; x < Math.min((bx + 1) * blockSize, width); x++) {
          const idx = (y * width + x) * 4;
          const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          sum += lum;
          sumSq += lum * lum;
          count++;
        }
      }
      
      const mean = sum / count;
      const variance = (sumSq / count) - (mean * mean);
      blockStats.push({ mean, variance });
    }
  }

  onProgress?.(50, 'Menerapkan smart noise...');

  // Step 2: Apply adaptive noise — more noise in likely watermark areas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bx = Math.floor(x / blockSize);
      const by = Math.floor(y / blockSize);
      const stats = blockStats[by * blocksX + bx];
      
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      
      // Detect potential watermark pixel
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      const isHighLum = lum > stats.mean + 20;
      const isLowVariance = stats.variance < 500;
      
      // More aggressive noise for suspected watermark areas
      let noiseLevel = strength * 2;
      if (isHighLum && isLowVariance) {
        noiseLevel = strength * 6;
      }
      
      for (let c = 0; c < 3; c++) {
        const noise = gaussianRandom(0, noiseLevel);
        data[idx + c] = clamp(Math.round(data[idx + c] + noise), 0, 255);
      }
    }
  }

  onProgress?.(80, 'Memperhalus transisi...');
}

// ══════════════════════════════════════════════
// METHOD 4: GEMINI SPLASH TARGETED PATCHING
// Menarget area kanan-bawah secara spesifik menggunakan warna sampel sekitar
// ══════════════════════════════════════════════

async function processGeminiSplash(
  imageData: ImageData,
  width: number,
  height: number,
  onProgress?: ProgressCallback
): Promise<void> {
  onProgress?.(25, 'Mendeteksi area watermark pojok kanan bawah...');

  const { data } = imageData;

  // The Gemini Watermark is usually in the very bottom right.
  // We'll target the bottom 6% and right 8% of the image.
  // For a 3280x4096 poster, this is ~260x245 pixels which easily covers the logo
  
  const boxWidth = Math.min(Math.floor(width * 0.08), 300);
  const boxHeight = Math.min(Math.floor(height * 0.06), 250);
  
  const startX = width - boxWidth;
  const startY = height - boxHeight;

  onProgress?.(50, 'Mengambil sampel warna footer...');

  // Sample the color from slightly to the left of the bounding box
  // Since the poster has a solid footer strip, the color just left of the box is the true background color
  const sampleX = Math.max(0, startX - 20);
  const sampleY = Math.max(0, height - Math.floor(boxHeight / 2));
  
  const sampleIdx = (sampleY * width + sampleX) * 4;
  const sampleR = data[sampleIdx];
  const sampleG = data[sampleIdx + 1];
  const sampleB = data[sampleIdx + 2];

  onProgress?.(75, 'Menambal watermark dengan warna solid...');

  // Fill the bottom right box with the sampled color, plus slight Gaussian noise to avoid banding
  for (let y = startY; y < height; y++) {
    for (let x = startX; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const noiseR = (Math.random() - 0.5) * 4; // subtle noise ±2 
      const noiseG = (Math.random() - 0.5) * 4; 
      const noiseB = (Math.random() - 0.5) * 4; 

      data[idx] = clamp(Math.round(sampleR + noiseR), 0, 255);
      data[idx + 1] = clamp(Math.round(sampleG + noiseG), 0, 255);
      data[idx + 2] = clamp(Math.round(sampleB + noiseB), 0, 255);
      // keep alpha as is
    }
  }

  onProgress?.(90, 'Memperhalus transisi tepi tambalan...');
  
  // Blend the edges of the box so it doesn't look like a sharp hard-coded cut
  const blendMargin = 15;
  for (let y = startY - blendMargin; y < height; y++) {
    for (let x = startX - blendMargin; x < width; x++) {
      // only process the L-shaped border region outside the box
      const isTopBorder = y < startY && x >= startX;
      const isLeftBorder = x < startX && y >= startY;
      const isCornerBorder = y < startY && x < startX;
      
      if (isTopBorder || isLeftBorder || isCornerBorder) {
        const idx = (y * width + x) * 4;
        
        let dist = 0;
        if (isTopBorder) dist = startY - y;
        else if (isLeftBorder) dist = startX - x;
        else dist = Math.sqrt(Math.pow(startX - x, 2) + Math.pow(startY - y, 2));

        if (dist <= blendMargin) {
          const ratio = dist / blendMargin; // 0 at inner edge, 1 at outer edge
          
          data[idx] = clamp(Math.round(data[idx] * ratio + sampleR * (1 - ratio)), 0, 255);
          data[idx + 1] = clamp(Math.round(data[idx + 1] * ratio + sampleG * (1 - ratio)), 0, 255);
          data[idx + 2] = clamp(Math.round(data[idx + 2] * ratio + sampleB * (1 - ratio)), 0, 255);
        }
      }
    }
  }
}

// ══════════════════════════════════════════════
// COMBINED METHOD
// Uses all three legacy methods strategically
// ══════════════════════════════════════════════

async function processCombined(
  imageData: ImageData,
  width: number,
  height: number,
  intensity: number,
  onProgress?: ProgressCallback
): Promise<void> {
  // Phase 1: Alpha Composite (primary removal)
  onProgress?.(20, '[1/3] Reverse Alpha Compositing...');
  await processAlphaComposite(imageData, intensity * 0.8, undefined);

  // Phase 2: Frequency Perturbation (clean residual patterns)
  onProgress?.(45, '[2/3] Frequency Perturbation...');
  await processFrequencyPerturbation(imageData, intensity * 0.5, undefined);

  // Phase 3: Smart Noise (final cleanup)
  onProgress?.(70, '[3/3] Smart Noise Cleanup...');
  await processSmartNoise(imageData, intensity * 0.3, undefined);

  // Phase 4: Edge-aware smoothing on processed areas
  onProgress?.(85, 'Edge-aware smoothing...');
  
  // Quick local smooth to reduce artifacts
  const { data } = imageData;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Simple 3x3 average for smooth transitions
      for (let c = 0; c < 3; c++) {
        const neighbors = [
          data[((y - 1) * width + x) * 4 + c],
          data[((y + 1) * width + x) * 4 + c],
          data[(y * width + x - 1) * 4 + c],
          data[(y * width + x + 1) * 4 + c],
        ];
        
        const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
        const diff = Math.abs(data[idx + c] - avg);
        
        // Only smooth if there's a noticeable difference (artifact)
        if (diff > 15) {
          data[idx + c] = clamp(Math.round(data[idx + c] * 0.6 + avg * 0.4), 0, 255);
        }
      }
    }
  }
}

// ══════════════════════════════════════════════
// QUALITY PRESERVATION
// ══════════════════════════════════════════════

function applyQualityPreservation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Subtle sharpening pass to compensate for any blur from processing
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const original = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        // Unsharp mask: sharpen = original + (original - blurred) * amount
        const center = original[idx + c];
        const blur = (
          original[((y - 1) * width + x) * 4 + c] +
          original[((y + 1) * width + x) * 4 + c] +
          original[(y * width + x - 1) * 4 + c] +
          original[(y * width + x + 1) * 4 + c]
        ) / 4;
        
        const sharpened = center + (center - blur) * 0.2; // subtle sharpening
        data[idx + c] = clamp(Math.round(sharpened), 0, 255);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Download processed image
 */
export const downloadImage = (dataUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

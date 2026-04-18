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
  hfToken?: string,
  onProgress?: ProgressCallback
): Promise<ProcessingResult> => {
  onProgress?.(5, 'Memuat gambar...');
  
  const img = await loadImage(file);
  const { canvas, ctx } = imageToCanvas(img);
  let { width, height } = canvas;
  let finalCanvas = canvas;
  let finalCtx = ctx;

  onProgress?.(15, 'Menganalisis gambar...');

  let imageData = ctx.getImageData(0, 0, width, height);

  // Cloud AI & Crop returns a new canvas, unlike standard filters which mutate ImageData in place.
  let isNewCanvas = false;

  switch (config.method) {
    case 'cloud-ai':
      if (!hfToken) throw new Error('Hugging Face Token is required for Cloud AI Inpainting.');
      const resAI = await processCloudAI(canvas, width, height, hfToken, onProgress);
      finalCanvas = resAI.canvas;
      finalCtx = resAI.ctx;
      width = finalCanvas.width;
      height = finalCanvas.height;
      isNewCanvas = true;
      break;
    case 'smart-crop':
      // Memotong bagian 250px bawah (atau sesuai intensity)
      const resCrop = await processSmartCrop(canvas, width, height, config.intensity, onProgress);
      finalCanvas = resCrop.canvas;
      finalCtx = resCrop.ctx;
      width = finalCanvas.width;
      height = finalCanvas.height;
      isNewCanvas = true;
      break;
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
  
  if (!isNewCanvas) {
    // If not a new canvas, apply the mutated ImageData
    finalCtx.putImageData(imageData, 0, 0);
  }

  // Apply quality preservation if enabled
  if (config.preserveQuality) {
    applyQualityPreservation(finalCtx, width, height);
  }

  onProgress?.(95, 'Menyiapkan output...');

  const dataUrl = canvasToDataUrl(finalCanvas, config.outputFormat, config.outputQuality / 100);

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
// OPSI KERAS 1: SMART AUTO-CROP
// ══════════════════════════════════════════════
async function processSmartCrop(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  intensity: number,
  onProgress?: ProgressCallback
): Promise<{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }> {
  onProgress?.(50, 'Memotong frame pengorbanan di ujung bawah...');
  
  // Asumsikan default intensity 50% berarti crop 250px.
  // Jika 100%, crop sampai 500px.
  const cropAmount = Math.floor((intensity / 50) * 200); 
  const newHeight = Math.max(10, height - cropAmount);

  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = newHeight;
  const newCtx = newCanvas.getContext('2d')!;

  // Gambar ulang tetapi hanya potong bagian atas hingga newHeight
  newCtx.drawImage(sourceCanvas, 0, 0, width, newHeight, 0, 0, width, newHeight);

  onProgress?.(100, `Cropping selesai (-${cropAmount}px)`);
  return { canvas: newCanvas, ctx: newCtx };
}

// ══════════════════════════════════════════════
// OPSI KERAS 2: CLOUD AI INPAINTING (Hugging Face)
// ══════════════════════════════════════════════
async function processCloudAI(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  token: string,
  onProgress?: ProgressCallback
): Promise<{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }> {
  onProgress?.(20, 'Menyiapkan mask & mengemas data untuk AI...');

  // Kita hanya akan mengirim area pojok kanan bawah 512x512 agar tidak over-limit API
  const patchSize = 512;
  const startX = Math.max(0, width - patchSize);
  const startY = Math.max(0, height - patchSize);
  const pw = Math.min(patchSize, width);
  const ph = Math.min(patchSize, height);

  // Buat kanvas kecil untuk patch gambar
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = pw;
  patchCanvas.height = ph;
  const patchCtx = patchCanvas.getContext('2d')!;
  patchCtx.drawImage(sourceCanvas, startX, startY, pw, ph, 0, 0, pw, ph);
  
  // Konversi ke format Blob binary (Wajib untuk API Hugging Face)
  const patchBlob = await new Promise<Blob>((resolve, reject) => {
    patchCanvas.toBlob((b) => b ? resolve(b) : reject('Gagal membuat blob gambar'), 'image/png');
  });

  // Buat kanvas mask (Putih di pojok = hapus, Hitam = pertahankan)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = pw;
  maskCanvas.height = ph;
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.fillStyle = '#000000'; // Hitam
  maskCtx.fillRect(0, 0, pw, ph);
  maskCtx.fillStyle = '#FFFFFF'; // Putih untuk target
  const boxW = Math.floor(width * 0.08);
  const boxH = Math.floor(height * 0.06);
  maskCtx.fillRect(pw - boxW, ph - boxH, boxW, boxH);
  
  const maskBlob = await new Promise<Blob>((resolve, reject) => {
    maskCanvas.toBlob((b) => b ? resolve(b) : reject('Gagal membuat mask blob'), 'image/png');
  });

  onProgress?.(50, 'Berkomunikasi dengan Hugging Face Cloud (Mungkin butuh 5-15 detik)...');

  // Siapkan objek FormData 
  const formData = new FormData();
  formData.append('image', patchBlob, 'image.png');
  formData.append('mask_image', maskBlob, 'mask.png');
  formData.append('inputs', 'natural seamless background texture mapping, professional design');

  // Panggil Hugging Face API Inpainting standar
  const apiURL = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting';
  const response = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Jangan set Content-Type secara manual, biarkan browser menyetel multipart/form-data & boundary
    },
    body: formData
  });

  if (!response.ok) {
    let errText = '';
    try { errText = await response.text(); } catch(e) {}
    throw new Error(`API Error ${response.status}: Server HuggingFace menolak. Biasanya karena format token salah atau server penuh. Coba gunakan SMART AUTO-CROP. ${errText}`);
  }

  onProgress?.(80, 'Mendapatkan hasil dari Cloud...');

  const resultBlob = await response.blob();
  const resultImg = await createImageBitmap(resultBlob);

  onProgress?.(90, 'Menyatukan kembali dengan gambar asli...');

  // Timpa layar asli dengan canvas
  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  const newCtx = newCanvas.getContext('2d')!;
  
  newCtx.drawImage(sourceCanvas, 0, 0);
  newCtx.drawImage(resultImg, startX, startY);

  return { canvas: newCanvas, ctx: newCtx };
}

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
  onProgress?.(25, 'Menganalisis anomali piksel di pojok kanan bawah...');

  const { data } = imageData;

  // Kotak lokasi Gemini Watermark: ~6% lebar dan ~5% tinggi
  const boxWidth = Math.min(Math.floor(width * 0.08), 280);
  const boxHeight = Math.min(Math.floor(height * 0.06), 250);
  
  const startX = width - boxWidth;
  const startY = height - boxHeight;

  // Pastikan batas aman
  if (startX < 0 || startY < 0) return;

  onProgress?.(50, 'Menjalankan Mathematical Median Filter...');

  // Simpan data pixel original sebagai sumber perhitungan
  const originalData = new Uint8ClampedArray(data);

  // Ukuran Jendela Filter: radius 15 artinya 31x31 piksel
  // Jendela besar wajib dipakai agar mampu 'melibas' ketebalan bintang Gemini
  const radius = 15;
  const histR = new Int32Array(256);
  const histG = new Int32Array(256);
  const histB = new Int32Array(256);

  for (let y = startY; y < height; y++) {
    for (let x = startX; x < width; x++) {
      // 1. Reset Histogram
      histR.fill(0);
      histG.fill(0);
      histB.fill(0);
      let totalPixels = 0;

      // 2. Populasi warna-warna tetangga ke dalam Histogram
      for (let wy = -radius; wy <= radius; wy++) {
        for (let wx = -radius; wx <= radius; wx++) {
          const nx = x + wx;
          const ny = y + wy;
          // Pastikan tidak keluar batas gambar
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            histR[originalData[nIdx]]++;
            histG[originalData[nIdx + 1]]++;
            histB[originalData[nIdx + 2]]++;
            totalPixels++;
          }
        }
      }

      // 3. Pencarian nilai Median super cepat tanpa fungsi Array.sort() (O(1) Counting Sort)
      const targetHalf = totalPixels / 2;
      let countR = 0, medR = 0;
      for (let i = 0; i < 256; i++) { countR += histR[i]; if (countR >= targetHalf) { medR = i; break; } }
      
      let countG = 0, medG = 0;
      for (let i = 0; i < 256; i++) { countG += histG[i]; if (countG >= targetHalf) { medG = i; break; } }
      
      let countB = 0, medB = 0;
      for (let i = 0; i < 256; i++) { countB += histB[i]; if (countB >= targetHalf) { medB = i; break; } }

      // 4. Analisis Anomali
      const targetIdx = (y * width + x) * 4;
      const origR = originalData[targetIdx];
      const origG = originalData[targetIdx + 1];
      const origB = originalData[targetIdx + 2];

      // Hitung luminansi/kecerahan cahaya
      const lumOrig = origR * 0.299 + origG * 0.587 + origB * 0.114;
      const lumMed = medR * 0.299 + medG * 0.587 + medB * 0.114;

      // Evaluasi apakah piksel asli merupakan benda asing putih bersinar (Watermark Gemini):
      // - Jauh LEBIH TERANG dari sekitarnya (+15 px luminansi)
      // - Warnanya memang lumayan terang (> 130 absolut)
      // Jika mendeteksi karakter teks warna gelap (misal biru tua), aturan ini bernilai GAgal (Aman).
      const isWatermark = lumOrig > lumMed + 15 && lumOrig > 130;

      if (isWatermark) {
        // Soft-Masking: Lakukan peleburan halus di pinggiran bintang transparan
        // Jika anomali tipis, lebur setengah asli setengah median. 
        // Jika anomali tebal (>35), hajar 100% menggunakan warna median murni.
        const blendStrength = clamp((lumOrig - lumMed - 10) / 25, 0, 1);
        
        data[targetIdx] = clamp(Math.round(origR * (1 - blendStrength) + medR * blendStrength), 0, 255);
        data[targetIdx + 1] = clamp(Math.round(origG * (1 - blendStrength) + medG * blendStrength), 0, 255);
        data[targetIdx + 2] = clamp(Math.round(origB * (1 - blendStrength) + medB * blendStrength), 0, 255);
      } else {
        // Bukan watermark, biarkan aslinya utuh 100%!
        data[targetIdx] = origR;
        data[targetIdx + 1] = origG;
        data[targetIdx + 2] = origB;
      }
    }
    
    // Kirim progress bar palsu agar user tidak mengira macet
    if (y % 15 === 0) {
      const prog = 50 + Math.floor(((y - startY) / boxHeight) * 35);
      onProgress?.(prog, 'Menghancurkan watermark... ' + prog + '%');
    }
  }

  onProgress?.(90, 'Memperhalus hasil penambalan...');
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

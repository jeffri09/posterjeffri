// ═══════════════════════════════════════
// JEFFRI POSTER — Image Processing Utilities
// Canvas-based pixel manipulation for watermark removal
// ═══════════════════════════════════════

/**
 * Load an image file into an HTMLImageElement
 */
export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

/**
 * Load an image from data URL
 */
export const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Create canvas from image
 */
export const imageToCanvas = (img: HTMLImageElement): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
};

/**
 * Get pixel data from canvas
 */
export const getPixelData = (ctx: CanvasRenderingContext2D, width: number, height: number): ImageData => {
  return ctx.getImageData(0, 0, width, height);
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Convert canvas to data URL with specified format and quality
 */
export const canvasToDataUrl = (
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): string => {
  const mimeType = `image/${format}`;
  return canvas.toDataURL(mimeType, quality);
};

/**
 * Convert canvas to Blob
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const mimeType = `image/${format}`;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      mimeType,
      quality
    );
  });
};

/**
 * Calculate color distance between two pixels (Euclidean in RGB space)
 */
export const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

/**
 * Check if a pixel is "near white" (typical for watermark text)
 */
export const isNearWhite = (r: number, g: number, b: number, threshold: number = 40): boolean => {
  return r > (255 - threshold) && g > (255 - threshold) && b > (255 - threshold);
};

/**
 * Check if a pixel is "near gray" (typical for semi-transparent watermarks)
 */
export const isNearGray = (r: number, g: number, b: number, threshold: number = 30): boolean => {
  const avg = (r + g + b) / 3;
  return Math.abs(r - avg) < threshold && Math.abs(g - avg) < threshold && Math.abs(b - avg) < threshold;
};

/**
 * Gaussian random number generator (Box-Muller)
 */
export const gaussianRandom = (mean: number = 0, stddev: number = 1): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stddev + mean;
};

/**
 * Bilinear interpolation for smooth pixel sampling
 */
export const bilinearSample = (
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): [number, number, number, number] => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, Math.floor(data.length / (4 * width)) - 1);
  const fx = x - x0;
  const fy = y - y0;

  const getPixel = (px: number, py: number): [number, number, number, number] => {
    const idx = (py * width + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const p00 = getPixel(x0, y0);
  const p10 = getPixel(x1, y0);
  const p01 = getPixel(x0, y1);
  const p11 = getPixel(x1, y1);

  const result: [number, number, number, number] = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    result[c] = clamp(
      Math.round(
        p00[c] * (1 - fx) * (1 - fy) +
        p10[c] * fx * (1 - fy) +
        p01[c] * (1 - fx) * fy +
        p11[c] * fx * fy
      ),
      0, 255
    );
  }
  return result;
};

/**
 * Apply Gaussian blur to a specific region using a simple kernel
 */
export const gaussianBlurRegion = (
  imageData: ImageData,
  x: number,
  y: number,
  regionWidth: number,
  regionHeight: number,
  radius: number = 2
): void => {
  const { data, width } = imageData;
  const kernel: number[] = [];
  const size = radius * 2 + 1;
  let sum = 0;

  // Build 1D Gaussian kernel
  for (let i = 0; i < size; i++) {
    const val = Math.exp(-0.5 * ((i - radius) / (radius / 2)) ** 2);
    kernel.push(val);
    sum += val;
  }
  // Normalize
  for (let i = 0; i < size; i++) kernel[i] /= sum;

  // Apply separable blur (horizontal then vertical)
  const temp = new Float64Array(regionWidth * regionHeight * 4);

  // Horizontal pass
  for (let ry = 0; ry < regionHeight; ry++) {
    for (let rx = 0; rx < regionWidth; rx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = clamp(x + rx + k, 0, width - 1);
        const sy = y + ry;
        const idx = (sy * width + sx) * 4;
        const w = kernel[k + radius];
        r += data[idx] * w;
        g += data[idx + 1] * w;
        b += data[idx + 2] * w;
        a += data[idx + 3] * w;
      }
      const tidx = (ry * regionWidth + rx) * 4;
      temp[tidx] = r;
      temp[tidx + 1] = g;
      temp[tidx + 2] = b;
      temp[tidx + 3] = a;
    }
  }

  // Vertical pass and write back
  for (let ry = 0; ry < regionHeight; ry++) {
    for (let rx = 0; rx < regionWidth; rx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = clamp(ry + k, 0, regionHeight - 1);
        const tidx = (sy * regionWidth + rx) * 4;
        const w = kernel[k + radius];
        r += temp[tidx] * w;
        g += temp[tidx + 1] * w;
        b += temp[tidx + 2] * w;
        a += temp[tidx + 3] * w;
      }
      const idx = ((y + ry) * width + (x + rx)) * 4;
      data[idx] = clamp(Math.round(r), 0, 255);
      data[idx + 1] = clamp(Math.round(g), 0, 255);
      data[idx + 2] = clamp(Math.round(b), 0, 255);
      data[idx + 3] = clamp(Math.round(a), 0, 255);
    }
  }
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

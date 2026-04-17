import React, { useState, useCallback } from 'react';
import { WatermarkConfig, WatermarkMethod, DEFAULT_WATERMARK_CONFIG } from '../types';
import { removeWatermark, downloadImage } from '../services/watermarkService';
import { formatFileSize } from '../utils/imageProcessing';
import { ImageDropzone } from './ImageDropzone';
import { ImageCompare } from './ImageCompare';

const METHODS: { id: WatermarkMethod; label: string; icon: string; desc: string }[] = [
  { id: 'gemini-splash', label: 'Gemini Splash (Auto)', icon: '✨', desc: 'Hapus watermark Google Gemini di pojok kanan bawah' },
  { id: 'alpha-composite', label: 'Alpha Compositing', icon: '🔄', desc: 'Reverse formula watermark transparan' },
  { id: 'frequency-perturbation', label: 'Frequency Perturbation', icon: '📊', desc: 'Disrupsi pola frekuensi pixel' },
  { id: 'smart-noise', label: 'Smart Noise', icon: '🎲', desc: 'Noise adaptif terarah' },
  { id: 'combined', label: 'Combined Legacy', icon: '💎', desc: 'Gabungan metode lama' },
];

const FORMATS: { id: 'png' | 'jpeg' | 'webp'; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPEG' },
  { id: 'webp', label: 'WebP' },
];

export const WatermarkRemover: React.FC = () => {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultInfo, setResultInfo] = useState<{ width: number; height: number; originalSize: number; processedSize: number } | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setOriginalFile(file);
    setProcessedImage(null);
    setResultInfo(null);
    const url = URL.createObjectURL(file);
    setOriginalPreview(url);
  }, []);

  const handleProcess = async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    setProgress(0);
    setProcessedImage(null);

    try {
      const result = await removeWatermark(originalFile, config, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setProcessedImage(result.dataUrl);
      setResultInfo({
        width: result.width,
        height: result.height,
        originalSize: result.originalSize,
        processedSize: result.processedSize,
      });
    } catch (err: any) {
      console.error(err);
      alert('Gagal memproses gambar: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage || !originalFile) return;
    const ext = config.outputFormat;
    const baseName = originalFile.name.replace(/\.[^.]+$/, '');
    downloadImage(processedImage, `${baseName}_no-watermark.${ext}`);
  };

  const handleReset = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalFile(null);
    setOriginalPreview(null);
    setProcessedImage(null);
    setResultInfo(null);
    setProgress(0);
    setStatusText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0' }}>
      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel — Settings */}
        <div style={{
          width: '340px',
          flexShrink: 0,
          padding: '20px',
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
        }}>
          {/* Upload Area */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Upload Gambar</span>
            </div>
            <ImageDropzone
              onFileSelect={handleFileSelect}
              previewUrl={originalPreview}
              fileName={originalFile?.name || null}
              disabled={isProcessing}
            />
          </div>

          {/* Method Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Metode</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {METHODS.map(m => {
                const isActive = config.method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setConfig(prev => ({ ...prev, method: m.id }))}
                    disabled={isProcessing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: isActive ? 'var(--accent-gold-dim)' : 'var(--bg-glass)',
                      border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      textAlign: 'left' as const,
                      transition: 'all var(--transition-normal)',
                      width: '100%',
                      color: 'inherit',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Intensitas: {config.intensity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={config.intensity}
              onChange={e => setConfig(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
              disabled={isProcessing}
              style={{
                width: '100%',
                accentColor: 'var(--accent-gold)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              <span>Lembut</span>
              <span>Agresif</span>
            </div>
          </div>

          {/* Output Format */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Format Output</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {FORMATS.map(f => {
                const isActive = config.outputFormat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setConfig(prev => ({ ...prev, outputFormat: f.id }))}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: isActive ? 'var(--accent-gold-dim)' : 'var(--bg-glass)',
                      border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      fontFamily: 'inherit',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Slider */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Kualitas Output: {config.outputQuality}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={config.outputQuality}
              onChange={e => setConfig(prev => ({ ...prev, outputQuality: parseInt(e.target.value) }))}
              disabled={isProcessing}
              style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
            />
          </div>

          {/* Options */}
          <div style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span>Opsi</span>
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}>
              <input
                type="checkbox"
                checked={config.preserveQuality}
                onChange={e => setConfig(prev => ({ ...prev, preserveQuality: e.target.checked }))}
                disabled={isProcessing}
                style={{ accentColor: 'var(--accent-gold)' }}
              />
              Preserve Quality (Sharpening)
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}>
              <input
                type="checkbox"
                checked={config.stripMetadata}
                onChange={e => setConfig(prev => ({ ...prev, stripMetadata: e.target.checked }))}
                disabled={isProcessing}
                style={{ accentColor: 'var(--accent-gold)' }}
              />
              Strip Metadata (EXIF)
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-premium btn-gold"
              onClick={handleProcess}
              disabled={!originalFile || isProcessing}
              style={{ width: '100%', padding: '12px' }}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                  </svg>
                  Memproses... {progress}%
                </>
              ) : (
                <>🧹 Hapus Watermark</>
              )}
            </button>

            {processedImage && (
              <>
                <button
                  className="btn-premium btn-emerald"
                  onClick={handleDownload}
                  style={{ width: '100%', padding: '12px' }}
                >
                  💾 Download Hasil
                </button>
                <button
                  className="btn-premium btn-ghost"
                  onClick={handleReset}
                  style={{ width: '100%', padding: '10px' }}
                >
                  🗑️ Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Panel — Preview */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}>
          {/* Processing Progress */}
          {isProcessing && (
            <div style={{ width: '100%', maxWidth: '500px', marginBottom: '20px' }} className="animate-fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                  {statusText}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Compare View */}
          {originalPreview && processedImage ? (
            <div style={{ width: '100%', maxWidth: '700px' }} className="animate-fadeIn">
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  📸 Perbandingan Before / After
                </span>
                {resultInfo && (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {resultInfo.width}×{resultInfo.height}px • {formatFileSize(resultInfo.originalSize)} → {formatFileSize(resultInfo.processedSize)}
                  </span>
                )}
              </div>
              <ImageCompare originalSrc={originalPreview} processedSrc={processedImage} />
            </div>
          ) : originalPreview ? (
            <div style={{ textAlign: 'center' }} className="animate-fadeIn">
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                maxWidth: '500px',
                margin: '0 auto',
              }}>
                <img
                  src={originalPreview}
                  alt="Original"
                  style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                Atur pengaturan di panel kiri, lalu klik "Hapus Watermark"
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🖼️</div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Upload gambar untuk memulai
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Drag & drop atau klik area upload di panel kiri
              </p>
              <div style={{
                marginTop: '24px',
                padding: '12px 16px',
                background: 'var(--accent-emerald-dim)',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
              }}>
                <p style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>
                  🔒 Privasi 100% — Semua proses di browser, gambar tidak pernah di-upload ke server
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

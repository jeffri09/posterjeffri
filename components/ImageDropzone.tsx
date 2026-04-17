import React, { useCallback, useState, useRef } from 'react';

interface ImageDropzoneProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  fileName: string | null;
  disabled?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onFileSelect,
  previewUrl,
  fileName,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diizinkan (PNG, JPG, WebP)');
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (previewUrl) {
    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <img
            src={previewUrl}
            alt={fileName || 'Preview'}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '300px',
              objectFit: 'contain',
              background: 'var(--bg-secondary)',
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          marginTop: '8px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            📎 {fileName}
          </span>
          <button
            onClick={handleClick}
            className="btn-premium btn-ghost"
            style={{ padding: '6px 12px', fontSize: '11px' }}
            disabled={disabled}
          >
            Ganti Gambar
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isDragOver ? 'var(--accent-gold-dim)' : 'var(--bg-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          transition: 'all var(--transition-normal)',
        }}>
          {isDragOver ? '📥' : '🖼️'}
        </div>
        <div>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isDragOver ? 'var(--accent-gold)' : 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            {isDragOver ? 'Lepaskan gambar di sini' : 'Drag & drop gambar di sini'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            atau klik untuk browse • PNG, JPG, WebP
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

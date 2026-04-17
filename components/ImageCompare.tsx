import React, { useRef, useState, useCallback, useEffect } from 'react';

interface ImageCompareProps {
  originalSrc: string;
  processedSrc: string;
}

export const ImageCompare: React.FC<ImageCompareProps> = ({ originalSrc, processedSrc }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const handleTouchEnd = () => setIsDragging(false);

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className="compare-container"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Processed image (full background) */}
      <img src={processedSrc} alt="Processed" style={{ display: 'block', width: '100%', height: 'auto' }} />

      {/* Original image (clipped) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: `inset(0 ${100 - position}% 0 0)`,
      }}>
        <img src={originalSrc} alt="Original" style={{ display: 'block', width: '100%', height: 'auto' }} />
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'white',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        Original
      </div>
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        padding: '4px 10px',
        background: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'white',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        Processed
      </div>

      {/* Slider line */}
      <div className="compare-slider" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
        <div className="compare-handle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M8 5L3 12L8 19M16 5L21 12L16 19" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

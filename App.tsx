import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppTab,
  PosterCategory, 
  PosterFormData, 
  PromptPreset,
  INITIAL_FORM_DATA 
} from './types';
import { generatePosterPrompt } from './services/promptGenerator';
import { generatePosterContent, generateBatchPosterContent } from './services/geminiService';
import { saveAs } from 'file-saver';
import { PRESET_TECHNIQUE_IDS } from './constants/techniques';
import { TabNavigation } from './components/TabNavigation';
import { TechniqueSelector } from './components/TechniqueSelector';
import { ArticleGenerator } from './components/ArticleGenerator';
import { InputGroup } from './components/InputGroup';
import { Settings } from './components/Settings';

const App: React.FC = () => {
  // --- App State ---
  const [activeTab, setActiveTab] = useState<AppTab>('generator');

  // --- Generator State ---
  const [category] = useState<PosterCategory>('dakwah');
  const [formData, setFormData] = useState<PosterFormData>(INITIAL_FORM_DATA);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [topicInput, setTopicInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preset, setPreset] = useState<PromptPreset>('standard');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>(
    [...PRESET_TECHNIQUE_IDS['standard']]
  );
  const [showTechniquePanel, setShowTechniquePanel] = useState(false);

  // --- Batch Generation State ---
  const [batchCount, setBatchCount] = useState<number>(10);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });

  // --- Generate prompt whenever inputs change ---
  useEffect(() => {
    const prompt = generatePosterPrompt(category, formData, selectedTechniques);
    setGeneratedPrompt(prompt);
  }, [category, formData, selectedTechniques]);

  // --- Prompt character count ---
  const promptStats = useMemo(() => {
    const chars = generatedPrompt.length;
    const lines = generatedPrompt.split('\n').length;
    const words = generatedPrompt.split(/\s+/).filter(Boolean).length;
    return { chars, lines, words };
  }, [generatedPrompt]);

  const handleInputChange = (field: keyof PosterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateContent = async () => {
    if (!topicInput.trim()) {
      alert("Masukkan topik dakwah terlebih dahulu.");
      return;
    }
    setIsGenerating(true);
    try {
      const generatedData = await generatePosterContent(topicInput);
      setFormData(prev => ({ ...prev, ...generatedData }));
    } catch (e: any) {
      console.error(e);
      alert("Gagal membuat konten: " + (e.message || "Pastikan API Key valid dan memiliki izin."));
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Batch Generate Handler ---
  const handleBatchGenerate = async () => {
    if (!topicInput.trim()) {
      alert("Masukkan topik dakwah terlebih dahulu.");
      return;
    }
    if (batchCount < 2) {
      alert("Jumlah prompt minimal 2.");
      return;
    }
    setIsBatchGenerating(true);
    setBatchProgress({ completed: 0, total: batchCount });
    try {
      // 1. Generate semua konten via batch chunking
      const batchResults = await generateBatchPosterContent(
        topicInput,
        batchCount,
        (completed, total) => setBatchProgress({ completed, total })
      );

      // 2. Rakit setiap konten menjadi prompt final menggunakan promptGenerator
      const allPrompts: string[] = [];
      for (let i = 0; i < batchResults.length; i++) {
        const data: PosterFormData = { ...INITIAL_FORM_DATA, ...batchResults[i] };
        const promptText = generatePosterPrompt(category, data, selectedTechniques);
        allPrompts.push(
          `╔══════════════════════════════════════╗\n` +
          `║        PROMPT ${(i + 1).toString().padStart(2, ' ')} dari ${batchResults.length.toString().padStart(2, ' ')}             ║\n` +
          `╚══════════════════════════════════════╝\n\n` +
          promptText +
          `\n\n═══════════════ END ═══════════════\n`
        );
      }

      // 3. Gabung dan download sebagai .txt
      const finalText = allPrompts.join('\n\n');
      const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' });
      const safeTopic = topicInput.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 30);
      saveAs(blob, `poster-batch-${safeTopic}-${batchResults.length}.txt`);

      alert(`✅ Berhasil! ${batchResults.length} prompt telah diunduh.`);
    } catch (e: any) {
      console.error(e);
      alert("Gagal batch generate: " + (e.message || "Pastikan API Key valid."));
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress({ completed: 0, total: 0 });
    }
  };

  // --- RENDER ---
  return (
    <div className="app-container">
      
      {/* ═══ TOP NAVIGATION ═══ */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-gold), #c4983e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            color: '#0a0a0f',
            boxShadow: '0 2px 12px rgba(212, 168, 83, 0.3)',
          }}>
            JP
          </div>
          <div>
            <h1 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              margin: 0,
              background: 'linear-gradient(135deg, var(--accent-gold), #e8c76a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Jeffri Poster
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>
              Prompt Poster Dakwah Bermanhaj Salaf
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Version Badge */}
        <div className="badge badge-gold">v2.0</div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      {activeTab === 'generator' ? (
        <div className="main-content">
          
          {/* ═══ LEFT PANEL — Input & Techniques ═══ */}
          <div className="left-panel">
            <div style={{ padding: '20px' }}>

              {/* AI Content Generation */}
              <div style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
              }}>
                <div className="section-header" style={{ marginBottom: '10px' }}>
                  <span>🤖 AI Content Generator</span>
                </div>

                <div style={{
                  padding: '10px 12px',
                  background: 'var(--accent-blue-dim)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '12px',
                }}>
                  <p style={{ fontSize: '11px', color: 'var(--accent-blue)', lineHeight: 1.5 }}>
                    Masukkan topik (misal: "Sabar", "Birrul Walidain"). AI Gemini 3.1 Flash Lite akan otomatis mencari <strong>Dalil (Al-Quran/Hadits Shahih)</strong>, membuat <strong>Judul</strong>, <strong>Nasihat</strong>, dan <strong>Visual Context</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Ketik topik dakwah..."
                      className="input-premium"
                      style={{ paddingLeft: '34px' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateContent()}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      opacity: 0.5,
                    }}>🔍</span>
                  </div>
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className="btn-premium btn-gold"
                    style={{ minWidth: '100px' }}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                        </svg>
                        Proses...
                      </>
                    ) : (
                      <>✨ Generate</>
                    )}
                  </button>
                </div>

                {/* ═══ BATCH GENERATION SECTION ═══ */}
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(212, 168, 83, 0.08))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px' }}>📦</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple, #8b5cf6)' }}>Batch Generate</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '10px', lineHeight: 1.5 }}>
                    Generate banyak prompt sekaligus dan unduh sebagai file <strong>.txt</strong>. Setiap prompt dijamin beda dalil, judul, dan visual.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Jumlah:</label>
                      <input
                        type="number"
                        min={2}
                        max={100}
                        value={batchCount}
                        onChange={(e) => setBatchCount(Math.max(2, parseInt(e.target.value) || 2))}
                        className="input-premium"
                        style={{ width: '65px', textAlign: 'center', padding: '6px 8px' }}
                        disabled={isBatchGenerating}
                      />
                    </div>
                    <button
                      onClick={handleBatchGenerate}
                      disabled={isBatchGenerating || isGenerating}
                      className="btn-premium btn-ghost"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: isBatchGenerating ? 'var(--bg-glass)' : 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: 'var(--accent-purple, #8b5cf6)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {isBatchGenerating ? (
                        <>
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                          </svg>
                          Memproses...
                        </>
                      ) : (
                        <>📦 Batch Generate & Download .txt</>
                      )}
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  {isBatchGenerating && batchProgress.total > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--accent-purple, #8b5cf6)', fontWeight: 600 }}>
                          ⏳ Memproses {batchProgress.completed} dari {batchProgress.total}...
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {Math.round((batchProgress.completed / batchProgress.total) * 100)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${(batchProgress.completed / batchProgress.total) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #8b5cf6, #d4a853)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InputGroup label="Judul Poster (Headline)">
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="input-premium"
                      style={{ fontWeight: 700 }}
                      placeholder="Judul akan muncul otomatis..."
                    />
                  </InputGroup>

                  <InputGroup label="Dalil Utama (Arab)">
                    <textarea
                      value={formData.quoteArabic || ''}
                      onChange={(e) => handleInputChange('quoteArabic', e.target.value)}
                      className="textarea-premium textarea-arabic"
                      style={{ height: '80px' }}
                      placeholder="Teks Arab akan muncul di sini..."
                    />
                  </InputGroup>

                  <InputGroup label="Terjemahan Dalil">
                    <textarea
                      value={formData.quoteTranslation || ''}
                      onChange={(e) => handleInputChange('quoteTranslation', e.target.value)}
                      className="textarea-premium"
                      style={{ height: '60px' }}
                      placeholder="Terjemahan..."
                    />
                  </InputGroup>

                  <InputGroup label="Nasihat / Penjelasan">
                    <textarea
                      value={formData.advice || ''}
                      onChange={(e) => handleInputChange('advice', e.target.value)}
                      className="textarea-premium"
                      style={{ height: '60px' }}
                      placeholder="Nasihat akan muncul otomatis..."
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Visual Settings */}
              <div style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
              }}>
                <div className="section-header" style={{ marginBottom: '10px' }}>
                  <span>🎨 Arah Visual</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InputGroup label="Deskripsi Visual Background">
                    <textarea
                      value={formData.visualContext || ''}
                      onChange={(e) => handleInputChange('visualContext', e.target.value)}
                      className="textarea-premium"
                      style={{ height: '80px' }}
                      placeholder="Deskripsi visual akan muncul otomatis..."
                    />
                  </InputGroup>

                  <InputGroup label="Palet Warna">
                    <textarea
                      value={formData.colorPalette || ''}
                      onChange={(e) => handleInputChange('colorPalette', e.target.value)}
                      className="textarea-premium"
                      style={{ height: '80px' }}
                      placeholder="Palet warna akan muncul otomatis..."
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Technique Selector Toggle */}
              <button
                onClick={() => setShowTechniquePanel(!showTechniquePanel)}
                className="btn-premium btn-ghost"
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  justifyContent: 'space-between',
                }}
              >
                <span>🧠 Teknik Prompting ({selectedTechniques.length} aktif)</span>
                <span style={{ 
                  transform: showTechniquePanel ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-normal)',
                  fontSize: '12px',
                }}>▼</span>
              </button>

              {showTechniquePanel && (
                <div className="animate-fadeIn" style={{
                  padding: '16px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <TechniqueSelector
                    selectedTechniques={selectedTechniques}
                    onTechniquesChange={setSelectedTechniques}
                    preset={preset}
                    onPresetChange={setPreset}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT PANEL — Prompt Output ═══ */}
          <div className="right-panel">
            {/* Header */}
            <div className="prompt-output-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  📄 Output Prompt
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                  Salin dan tempel ke Gemini / AI Image Generator
                </p>
              </div>
              <div className="prompt-output-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '6px 12px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {promptStats.chars.toLocaleString()} chars
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {promptStats.lines} lines
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {promptStats.words.toLocaleString()} words
                  </span>
                </div>
                {/* Copy Button */}
                <button
                  onClick={copyToClipboard}
                  className={`btn-premium ${isCopied ? 'btn-emerald' : 'btn-gold'}`}
                  style={{ padding: '8px 16px' }}
                >
                  {isCopied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Prompt Output */}
            <div 
              className="prompt-output" 
              style={{ flex: 1, overflow: 'auto' }}
              dangerouslySetInnerHTML={{
                __html: generatedPrompt
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-emerald)">$1</strong>')
                  .replace(/(════════════════════════════════════\n)([A-Z &]+)(\n════════════════════════════════════)/g, '<span style="color: var(--accent-gold)">$1<strong>$2</strong>$3</span>')
                  .replace(/(═══.*?═══)/g, '<strong style="color: var(--accent-gold)">$1</strong>')
                  .replace(/\[(.*?)\]/g, '<span style="color: var(--accent-purple)">[$1]</span>')
              }}
            />

            {/* Bottom Tips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ color: 'var(--accent-gold)', fontSize: '12px', flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>
                  Pastikan file <strong>logo.png</strong> sudah disiapkan dan diupload bersama prompt.
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ color: 'var(--accent-gold)', fontSize: '12px', flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>
                  Makhluk bernyawa ditampilkan sebagai kartun tanpa wajah.
                </p>
              </div>
            </div>
          </div>
        </div>

      ) : activeTab === 'artikel' ? (
        /* ═══ ARTIKEL SALAF TAB ═══ */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ArticleGenerator />
        </div>
      ) : (
        /* ═══ SETTINGS TAB ═══ */
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          <Settings />
        </div>
      )}
    </div>
  );
};

export default App;
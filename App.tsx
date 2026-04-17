import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppTab,
  PosterCategory, 
  PosterFormData, 
  PromptPreset,
  INITIAL_FORM_DATA 
} from './types';
import { generatePosterPrompt } from './services/promptGenerator';
import { generatePosterContent } from './services/geminiService';
import { PRESET_TECHNIQUE_IDS } from './constants/techniques';
import { TabNavigation } from './components/TabNavigation';
import { TechniqueSelector } from './components/TechniqueSelector';
import { WatermarkRemover } from './components/WatermarkRemover';
import { InputGroup } from './components/InputGroup';

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

  // --- RENDER ---
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', sans-serif",
    }}>
      
      {/* ═══ TOP NAVIGATION ═══ */}
      <nav style={{
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* ═══ LEFT PANEL — Input & Techniques ═══ */}
          <div style={{
            width: '420px',
            flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            height: 'calc(100vh - 63px)',
          }}>
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
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
            height: 'calc(100vh - 63px)',
            overflow: 'hidden',
            padding: '20px',
          }}>
            {/* Header */}
            <div style={{
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <div className="prompt-output" style={{ flex: 1, overflow: 'auto' }}>
              {generatedPrompt}
            </div>

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
                  Tidak boleh ada elemen manusia/makhluk hidup dalam poster.
                </p>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ═══ WATERMARK REMOVER TAB ═══ */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WatermarkRemover />
        </div>
      )}
    </div>
  );
};

export default App;
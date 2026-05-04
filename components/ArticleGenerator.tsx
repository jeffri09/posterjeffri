import React, { useState } from 'react';
import { generateArticleContent, ArticleContent, ArticleStats } from '../services/articleService';
import { generateAndDownloadDocx } from '../utils/docxGenerator';
import { InputGroup } from './InputGroup';

const StatBadge: React.FC<{ label: string; value: string | number; icon: string; good?: boolean }> = ({ label, value, icon, good }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
    border: `1px solid ${good === false ? '#ef4444' : good ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
    minWidth: '80px',
  }}>
    <span style={{ fontSize: '16px' }}>{icon}</span>
    <span style={{ fontSize: '16px', fontWeight: 700, color: good === false ? '#ef4444' : good ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{value}</span>
    <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', textAlign: 'center' }}>{label}</span>
  </div>
);

export const ArticleGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [reference, setReference] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<ArticleContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<ArticleContent[]>(() => {
    try {
      const saved = localStorage.getItem('articleHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const handleGenerate = async () => {
    if (!topic.trim()) { alert("Masukkan topik artikel terlebih dahulu."); return; }
    setIsGenerating(true);
    setProgress(0);
    setProgressMsg('Memulai...');
    setGeneratedArticle(null);
    setShowPreview(false);
    try {
      const content = await generateArticleContent(topic, reference, (percent, msg) => {
        setProgress(percent);
        setProgressMsg(msg);
      });
      setGeneratedArticle(content);
      setShowPreview(true);
      const newHistory = [content, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('articleHistory', JSON.stringify(newHistory));
    } catch (e: any) {
      console.error(e);
      alert("Gagal membuat artikel: " + (e.message || "Terjadi kesalahan."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (article: ArticleContent) => {
    try { await generateAndDownloadDocx(article); }
    catch (e) { console.error(e); alert("Gagal mengunduh file DOCX."); }
  };

  const stats: ArticleStats | undefined = generatedArticle?.stats;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{
        padding: '24px', background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--accent-gold), #c4983e)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>📄</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Generator Artikel Salaf</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Buat artikel dakwah mendalam sesuai manhaj salaf. Hasil diunduh sebagai file .docx siap cetak.
            </p>
          </div>
        </div>

        {/* Input Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputGroup label="Topik Kajian (Wajib)">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="input-premium" placeholder="Contoh: Keutamaan Tauhid, Bahaya Syirik..."
              style={{ padding: '12px' }} />
          </InputGroup>

          <InputGroup label="Referensi / Rujukan Tambahan (Opsional)">
            <textarea value={reference} onChange={(e) => setReference(e.target.value)}
              className="textarea-premium"
              placeholder="Masukkan teks dari ebook, link, atau judul kitab untuk referensi artikel..."
              style={{ minHeight: '120px', padding: '12px' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Anda dapat menyalin (copy-paste) bagian dari buku atau memberikan arahan spesifik di sini.
            </p>
          </InputGroup>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <button onClick={handleGenerate} disabled={isGenerating}
              className="btn-premium btn-ghost"
              style={{ padding: '14px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>
              {isGenerating ? "⏳ Sedang Memproses..." : "✨ Generate Artikel"}
            </button>

            {/* Progress Bar */}
            {isGenerating && (
              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                  <span>{progressMsg}</span><span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: progress + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), #c4983e)', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ QUALITY STATS & PREVIEW ═══ */}
        {generatedArticle && !isGenerating && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            {/* Stats Dashboard */}
            {stats && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📊</span> Statistik Kualitas Artikel
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <StatBadge icon="📝" label="Kata Latin" value={stats.totalLatinWords.toLocaleString()} good={stats.totalLatinWords >= 3500} />
                  <StatBadge icon="📖" label="Kata Efektif" value={stats.totalEffectiveWords.toLocaleString()} good={stats.totalEffectiveWords >= 4000} />
                  <StatBadge icon="🕌" label="Ayat Qur'an" value={stats.ayatCount} good={stats.ayatCount >= 5} />
                  <StatBadge icon="📜" label="Hadits" value={stats.haditsCount} good={stats.haditsCount >= 5} />
                  <StatBadge icon="👤" label="Kutipan Ulama" value={stats.ulamaQuoteCount} good={stats.ulamaQuoteCount >= 5} />
                  <StatBadge icon="⚖️" label="Rasio Dalil" value={stats.dalilRatio + '%'} good={stats.dalilRatio >= 25} />
                  <StatBadge icon="¶" label="Paragraf" value={stats.totalParagraphs} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => handleDownload(generatedArticle)} className="btn-premium btn-gold"
                style={{ padding: '14px', fontSize: '14px', fontWeight: 600, flex: 1 }}>
                📥 Download DOCX
              </button>
              <button onClick={() => setShowPreview(!showPreview)} className="btn-premium btn-ghost"
                style={{ padding: '14px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                {showPreview ? '🔼 Tutup Preview' : '👁️ Preview'}
              </button>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div style={{
                maxHeight: '500px', overflowY: 'auto', padding: '20px',
                background: '#ffffff', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', color: '#1a1a1a',
              }}>
                <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#111' }}>
                  {generatedArticle.title}
                </h2>
                {generatedArticle.paragraphs.map((p, i) => {
                  const isArabic = p.type === 'arabic';
                  return (
                    <p key={i} style={{
                      direction: isArabic ? 'rtl' : 'ltr',
                      textAlign: isArabic ? 'right' : (p.align === 'center' ? 'center' : 'justify') as any,
                      fontFamily: isArabic ? '"Traditional Arabic", "Amiri", serif' : 'Calibri, sans-serif',
                      fontSize: isArabic ? '18px' : (p.bold ? '13px' : '12px'),
                      fontWeight: p.bold ? 700 : 400,
                      lineHeight: isArabic ? 2.2 : 1.6,
                      margin: p.bold ? '18px 0 6px' : '4px 0',
                      color: isArabic ? '#1a5f2a' : (p.bold ? '#0e2f73' : '#222'),
                    }}>
                      {p.text}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Specs */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Spesifikasi Dokumen:</h3>
          <ul style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '16px', margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <li>Kertas F4, Margin 2cm</li><li>Spasi 1.0</li>
            <li>Teks Latin: Calibri 11pt</li><li>Teks Arab: Traditional Arabic 16pt</li>
            <li>Rujukan otomatis di akhir</li><li>5 tahap generasi + validasi</li>
          </ul>
        </div>

        {/* Anti-Halusinasi */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>🛡️</span> Fitur Anti-Halusinasi:
          </h3>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
            background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div>✅ System Instruction ketat</div>
            <div>✅ Chain Context antar bagian</div>
            <div>✅ Validasi struktur JSON</div>
            <div>✅ Rujukan dari konten nyata</div>
            <div>✅ Kualitas dalil {">"} kuantitas</div>
            <div>✅ Few-shot example format</div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🕒</span> Riwayat Artikel Terakhir
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-primary)', padding: '10px 12px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                    {item.title}
                  </div>
                  <button onClick={() => handleDownload(item)}
                    style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--accent-gold)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    Unduh
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

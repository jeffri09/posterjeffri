import React, { useState } from 'react';
import { generateArticleContent } from '../services/articleService';
import { generateAndDownloadDocx } from '../utils/docxGenerator';
import { InputGroup } from './InputGroup';

export const ArticleGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [reference, setReference] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedArticle, setGeneratedArticle] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Masukkan topik artikel terlebih dahulu.");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedArticle(null); // Reset previous
    try {
      const content = await generateArticleContent(topic, reference);
      setGeneratedArticle(content);
    } catch (e: any) {
      console.error(e);
      alert("Gagal membuat artikel: " + (e.message || "Terjadi kesalahan."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (generatedArticle) {
      try {
        await generateAndDownloadDocx(generatedArticle);
      } catch (e) {
        console.error(e);
        alert("Gagal mengunduh file DOCX.");
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{
        padding: '24px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--accent-gold), #c4983e)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>📄</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Generator Artikel Salaf</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Buat artikel dakwah mendalam sesuai manhaj salaf. Hasil akan diunduh sebagai file .docx siap cetak.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputGroup label="Topik Kajian (Wajib)">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-premium"
              placeholder="Contoh: Keutamaan Tauhid, Bahaya Syirik..."
              style={{ padding: '12px' }}
            />
          </InputGroup>

          <InputGroup label="Referensi / Rujukan Tambahan (Opsional)">
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="textarea-premium"
              placeholder="Masukkan teks dari ebook, link, atau judul kitab untuk referensi artikel..."
              style={{ minHeight: '120px', padding: '12px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Anda dapat menyalin (copy-paste) bagian dari buku atau memberikan arahan spesifik di sini.
            </p>
          </InputGroup>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-premium btn-ghost"
              style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
            >
              {isGenerating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                  </svg>
                  AI Sedang Menulis Artikel (~60-90 detik)...
                </span>
              ) : (
                "✨ Generate Artikel"
              )}
            </button>

            {generatedArticle && (
              <button
                onClick={handleDownload}
                className="btn-premium btn-gold"
                style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600 }}
              >
                📥 Download "{generatedArticle.title.substring(0, 20)}..." (DOCX)
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Spesifikasi Dokumen:</h3>
          <ul style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '16px', margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <li>Kertas F4, Margin 2cm</li>
            <li>Spasi 1.0</li>
            <li>Teks Latin: Calibri 11pt</li>
            <li>Teks Arab: Traditional Arabic 16pt</li>
            <li>Rujukan di akhir artikel</li>
          </ul>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>🛡️</span> Basis Data Rujukan Resmi (Anti-Halusinasi):
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>AI dikunci secara ketat untuk merujuk pada direktori dan ulama berikut:</p>
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--text-tertiary)', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '6px',
            background: 'var(--bg-primary)',
            padding: '12px',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>• IbnTaymiyyah.com</div>
            <div>• IbnAlQayyim.com</div>
            <div>• BinBaz.org.sa</div>
            <div>• AlAlbany.net</div>
            <div>• BinOthaimeen.net</div>
            <div>• AlFawzan.af.org.sa</div>
            <div>• Muqbil.net</div>
            <div>• Rabee.net</div>
            <div>• Alifta.gov.sa (Lajnah Da'imah)</div>
            <div>• Wafee.co & Tafsir.net</div>
            <div style={{ gridColumn: 'span 2' }}>• EbookSunnah.com & IslamHouse.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

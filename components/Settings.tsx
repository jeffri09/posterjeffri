import React, { useState, useEffect } from 'react';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.1-flash-lite');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey') || '';
    const savedModel = localStorage.getItem('geminiModel') || 'gemini-3.1-flash-lite';
    setApiKey(savedKey);
    setModel(savedModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    localStorage.setItem('geminiModel', model);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-gold)' }}>
          Pengaturan Sistem
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '32px' }}>
          Konfigurasi API Key dan Model AI untuk Generator Poster.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            Dapatkan API Key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-emerald)' }}>Google AI Studio</a>.
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Model Gemini
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Default - Tercepat)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Opsi - Kualitas Tinggi)</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Opsi - Alternatif)</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className={`btn-premium ${isSaved ? 'btn-emerald' : 'btn-gold'}`}
          style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600 }}
        >
          {isSaved ? '✅ Pengaturan Disimpan' : '💾 Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
};

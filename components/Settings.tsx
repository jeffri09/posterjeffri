import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.1-flash-lite');
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });

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

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Menguji koneksi...' });
    try {
      // @ts-ignore
      const systemApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
      const activeApiKey = apiKey || systemApiKey;
      if (!activeApiKey) {
        throw new Error("API Key belum diisi (baik oleh Anda maupun default sistem).");
      }
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const response = await ai.models.generateContent({
        model: model,
        contents: "Balas dengan 'Koneksi Berhasil' jika Anda menerima pesan ini."
      });
      if (response.text) {
        setTestResult({ status: 'success', message: 'Koneksi berhasil! ' + response.text });
      } else {
        throw new Error("Respons kosong dari model.");
      }
    } catch (e: any) {
      setTestResult({ status: 'error', message: 'Koneksi gagal: ' + (e.message || String(e)) });
    }
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
            Gemini API Key (Opsional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Biarkan kosong untuk menggunakan default sistem..."
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
            Dapatkan API Key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-emerald)' }}>Google AI Studio</a>. Jika kosong, sistem akan menggunakan API Key bawaan.
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

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={handleSave}
            className={`btn-premium ${isSaved ? 'btn-emerald' : 'btn-gold'}`}
            style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: 600 }}
          >
            {isSaved ? '✅ Pengaturan Disimpan' : '💾 Simpan Pengaturan'}
          </button>
          
          <button
            onClick={handleTestConnection}
            disabled={testResult.status === 'testing'}
            className="btn-premium btn-ghost"
            style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: 600, border: '1px solid var(--border-subtle)' }}
          >
            {testResult.status === 'testing' ? 'Menguji...' : '🔌 Test Koneksi'}
          </button>
        </div>

        {testResult.status !== 'idle' && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            background: testResult.status === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                        testResult.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)',
            color: testResult.status === 'success' ? 'var(--accent-emerald)' :
                   testResult.status === 'error' ? '#ef4444' : 'var(--text-secondary)',
            border: `1px solid ${
              testResult.status === 'success' ? 'rgba(16, 185, 129, 0.2)' :
              testResult.status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)'
            }`
          }}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

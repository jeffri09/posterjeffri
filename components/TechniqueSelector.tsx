import React from 'react';
import { PromptTechnique, PromptPreset, TechniqueCategory, PRESET_CONFIGS } from '../types';
import { TECHNIQUES, PRESET_TECHNIQUE_IDS, CATEGORY_LABELS } from '../constants/techniques';

interface TechniqueSelectorProps {
  selectedTechniques: string[];
  onTechniquesChange: (techniques: string[]) => void;
  preset: PromptPreset;
  onPresetChange: (preset: PromptPreset) => void;
}

export const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({
  selectedTechniques,
  onTechniquesChange,
  preset,
  onPresetChange,
}) => {
  const handlePresetClick = (p: PromptPreset) => {
    onPresetChange(p);
    onTechniquesChange([...PRESET_TECHNIQUE_IDS[p]]);
  };

  const toggleTechnique = (id: string) => {
    if (selectedTechniques.includes(id)) {
      onTechniquesChange(selectedTechniques.filter(t => t !== id));
    } else {
      onTechniquesChange([...selectedTechniques, id]);
    }
  };

  const categories: TechniqueCategory[] = ['reasoning', 'generation', 'optimization', 'validation'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Preset Buttons */}
      <div>
        <div className="section-header">
          <span>Preset Mode</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {(Object.keys(PRESET_CONFIGS) as PromptPreset[]).map(p => {
            const cfg = PRESET_CONFIGS[p];
            const isActive = preset === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetClick(p)}
                style={{
                  padding: '10px 12px',
                  background: isActive ? `${cfg.color}22` : 'var(--bg-glass)',
                  border: `1px solid ${isActive ? cfg.color : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-normal)',
                  ...(isActive ? { boxShadow: `0 0 20px ${cfg.color}33` } : {}),
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: isActive ? cfg.color : 'var(--text-primary)', marginBottom: '2px' }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {cfg.description} • {cfg.techniqueCount}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Technique Grid by Category */}
      <div>
        <div className="section-header">
          <span>Teknik Aktif: {selectedTechniques.length}/{TECHNIQUES.length}</span>
        </div>

        {categories.map(cat => {
          const catTechniques = TECHNIQUES.filter(t => t.category === cat);
          const catLabel = CATEGORY_LABELS[cat];
          
          return (
            <div key={cat} style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                marginBottom: '6px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: catLabel.color,
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: catLabel.color 
                }} />
                {catLabel.label}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {catTechniques.map(tech => {
                  const isActive = selectedTechniques.includes(tech.id);
                  return (
                    <div
                      key={tech.id}
                      className={`technique-card ${isActive ? 'active' : ''}`}
                      onClick={() => toggleTechnique(tech.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        padding: '8px 12px',
                      }}
                    >
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{tech.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {tech.name}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {tech.description}
                        </div>
                      </div>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-medium)'}`,
                        background: isActive ? 'var(--accent-gold)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all var(--transition-fast)',
                      }}>
                        {isActive && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

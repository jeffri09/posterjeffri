import React from 'react';
import { AppTab } from '../types';

interface TabNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: AppTab; label: string; icon: string }[] = [
    { id: 'generator', label: 'Prompt Generator', icon: '✨' },
    { id: 'watermark', label: 'Watermark Remover', icon: '🧹' },
  ];

  return (
    <div className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span style={{ marginRight: '6px' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

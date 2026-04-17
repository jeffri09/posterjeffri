import React from 'react';

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children, className = "" }) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label className="label-premium">
      {label}
    </label>
    {children}
  </div>
);
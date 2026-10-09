import React from 'react';

export const Filter = ({
  label,
  options = [],
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`filter-item ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {label && <label className="form-hint" style={{ fontWeight: 600 }}>{label}:</label>}
      <select
        className="select-control"
        style={{ width: 'auto', minWidth: '140px', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
};

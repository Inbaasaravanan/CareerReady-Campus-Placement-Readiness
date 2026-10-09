import React from 'react';
import { SearchIcon } from './Icons';

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search by name, reg number or department...',
  className = ''
}) => {
  return (
    <div className={`search-input-wrap ${className}`}>
      <SearchIcon className="search-icon" aria-hidden="true" />
      <input
        type="search"
        className="input-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
};

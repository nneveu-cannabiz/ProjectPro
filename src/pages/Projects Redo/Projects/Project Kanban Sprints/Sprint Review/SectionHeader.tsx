import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';

interface SectionHeaderProps {
  title: string;
  className?: string;
  showSelectRows?: boolean;
  onSelectRowsToggle?: () => void;
  isSelectionMode?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  className = "", 
  showSelectRows = false,
  onSelectRowsToggle,
  isSelectionMode = false
}) => {
  return (
    <div 
      className={`px-4 py-2 mb-3 rounded-t flex items-center justify-between ${className}`}
      style={{ backgroundColor: brandTheme.primary.navy }}
    >
      <h3 className="text-base font-bold text-white">
        {title}
      </h3>
      
      {showSelectRows && (
        <button
          onClick={onSelectRowsToggle}
          className="text-white text-xs italic hover:opacity-80 transition-opacity"
          style={{ background: 'none', border: 'none' }}
        >
          {isSelectionMode ? 'Cancel Selection' : 'Select Rows'}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;

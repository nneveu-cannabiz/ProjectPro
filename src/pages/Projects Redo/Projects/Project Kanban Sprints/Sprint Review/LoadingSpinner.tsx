import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="p-6 text-center">
      <div 
        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
        style={{ borderColor: brandTheme.primary.navy }}
      />
      <p style={{ color: brandTheme.text.secondary }}>Loading tasks...</p>
    </div>
  );
};

export default LoadingSpinner;

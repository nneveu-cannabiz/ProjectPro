import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import InProgressTaskContainer from '../Kanban Project Container/InProgressTaskContainer';

interface InProgressColumnProps {
  projects?: any[];
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  refreshTrigger?: number;
}

const InProgressColumn: React.FC<InProgressColumnProps> = ({ projects = [], onProjectClick, onSprintReviewClick, refreshTrigger }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.status.inProgress }}>
        {/* Header Title */}
        <div 
          className="p-4 border-b-2"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderBottomColor: brandTheme.border.brand,
            color: brandTheme.background.primary
          }}
        >
          <h3 className="text-lg font-bold text-white">In Progress</h3>
        </div>
      </div>
      
      {/* Column Content */}
      <div 
        className="flex-1 p-4 space-y-3 overflow-y-auto"
        style={{ 
          backgroundColor: brandTheme.background.brandLight,
          minHeight: '400px'
        }}
      >
        <InProgressTaskContainer refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default InProgressColumn;

import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import SprintSection from './SprintSection';

interface MainSprintSectionProps {
  refreshTrigger?: number;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const MainSprintSection: React.FC<MainSprintSectionProps> = ({
  refreshTrigger,
  onProjectClick,
  onSprintReviewClick
}) => {
  return (
    <div 
      className="border-t"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light 
      }}
    >
      {/* Section Header */}
      <div 
        className="px-6 py-4 border-b"
        style={{ 
          backgroundColor: brandTheme.primary.navy,
          borderColor: brandTheme.border.brand 
        }}
      >
        <h2 
          className="text-xl font-bold"
          style={{ color: brandTheme.background.primary }}
        >
          Sprint Groups Overview
        </h2>
        <p 
          className="text-sm mt-1 opacity-90"
          style={{ color: brandTheme.background.primary }}
        >
          Detailed view of all sprint groups and their tasks
        </p>
      </div>

      {/* Sprint Sections */}
      <div className="p-6 space-y-6">
        {/* Sprint 1 Section */}
        <SprintSection
          sprintType="Sprint 1"
          refreshTrigger={refreshTrigger}
          onProjectClick={onProjectClick}
          onSprintReviewClick={onSprintReviewClick}
        />

        {/* Sprint 2 Section */}
        <SprintSection
          sprintType="Sprint 2"
          refreshTrigger={refreshTrigger}
          onProjectClick={onProjectClick}
          onSprintReviewClick={onSprintReviewClick}
        />
      </div>
    </div>
  );
};

export default MainSprintSection;

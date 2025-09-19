import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import KanbanProjectContainer from '../Kanban Project Container/KanbanProjectContainer';

interface DoneColumnProps {
  projects?: any[];
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const DoneColumn: React.FC<DoneColumnProps> = ({ projects = [], onProjectClick, onSprintReviewClick }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.status.success }}>
        {/* Header Title */}
        <div 
          className="p-4 border-b-2"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderBottomColor: brandTheme.border.brand,
            color: brandTheme.background.primary
          }}
        >
          <h3 className="text-lg font-bold text-white">Done</h3>
        </div>
        {/* Project Count */}
        <div 
          className="px-4 py-2"
          style={{ 
            backgroundColor: brandTheme.gray[100],
            color: brandTheme.text.secondary
          }}
        >
          <span className="text-sm">{projects.length} projects</span>
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
        {projects.length > 0 ? (
          projects.map((project, index) => (
            <KanbanProjectContainer 
              key={project.id || index} 
              project={project} 
              onProjectClick={onProjectClick}
              onSprintReviewClick={onSprintReviewClick}
            />
          ))
        ) : (
          <div 
            className="text-center py-8 text-sm"
            style={{ color: brandTheme.text.muted }}
          >
            No completed projects
          </div>
        )}
      </div>
    </div>
  );
};

export default DoneColumn;

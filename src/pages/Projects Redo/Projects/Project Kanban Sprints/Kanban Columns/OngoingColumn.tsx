import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import KanbanProjectContainer from '../Kanban Project Container/KanbanProjectContainer';
import ProjectSelector from '../ProjectSelector';

interface OngoingColumnProps {
  projects?: any[];
  onProjectAdded?: () => void;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const OngoingColumn: React.FC<OngoingColumnProps> = ({ projects = [], onProjectAdded, onProjectClick, onSprintReviewClick, onExpandedChange }) => {
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent when expansion state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  const handleProjectSelect = async (project: any, columnType: string) => {
    try {
      console.log(`Successfully added project ${project.name} to ${columnType} column`);
      
      // Refresh the projects list
      if (onProjectAdded) {
        onProjectAdded();
      }
    } catch (error) {
      console.error('Error adding project to column:', error);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {isExpanded ? (
        // Expanded View - Full Width Column
        <>
          {/* Column Header */}
          <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.primary.navy }}>
            {/* Header Title */}
            <div 
              className="p-4 border-b-2 flex items-center justify-between"
              style={{ 
                backgroundColor: brandTheme.primary.navy,
                borderBottomColor: brandTheme.border.brand,
                color: brandTheme.background.primary
              }}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Collapse column"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <h3 className="text-lg font-bold text-white">Ongoing</h3>
              </div>
              <button
                onClick={() => setIsProjectSelectorOpen(true)}
                className="text-xs italic transition-colors hover:opacity-75"
                style={{ 
                  color: brandTheme.gray[300],
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              >
                Add Project
              </button>
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
                No ongoing projects
              </div>
            )}
          </div>
        </>
      ) : (
        // Collapsed View - Narrow Width Column
        <>
          {/* Collapsed Header */}
          <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.primary.navy }}>
            <div 
              className="p-2 border-b-2 flex items-center justify-center cursor-pointer hover:bg-opacity-90 transition-colors"
              style={{ 
                backgroundColor: brandTheme.primary.navy,
                borderBottomColor: brandTheme.border.brand,
                color: brandTheme.background.primary
              }}
              onClick={() => setIsExpanded(true)}
              title="Expand column"
            >
              <ChevronRight className="w-4 h-4 text-white mr-1" />
              <h3 className="text-sm font-bold text-white">Ongoing</h3>
            </div>
            {/* Project Count */}
            <div 
              className="px-2 py-1 text-center"
              style={{ 
                backgroundColor: brandTheme.gray[100],
                color: brandTheme.text.secondary
              }}
            >
              <span className="text-xs">{projects.length}</span>
            </div>
          </div>
          
          {/* Collapsed Content - Project Names Only */}
          <div 
            className="flex-1 p-2 space-y-1 overflow-y-auto"
            style={{ 
              backgroundColor: brandTheme.background.brandLight,
              minHeight: '400px'
            }}
          >
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <div
                  key={project.id || index}
                  className="p-2 rounded cursor-pointer hover:bg-white hover:bg-opacity-50 transition-colors"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderLeft: `3px solid ${brandTheme.primary.navy}`
                  }}
                  onClick={() => onProjectClick?.(project)}
                  title={project.name}
                >
                  <div 
                    className="text-xs font-medium truncate"
                    style={{ color: brandTheme.text.primary }}
                  >
                    {project.name}
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="text-center py-4 text-xs"
                style={{ color: brandTheme.text.muted }}
              >
                No projects
              </div>
            )}
          </div>
        </>
      )}

      {/* Project Selector Modal */}
      <ProjectSelector
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        onSelectProject={handleProjectSelect}
        columnType="ongoing"
        columnTitle="Ongoing"
      />
    </div>
  );
};

export default OngoingColumn;

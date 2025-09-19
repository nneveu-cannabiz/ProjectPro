import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import KanbanProjectContainer from '../Kanban Project Container/KanbanProjectContainer';
import ProjectSelector from '../ProjectSelector';

interface ParkingLotColumnProps {
  projects?: any[];
  onProjectAdded?: () => void;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const ParkingLotColumn: React.FC<ParkingLotColumnProps> = ({ projects = [], onProjectAdded, onProjectClick, onSprintReviewClick, onExpandedChange }) => {
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [projectsWithSprintStatus, setProjectsWithSprintStatus] = useState<any[]>([]);
  const [isLoadingSprintStatus, setIsLoadingSprintStatus] = useState(false);

  // Notify parent when expansion state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  // Analyze sprint status when projects change
  useEffect(() => {
    if (projects.length > 0) {
      analyzeSprintStatus();
    } else {
      setProjectsWithSprintStatus([]);
    }
  }, [projects]);

  const analyzeSprintStatus = async () => {
    setIsLoadingSprintStatus(true);
    try {
      // Get all active sprint groups
      const { data: sprintGroups, error: sprintError } = await (supabase as any)
        .from('PMA_Sprints')
        .select('selected_task_ids')
        .eq('status', 'active');

      if (sprintError) {
        console.error('Error fetching sprint groups:', sprintError);
        setProjectsWithSprintStatus(projects);
        return;
      }

      // Collect all task IDs that are in sprint groups
      const sprintTaskIds = new Set<string>();
      (sprintGroups || []).forEach((group: any) => {
        (group.selected_task_ids || []).forEach((taskId: string) => {
          sprintTaskIds.add(taskId);
        });
      });

      // Analyze each project
      const projectsWithStatus = await Promise.all(
        projects.map(async (project: any) => {
          try {
            // Get all tasks for this project (excluding completed tasks)
            const { data: projectTasks, error: tasksError } = await (supabase as any)
              .from('PMA_Tasks')
              .select('id, name, status')
              .eq('project_id', project.id)
              .neq('status', 'done');

            if (tasksError) {
              console.error(`Error fetching tasks for project ${project.id}:`, tasksError);
              return { ...project, totalTasks: 0, assignedTasks: 0, shouldShow: true };
            }

            const totalActiveTasks = (projectTasks || []).length;
            const assignedTasks = (projectTasks || []).filter((task: any) => 
              sprintTaskIds.has(task.id)
            ).length;

            // Only show project if not all active tasks are assigned to sprints
            const shouldShow = totalActiveTasks === 0 || assignedTasks < totalActiveTasks;

            return {
              ...project,
              totalTasks: totalActiveTasks,
              assignedTasks: assignedTasks,
              shouldShow: shouldShow,
              unassignedTasks: totalActiveTasks - assignedTasks
            };
          } catch (error) {
            console.error(`Error analyzing project ${project.id}:`, error);
            return { ...project, totalTasks: 0, assignedTasks: 0, shouldShow: true };
          }
        })
      );

      // Filter to only show projects that should be displayed
      const filteredProjects = projectsWithStatus.filter(project => project.shouldShow);
      setProjectsWithSprintStatus(filteredProjects);
    } catch (error) {
      console.error('Error analyzing sprint status:', error);
      setProjectsWithSprintStatus(projects);
    } finally {
      setIsLoadingSprintStatus(false);
    }
  };

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
          <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.secondary.slate }}>
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
                <h3 className="text-lg font-bold text-white">Parking Lot</h3>
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
              <span className="text-sm">
                {isLoadingSprintStatus ? 'Loading...' : `${projectsWithSprintStatus.length} projects`}
              </span>
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
            {isLoadingSprintStatus ? (
              <div className="flex items-center justify-center p-8">
                <div 
                  className="animate-spin rounded-full h-6 w-6 border-b-2"
                  style={{ borderColor: brandTheme.primary.navy }}
                />
                <span className="ml-2 text-sm" style={{ color: brandTheme.text.secondary }}>
                  Analyzing sprint assignments...
                </span>
              </div>
            ) : projectsWithSprintStatus.length > 0 ? (
              projectsWithSprintStatus.map((project, index) => (
                <div key={project.id || index} className="relative">
                  <KanbanProjectContainer 
                    project={project} 
                    onProjectClick={onProjectClick}
                    onSprintReviewClick={onSprintReviewClick}
                  />
                  
                  {/* Sprint Assignment Status Badge */}
                  {project.totalTasks > 0 && project.unassignedTasks > 0 && (
                    <div 
                      className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: brandTheme.status.warningLight,
                        color: brandTheme.status.warning,
                        border: `1px solid ${brandTheme.status.warning}`
                      }}
                    >
{project.unassignedTasks}/{project.totalTasks} tasks unassigned to sprint
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div 
                className="text-center py-8 text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                {projects.length === 0 ? 'No parked projects' : 'All active tasks are assigned to sprint groups'}
              </div>
            )}
          </div>
        </>
      ) : (
        // Collapsed View - Narrow Width Column
        <>
          {/* Collapsed Header */}
          <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.secondary.slate }}>
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
              <h3 className="text-sm font-bold text-white">Parking Lot</h3>
            </div>
            {/* Project Count */}
            <div 
              className="px-2 py-1 text-center"
              style={{ 
                backgroundColor: brandTheme.gray[100],
                color: brandTheme.text.secondary
              }}
            >
              <span className="text-xs">
                {isLoadingSprintStatus ? '...' : projectsWithSprintStatus.length}
              </span>
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
            {isLoadingSprintStatus ? (
              <div className="text-center py-4 text-xs" style={{ color: brandTheme.text.muted }}>
                Loading...
              </div>
            ) : projectsWithSprintStatus.length > 0 ? (
              projectsWithSprintStatus.map((project, index) => (
                <div
                  key={project.id || index}
                  className="relative p-2 rounded cursor-pointer hover:bg-white hover:bg-opacity-50 transition-colors"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderLeft: `3px solid ${brandTheme.secondary.slate}`
                  }}
                  onClick={() => onSprintReviewClick?.(project)}
                  title={`${project.name} - Click to review sprint plan`}
                >
                  <div 
                    className="text-xs font-medium truncate"
                    style={{ color: brandTheme.text.primary }}
                  >
                    {project.name}
                  </div>
                  
                  {/* Small unassigned indicator */}
                  {project.totalTasks > 0 && project.unassignedTasks > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: brandTheme.status.warning,
                        fontSize: '8px',
                        color: 'white'
                      }}
title={`${project.unassignedTasks}/${project.totalTasks} tasks unassigned to sprint`}
                    >
                      {project.unassignedTasks}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div 
                className="text-center py-4 text-xs"
                style={{ color: brandTheme.text.muted }}
              >
                {projects.length === 0 ? 'No projects' : 'All tasks assigned'}
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
        columnType="parkinglot"
        columnTitle="Parking Lot"
      />
    </div>
  );
};

export default ParkingLotColumn;

import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ChevronRight, ChevronLeft, GripVertical } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import KanbanProjectContainer from '../Kanban Project Container/KanbanProjectContainer';
import ProjectSelector from '../ProjectSelector';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { batchUpdateProjectRankings } from '../../../../../data/supabase-store';

interface ParkingLotColumnProps {
  projects?: any[];
  onProjectAdded?: () => void;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

// Sortable Project Item Component
interface SortableProjectItemProps {
  project: any;
  index: number;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const SortableProjectItem: React.FC<SortableProjectItemProps> = ({ project, index, onProjectClick, onSprintReviewClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get the rank for this parking lot column
  const currentRank = project.ranking?.[PAGE_NAME];
  const hasRank = currentRank !== undefined;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="flex items-center gap-2">
        {/* Rank Badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center font-bold text-xs rounded px-1.5 py-0.5 min-w-[24px]"
          style={{
            backgroundColor: hasRank ? brandTheme.primary.navy : brandTheme.gray[300],
            color: hasRank ? '#FFFFFF' : brandTheme.text.muted,
            fontSize: '10px'
          }}
          title={hasRank ? `Rank ${currentRank}` : 'Unranked'}
        >
          {hasRank ? `#${currentRank}` : '-'}
        </div>

        {/* Drag Handle */}
        <div
          ref={setActivatorNodeRef}
          className="flex-shrink-0 p-1 rounded hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
          style={{
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            color: brandTheme.text.secondary,
          }}
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>

        {/* Project Container */}
        <div className="flex-1">
          <KanbanProjectContainer
            project={project}
            onProjectClick={onProjectClick}
            onSprintReviewClick={onSprintReviewClick}
          />
        </div>
      </div>

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
  );
};

const PAGE_NAME = 'Sprint: Parking Lot';

const ParkingLotColumn: React.FC<ParkingLotColumnProps> = ({ projects = [], onProjectAdded, onProjectClick, onSprintReviewClick, onExpandedChange }) => {
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [projectsWithSprintStatus, setProjectsWithSprintStatus] = useState<any[]>([]);
  const [isLoadingSprintStatus, setIsLoadingSprintStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort projects by ranking for this parking lot column
  const sortedProjects = useMemo(() => {
    const sorted = [...projectsWithSprintStatus].sort((a, b) => {
      const aRank = a.ranking?.[PAGE_NAME];
      const bRank = b.ranking?.[PAGE_NAME];

      // Both have rankings for this page - lower rank number comes first
      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank; // 1 comes before 2, 2 comes before 3, etc.
      }

      // Only a has ranking - a comes first (ranked items before unranked)
      if (aRank !== undefined && bRank === undefined) {
        return -1;
      }

      // Only b has ranking - b comes first (ranked items before unranked)
      if (aRank === undefined && bRank !== undefined) {
        return 1;
      }

      // Neither has ranking - keep original order
      return 0;
    });

    // Debug: Log the sorted order
    console.log('🔢 Parking Lot sorted projects:', sorted.map(p => ({
      name: p.name,
      rank: p.ranking?.[PAGE_NAME] || 'unranked'
    })));

    return sorted;
  }, [projectsWithSprintStatus]);

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

      // First, fetch full project data with ranking column for all projects
      const projectIds = projects.map(p => p.id);
      const { data: fullProjects, error: projectError } = await (supabase as any)
        .from('PMA_Projects')
        .select('id, name, ranking')
        .in('id', projectIds);

      if (projectError) {
        console.error('Error fetching full project data:', projectError);
      }

      // Create a map of project rankings
      const projectRankingMap = new Map();
      (fullProjects || []).forEach((proj: any) => {
        projectRankingMap.set(proj.id, proj.ranking || {});
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
              return { 
                ...project, 
                ranking: projectRankingMap.get(project.id) || {},
                totalTasks: 0, 
                assignedTasks: 0, 
                shouldShow: true 
              };
            }

            const totalActiveTasks = (projectTasks || []).length;
            const assignedTasks = (projectTasks || []).filter((task: any) => 
              sprintTaskIds.has(task.id)
            ).length;

            // Only show project if not all active tasks are assigned to sprints
            const shouldShow = totalActiveTasks === 0 || assignedTasks < totalActiveTasks;

            return {
              ...project,
              ranking: projectRankingMap.get(project.id) || {}, // Include ranking
              totalTasks: totalActiveTasks,
              assignedTasks: assignedTasks,
              shouldShow: shouldShow,
              unassignedTasks: totalActiveTasks - assignedTasks
            };
          } catch (error) {
            console.error(`Error analyzing project ${project.id}:`, error);
            return { 
              ...project, 
              ranking: projectRankingMap.get(project.id) || {},
              totalTasks: 0, 
              assignedTasks: 0, 
              shouldShow: true 
            };
          }
        })
      );

      // Filter to only show projects that should be displayed
      const filteredProjects = projectsWithStatus.filter(project => project.shouldShow);
      console.log('📦 Loaded projects with rankings:', filteredProjects.map(p => ({
        name: p.name,
        ranking: p.ranking
      })));
      setProjectsWithSprintStatus(filteredProjects);
    } catch (error) {
      console.error('Error analyzing sprint status:', error);
      setProjectsWithSprintStatus(projects);
    } finally {
      setIsLoadingSprintStatus(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedProjects.findIndex(p => p.id === active.id);
    const newIndex = sortedProjects.findIndex(p => p.id === over.id);

    console.log(`🎯 Parking Lot: Moving project from index ${oldIndex} to ${newIndex}`);

    // Reorder locally for immediate feedback
    const reorderedProjects = arrayMove(sortedProjects, oldIndex, newIndex);

    // Save rankings to database
    try {
      setIsSaving(true);
      const rankings = reorderedProjects.map((project, index) => {
        console.log(`📍 Setting rank ${index + 1} for project: ${project.name}`);
        return {
          projectId: project.id,
          rank: index + 1
        };
      });

      await batchUpdateProjectRankings(rankings, PAGE_NAME);
      console.log('✅ Parking lot rankings saved successfully');

      // Refresh the sprint status analysis to get updated data from DB
      await analyzeSprintStatus();
    } catch (error) {
      console.error('❌ Failed to save parking lot rankings:', error);
    } finally {
      setIsSaving(false);
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
                  {isSaving ? 'Saving order...' : 'Analyzing sprint assignments...'}
                </span>
              </div>
            ) : sortedProjects.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedProjects.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedProjects.map((project, index) => (
                    <SortableProjectItem
                      key={project.id}
                      project={project}
                      index={index}
                      onProjectClick={onProjectClick}
                      onSprintReviewClick={onSprintReviewClick}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                {isLoadingSprintStatus ? '...' : sortedProjects.length}
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
            ) : sortedProjects.length > 0 ? (
              sortedProjects.map((project, index) => (
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

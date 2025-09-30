import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { ChevronDown, ChevronRight, Clock, Target, User, AlertCircle, GripVertical } from 'lucide-react';
import UserAvatar from '../../../../../components/UserAvatar';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';
import InSprintReviewModal from '../Sprint Review/InSprintReviewModal';
import { batchUpdateSprintGroupRankings } from '../../../../../data/supabase-store';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  status: string;
  name: string;
  description?: string;
  created_at: string;
  ranking?: Record<string, number>;
  project: {
    id: string;
    name: string;
    description?: string;
    priority?: string;
    assignee_id?: string;
    status?: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    assigneeName?: string;
    assignee?: {
      id: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_color?: string;
    };
    hoursSpent: number;
    hoursPlanned: number;
    created_at?: string;
    updated_at?: string;
    end_date?: string;
    project_id?: string;
  }>;
}

interface SprintGroupContainerProps {
  sprintType: 'Sprint 1' | 'Sprint 2';
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  refreshTrigger?: number;
}

// Sortable Sprint Group Item Component
interface SortableSprintGroupItemProps {
  group: SprintGroup;
  isExpanded: boolean;
  onToggleExpansion: (groupId: string) => void;
  onSprintGroupClick: (group: SprintGroup) => void;
  onTaskClick: (taskId: string) => void;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  getPriorityColor: (priority?: string) => string;
  getStatusColor: (status?: string) => { bg: string; text: string };
  sprintType: string;
}

const SortableSprintGroupItem: React.FC<SortableSprintGroupItemProps> = ({
  group,
  isExpanded,
  onToggleExpansion,
  onSprintGroupClick,
  onTaskClick,
  onProjectClick,
  onSprintReviewClick,
  getPriorityColor,
  getStatusColor,
  sprintType
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalHoursSpent = group.tasks.reduce((sum, task) => sum + task.hoursSpent, 0);
  const totalHoursPlanned = group.tasks.reduce((sum, task) => sum + task.hoursPlanned, 0);

  // Get the rank for this sprint type using the correct key format
  const rankingKey = `Sprint: ${sprintType}`;
  const currentRank = group.ranking?.[rankingKey];
  const hasRank = currentRank !== undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light
      }} 
      className="rounded-lg border shadow-sm relative group"
    >
      {/* Sprint Group Header */}
      <div 
        className="px-5 py-4 hover:bg-opacity-90 transition-all duration-200"
        style={{ 
          backgroundColor: brandTheme.primary.navy,
          color: brandTheme.background.primary,
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem'
        }}
      >
        {/* Main Header Row */}
        <div className="flex items-center gap-2">
          {/* Rank Badge */}
          <div
            className="flex-shrink-0 flex items-center justify-center font-bold text-xs rounded px-1.5 py-0.5 min-w-[24px]"
            style={{
              backgroundColor: hasRank ? brandTheme.background.primary : 'rgba(255, 255, 255, 0.3)',
              color: hasRank ? brandTheme.primary.navy : brandTheme.background.primary,
              fontSize: '10px'
            }}
            title={hasRank ? `Rank ${currentRank}` : 'Unranked'}
          >
            {hasRank ? `#${currentRank}` : '-'}
          </div>

          {/* Drag Handle */}
          <div
            ref={setActivatorNodeRef}
            className="flex-shrink-0 p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors cursor-grab"
            style={{
              touchAction: 'none',
              userSelect: 'none',
              color: brandTheme.background.primary,
            }}
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>

          {/* Project Name with Chevron */}
          <div 
            className="flex items-center space-x-2 min-w-0 flex-1 cursor-pointer"
            onClick={() => onToggleExpansion(group.id)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            <span 
              className="font-semibold text-sm truncate hover:underline transition-colors" 
              onClick={(e) => {
                e.stopPropagation();
                onSprintGroupClick(group);
              }}
              title="Click to review epic"
            >
              {group.name}
            </span>
          </div>
        </div>
        
        {/* Hours Row */}
        <div className="flex items-center mt-2 pt-2 border-t border-white border-opacity-20 ml-16">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{totalHoursSpent.toFixed(1)}h</span>
              <span className="opacity-75">spent</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span className="font-medium">{totalHoursPlanned.toFixed(1)}h</span>
              <span className="opacity-75">planned</span>
            </div>
          </div>
        </div>
        
        {/* Task Count Row */}
        <div className="flex mt-1 ml-16">
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: brandTheme.background.primary
            }}
          >
            {group.tasks.length} tasks
          </div>
        </div>
      </div>

      {/* Expandable Task Breakdown */}
      {isExpanded && (
        <div className="border-t" style={{ borderColor: brandTheme.border.light }}>
          {/* Section Header */}
          <div 
            className="px-4 py-3 border-b"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <div 
              className="text-sm font-semibold"
              style={{ color: brandTheme.text.primary }}
            >
              Task Details
            </div>
          </div>

          {/* Task List */}
          <div className="p-4">
            {group.tasks.length === 0 ? (
              <div 
                className="text-center py-8 text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                No tasks found for this epic
              </div>
            ) : (
              <div className="space-y-3">
                {group.tasks.map((task) => {
                  const statusColors = getStatusColor(task.status);
                  
                  return (
                    <div 
                      key={task.id} 
                      className="border rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200"
                      style={{ 
                        backgroundColor: task.status?.toLowerCase() === 'in-progress' 
                          ? brandTheme.status.inProgressLight 
                          : brandTheme.background.primary,
                        borderColor: brandTheme.border.light 
                      }}
                    >
                      {/* Task Header */}
                      <div 
                        className="px-3 py-2 border-b"
                        style={{ 
                          backgroundColor: brandTheme.background.brandLight,
                          borderColor: brandTheme.border.light
                        }}
                      >
                        <div 
                          className="font-medium text-sm cursor-pointer hover:underline transition-colors"
                          style={{ color: brandTheme.primary.navy }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task.id);
                          }}
                          title="Click to view task details"
                        >
                          {task.name}
                        </div>
                      </div>

                      {/* Task Content */}
                      <div className="px-3 py-2 space-y-2">
                        {/* Status and Priority Row */}
                        <div className="flex items-center justify-between">
                          {/* Status */}
                          <div className="flex items-center space-x-1">
                            <span 
                              className="text-xs font-medium"
                              style={{ color: brandTheme.text.muted }}
                            >
                              Status:
                            </span>
                            {task.status && (
                              <span 
                                className="text-xs font-semibold"
                                style={{ color: statusColors.text }}
                              >
                                {task.status === 'in-progress' ? 'In Progress' : 
                                 task.status === 'to do' ? 'To Do' : 
                                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                            )}
                          </div>
                          
                          {/* Priority */}
                          <div className="flex items-center space-x-1">
                            <span 
                              className="text-xs font-medium"
                              style={{ color: brandTheme.text.muted }}
                            >
                              Priority:
                            </span>
                            {task.priority && (
                              <div className="flex items-center space-x-1">
                                <AlertCircle 
                                  className="w-3 h-3" 
                                  style={{ color: getPriorityColor(task.priority) }}
                                />
                                <span 
                                  className="text-xs font-semibold"
                                  style={{ color: getPriorityColor(task.priority) }}
                                >
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hours Section */}
                        <div>
                          <div 
                            className="text-xs font-medium mb-1"
                            style={{ color: brandTheme.text.muted }}
                          >
                            Time Tracking
                          </div>
                          <div className="flex items-center justify-between">
                            {/* Hours Spent */}
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                              <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
                                Spent:
                              </span>
                              <span 
                                className="text-xs font-semibold"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {task.hoursSpent.toFixed(1)}h
                              </span>
                            </div>
                            
                            {/* Hours Planned */}
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                              <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
                                Planned:
                              </span>
                              <span 
                                className="text-xs font-semibold"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {task.hoursPlanned.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assignee Section */}
                        <div>
                          <div 
                            className="text-xs font-medium mb-1"
                            style={{ color: brandTheme.text.muted }}
                          >
                            Assigned To
                          </div>
                          {task.assignee ? (
                            <UserAvatar 
                              user={{
                                id: task.assignee.id,
                                email: task.assignee.email || '',
                                firstName: task.assignee.first_name || '',
                                lastName: task.assignee.last_name || '',
                                profileColor: task.assignee.profile_color
                              }}
                              size="xs"
                              showName={true}
                              className="text-xs"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: brandTheme.gray[200] }}
                              >
                                <User 
                                  className="w-2.5 h-2.5" 
                                  style={{ color: brandTheme.text.muted }} 
                                />
                              </div>
                              <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
                                Unassigned
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: brandTheme.border.light }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectClick?.(group.project);
                }}
                className="text-xs px-3 py-2 rounded transition-colors hover:opacity-80"
                style={{
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.secondary,
                  border: `1px solid ${brandTheme.border.medium}`
                }}
              >
                View Project
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSprintReviewClick?.(group.project);
                }}
                className="text-xs px-3 py-2 rounded transition-colors hover:opacity-80"
                style={{
                  backgroundColor: brandTheme.primary.navy,
                  color: brandTheme.background.primary,
                }}
              >
                Sprint Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SprintGroupContainer: React.FC<SprintGroupContainerProps> = ({ 
  sprintType, 
  onProjectClick, 
  onSprintReviewClick,
  refreshTrigger 
}) => {
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Task Details Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // In Sprint Review Modal state
  const [selectedSprintGroup, setSelectedSprintGroup] = useState<SprintGroup | null>(null);
  const [isInSprintReviewModalOpen, setIsInSprintReviewModalOpen] = useState(false);

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

  useEffect(() => {
    loadSprintGroups();
  }, [sprintType, refreshTrigger]);

  const loadSprintGroups = async () => {
    setIsLoading(true);
    try {
      // Try to fetch with ranking column first
      let query = (supabase as any)
        .from('PMA_Sprints')
        .select(`
          id,
          project_id,
          selected_task_ids,
          sprint_type,
          status,
          name,
          description,
          created_at,
          ranking,
          PMA_Projects!inner (
            id,
            name,
            description,
            priority,
            assignee_id,
            status
          )
        `)
        .eq('sprint_type', sprintType)
        .eq('status', 'active');

      let { data, error } = await query;

      // If ranking column doesn't exist, try without it
      if (error && error.message?.includes('ranking')) {
        console.log('Ranking column not found, fetching without it...');
        query = (supabase as any)
          .from('PMA_Sprints')
          .select(`
            id,
            project_id,
            selected_task_ids,
            sprint_type,
            status,
            name,
            description,
            created_at,
            PMA_Projects!inner (
              id,
              name,
              description,
              priority,
              assignee_id,
              status
            )
          `)
          .eq('sprint_type', sprintType)
          .eq('status', 'active');
        
        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error loading sprint groups:', error);
        return;
      }

      console.log('Sprint groups data:', data);
      console.log('Number of sprint groups fetched:', data?.length || 0);
      console.log('Sprint type being loaded:', sprintType);

      if (!data || data.length === 0) {
        console.warn(`No sprint groups found for ${sprintType}`);
        setSprintGroups([]);
        return;
      }

      // Load tasks for each sprint group
      const groupsWithTasks = await Promise.all(
        data.map(async (group: any) => {
          if (group.selected_task_ids && group.selected_task_ids.length > 0) {
            // Fetch tasks first
            const { data: tasksData, error: tasksError } = await (supabase as any)
              .from('PMA_Tasks')
              .select(`
                id, 
                name,
                description,
                status, 
                priority, 
                assignee_id,
                created_at,
                updated_at,
                end_date,
                project_id
              `)
              .in('id', group.selected_task_ids);

            if (tasksError) {
              console.error('Error loading tasks for sprint group:', tasksError);
              return {
                ...group,
                project: group.PMA_Projects,
                tasks: []
              };
            }


            // Fetch hours data and assignee names for each task
            const tasksWithHours = await Promise.all(
              (tasksData || []).map(async (task: any) => {
                // Get assignee information if assignee_id exists
                let assigneeName = 'Unassigned';
                let assignee = null;
                if (task.assignee_id) {
                  const { data: userData } = await (supabase as any)
                    .from('PMA_Users')
                    .select('id, email, first_name, last_name, profile_color')
                    .eq('id', task.assignee_id)
                    .single();
                  
                  if (userData) {
                    assigneeName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                    assignee = {
                      id: userData.id,
                      email: userData.email,
                      first_name: userData.first_name,
                      last_name: userData.last_name,
                      profile_color: userData.profile_color
                    };
                  }
                }

                // Get hours spent (actual logged hours)
                const { data: spentHours } = await (supabase as any)
                  .from('PMA_Hours')
                  .select('hours')
                  .eq('task_id', task.id)
                  .or('is_planning_hours.is.null,is_planning_hours.eq.false');

                // Get hours planned (planning hours)
                const { data: plannedHours } = await (supabase as any)
                  .from('PMA_Hours')
                  .select('hours')
                  .eq('task_id', task.id)
                  .eq('is_planning_hours', true);

                const hoursSpent = (spentHours || []).reduce((sum: number, h: any) => sum + (h.hours || 0), 0);
                const hoursPlanned = (plannedHours || []).reduce((sum: number, h: any) => sum + (h.hours || 0), 0);

                return {
                  ...task,
                  assigneeName,
                  assignee,
                  hoursSpent,
                  hoursPlanned
                };
              })
            );


            return {
              ...group,
              project: group.PMA_Projects,
              tasks: tasksWithHours
            };
          }

          return {
            ...group,
            project: group.PMA_Projects,
            tasks: []
          };
        })
      );

      console.log('Setting sprint groups to state:', groupsWithTasks.length, 'groups');
      setSprintGroups(groupsWithTasks);
    } catch (error) {
      console.error('Error loading sprint groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleSprintGroupClick = (sprintGroup: SprintGroup) => {
    setSelectedSprintGroup(sprintGroup);
    setIsInSprintReviewModalOpen(true);
  };

  const handleCloseInSprintReviewModal = () => {
    setIsInSprintReviewModalOpen(false);
    setSelectedSprintGroup(null);
  };

  // Sort sprint groups by ranking for this sprint type, then by created_at
  const sortedSprintGroups = useMemo(() => {
    // Create the ranking key in the format: "Sprint: Sprint 1" or "Sprint: Sprint 2"
    const rankingKey = `Sprint: ${sprintType}`;
    
    return [...sprintGroups].sort((a, b) => {
      const rankA = a.ranking?.[rankingKey];
      const rankB = b.ranking?.[rankingKey];

      // If both have ranks, sort by rank
      if (rankA !== undefined && rankB !== undefined) {
        return rankA - rankB;
      }

      // If only A has a rank, it comes first
      if (rankA !== undefined) return -1;

      // If only B has a rank, it comes first
      if (rankB !== undefined) return 1;

      // If neither has a rank, sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sprintGroups, sprintType]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedSprintGroups.findIndex(group => group.id === active.id);
    const newIndex = sortedSprintGroups.findIndex(group => group.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the sprint groups
    const reorderedGroups = arrayMove(sortedSprintGroups, oldIndex, newIndex);

    // Update local state immediately for responsive UI
    setSprintGroups(reorderedGroups);

    // Prepare rankings: assign 1, 2, 3... based on new order
    const rankings = reorderedGroups.map((group, index) => ({
      sprintGroupId: group.id,
      rank: index + 1
    }));

    // Save to database with the correct ranking key format
    setIsSaving(true);
    try {
      const rankingKey = `Sprint: ${sprintType}`;
      await batchUpdateSprintGroupRankings(rankings, rankingKey);
      console.log(`✅ Sprint group rankings saved for ${sprintType} with key: ${rankingKey}`);
      
      // Refresh data to ensure consistency
      await loadSprintGroups();
    } catch (error) {
      console.error('Error saving sprint group rankings:', error);
      // Revert to previous state on error
      setSprintGroups(sprintGroups);
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '#FF0000'; // Bright Red
      case 'high':
        return '#DC2626'; // Red
      case 'medium':
        return '#EAB308'; // Yellow
      case 'low':
        return '#16A34A'; // Green
      default:
        return brandTheme.text.muted;
    }
  };


  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return { bg: brandTheme.status.successLight, text: brandTheme.status.success };
      case 'in progress':
        return { bg: brandTheme.status.infoLight, text: brandTheme.status.info };
      case 'to do':
        return { bg: brandTheme.gray[100], text: brandTheme.text.muted };
      default:
        return { bg: brandTheme.background.brandLight, text: brandTheme.text.secondary };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          className="animate-spin rounded-full h-6 w-6 border-b-2"
          style={{ borderColor: brandTheme.primary.navy }}
        />
        <span className="ml-2 text-sm" style={{ color: brandTheme.text.secondary }}>
          Loading {sprintType} groups...
        </span>
      </div>
    );
  }

  if (sprintGroups.length === 0) {
    return (
      <div 
        className="text-center py-8 text-sm"
        style={{ color: brandTheme.text.muted }}
      >
        <p>No {sprintType} groups created yet</p>
        <p className="text-xs mt-1">Use Sprint Review to create sprint groups</p>
      </div>
    );
  }

  console.log('Rendering SprintGroupContainer:', sprintType, 'with', sortedSprintGroups.length, 'groups');

  return (
    <>
      {isSaving && (
        <div className="text-center py-2 text-xs" style={{ color: brandTheme.text.secondary }}>
          Saving order...
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSprintGroups.map(g => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedSprintGroups.length === 0 && (
              <div className="text-center py-4 text-sm" style={{ color: brandTheme.text.muted }}>
                No sprint groups to display
              </div>
            )}
            {sortedSprintGroups.map((group) => {
              console.log('Rendering group:', group.id, group.name);
              return (
                <SortableSprintGroupItem
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggleExpansion={toggleGroupExpansion}
                  onSprintGroupClick={handleSprintGroupClick}
                  onTaskClick={handleTaskClick}
                  onProjectClick={onProjectClick}
                  onSprintReviewClick={onSprintReviewClick}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  sprintType={sprintType}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
      
      {/* In Sprint Review Modal */}
      {selectedSprintGroup && (
        <InSprintReviewModal
          isOpen={isInSprintReviewModalOpen}
          onClose={handleCloseInSprintReviewModal}
          sprintGroup={selectedSprintGroup}
        />
      )}
    </>
  );
};

export default SprintGroupContainer;

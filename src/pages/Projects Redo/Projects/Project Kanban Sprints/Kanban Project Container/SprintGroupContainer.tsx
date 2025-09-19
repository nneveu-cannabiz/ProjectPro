import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { ChevronDown, ChevronRight, Clock, Target, User, AlertCircle } from 'lucide-react';
import UserAvatar from '../../../../../components/UserAvatar';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';

interface SprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  status: string;
  name: string;
  description?: string;
  created_at: string;
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

const SprintGroupContainer: React.FC<SprintGroupContainerProps> = ({ 
  sprintType, 
  onProjectClick, 
  onSprintReviewClick,
  refreshTrigger 
}) => {
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Task Details Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    loadSprintGroups();
  }, [sprintType, refreshTrigger]);

  const loadSprintGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sprint groups:', error);
        return;
      }

      console.log('Sprint groups data:', data);

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

  const getPriorityBgColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '#FECACA'; // Light Red background for Bright Red text
      case 'high':
        return '#FEE2E2'; // Light Red background for Red text
      case 'medium':
        return '#FEF3C7'; // Light Yellow background for Yellow text
      case 'low':
        return '#DCFCE7'; // Light Green background for Green text
      default:
        return brandTheme.background.secondary;
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

  return (
    <>
      <div className="space-y-3">
        {sprintGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const totalHoursSpent = group.tasks.reduce((sum, task) => sum + task.hoursSpent, 0);
        const totalHoursPlanned = group.tasks.reduce((sum, task) => sum + task.hoursPlanned, 0);

        
        return (
          <div key={group.id} className="rounded-lg border shadow-sm" style={{ backgroundColor: brandTheme.background.primary, borderColor: brandTheme.border.light }}>
            {/* Sprint Group Header - Clickable */}
            <div 
              className="px-5 py-4 cursor-pointer hover:bg-opacity-90 transition-all duration-200"
              onClick={() => toggleGroupExpansion(group.id)}
              style={{ 
                backgroundColor: brandTheme.primary.navy,
                color: brandTheme.background.primary,
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem'
              }}
            >
              {/* Main Header Row - Project Name Only */}
              <div className="flex items-center">
                {/* Project Name with Chevron */}
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span 
                    className="font-semibold text-sm truncate cursor-pointer hover:underline transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering group expansion
                      onSprintReviewClick?.(group.project);
                    }}
                    title="Click to review sprint plan"
                  >
                    {group.name}
                  </span>
                </div>
              </div>
              
              {/* Hours Row */}
              <div className="flex items-center mt-2 pt-2 border-t border-white border-opacity-20">
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
              <div className="flex mt-1">
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
              <div className="p-4 border-t" style={{ borderColor: brandTheme.border.light }}>
                {/* Task Table Header */}
                <div className="px-3 py-2 text-xs font-medium border-b-2 mb-3" 
                     style={{ 
                       borderColor: brandTheme.primary.navy,
                       color: brandTheme.text.secondary 
                     }}>
                  <div>Task Details</div>
                </div>

                {/* Task Rows */}
                <div className="space-y-2">
                  {group.tasks.length === 0 ? (
                    <div className="text-center py-4 text-sm" style={{ color: brandTheme.text.muted }}>
                      No tasks found for this sprint group
                    </div>
                  ) : (
                    group.tasks.map((task) => {
                    const statusColors = getStatusColor(task.status);
                    
                    return (
                      <div 
                        key={task.id} 
                        className="p-3 rounded border hover:shadow-sm transition-shadow"
                        style={{ 
                          backgroundColor: brandTheme.background.primary,
                          borderColor: brandTheme.border.light 
                        }}
                      >
                        {/* Task Name - Clickable */}
                        <div 
                          className="font-medium text-sm mb-2 cursor-pointer hover:underline transition-colors" 
                          style={{ color: brandTheme.primary.navy }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering group expansion
                            handleTaskClick(task.id);
                          }}
                          title="Click to view task details"
                        >
                          {task.name}
                        </div>

                        {/* Status and Priority Row */}
                        <div className="flex items-center space-x-2 mb-1">
                          {/* Status Badge */}
                          {task.status && (
                            <span 
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}
                            >
                              {task.status}
                            </span>
                          )}
                          {/* Priority Badge */}
                          {task.priority && (
                            <div 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: getPriorityBgColor(task.priority),
                                color: getPriorityColor(task.priority),
                              }}
                            >
                              <AlertCircle className="w-2 h-2 mr-1" />
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </div>
                          )}
                        </div>

                        {/* Assignee and Hours Row */}
                        <div className="flex items-center justify-between">
                          {/* Assignee with UserAvatar */}
                          <div className="flex items-center space-x-1">
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
                                className="text-[10px]"
                              />
                            ) : (
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: brandTheme.gray[300] }}
                                  title="Unassigned"
                                >
                                  <User 
                                    className="w-2 h-2" 
                                    style={{ color: brandTheme.text.muted }} 
                                  />
                                </div>
                                <span className="text-[10px]" style={{ color: brandTheme.text.secondary }}>
                                  Unassigned
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Combined Hours */}
                          <div className="text-xs" style={{ color: brandTheme.text.primary }}>
                            <span className="font-semibold">{task.hoursSpent.toFixed(1)}h</span>
                            <span className="opacity-75">/{task.hoursPlanned.toFixed(1)}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  }))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectClick?.(group.project);
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors hover:opacity-80"
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
                    className="text-xs px-3 py-1 rounded transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: brandTheme.primary.navy,
                      color: brandTheme.background.primary,
                    }}
                  >
                    Sprint Review
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
    </>
  );
};

export default SprintGroupContainer;

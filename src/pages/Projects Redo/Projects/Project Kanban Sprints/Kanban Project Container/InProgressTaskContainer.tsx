import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { Clock, Target, User, AlertCircle } from 'lucide-react';
import UserAvatar from '../../../../../components/UserAvatar';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';

interface InProgressTask {
  id: string;
  name: string;
  description?: string;
  status: string; // "in-progress"
  priority?: string;
  assignee_id?: string;
  assignee?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_color?: string;
  };
  hoursSpent: number;
  hoursPlanned: number;
  project: {
    id: string;
    name: string;
  };
  sprint_type: 'Sprint 1' | 'Sprint 2';
  created_at?: string;
  updated_at?: string;
  end_date?: string;
  project_id?: string;
}

interface InProgressTaskContainerProps {
  refreshTrigger?: number;
}

const InProgressTaskContainer: React.FC<InProgressTaskContainerProps> = ({ refreshTrigger }) => {
  const [inProgressTasks, setInProgressTasks] = useState<InProgressTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Task Details Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    loadInProgressTasks();
  }, [refreshTrigger]);

  const loadInProgressTasks = async () => {
    setIsLoading(true);
    try {
      // Get all active sprint groups from both Sprint 1 and Sprint 2
      const { data: sprintGroups, error: sprintError } = await (supabase as any)
        .from('PMA_Sprints')
        .select(`
          id,
          project_id,
          selected_task_ids,
          sprint_type,
          status,
          PMA_Projects!inner (
            id,
            name
          )
        `)
        .in('sprint_type', ['Sprint 1', 'Sprint 2'])
        .eq('status', 'active');

      if (sprintError) {
        console.error('Error fetching sprint groups:', sprintError);
        return;
      }

      if (!sprintGroups || sprintGroups.length === 0) {
        setInProgressTasks([]);
        return;
      }

      // Collect all task IDs from all sprint groups
      const allTaskIds = sprintGroups.reduce((acc: string[], group: any) => {
        return acc.concat(group.selected_task_ids || []);
      }, []);

      if (allTaskIds.length === 0) {
        setInProgressTasks([]);
        return;
      }

      // Fetch tasks that are "in-progress"
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
        .in('id', allTaskIds)
        .eq('status', 'in-progress');

      if (tasksError) {
        console.error('Error loading in progress tasks:', tasksError);
        return;
      }

      if (!tasksData || tasksData.length === 0) {
        setInProgressTasks([]);
        return;
      }

      // Enrich tasks with hours data, assignee info, project info, and sprint type
      const tasksWithDetails = await Promise.all(
        tasksData.map(async (task: any) => {
          // Find which sprint group this task belongs to
          const sprintGroup = sprintGroups.find((group: any) => 
            group.selected_task_ids && group.selected_task_ids.includes(task.id)
          );

          // Get assignee information if assignee_id exists
          let assignee = null;
          if (task.assignee_id) {
            const { data: userData } = await (supabase as any)
              .from('PMA_Users')
              .select('id, email, first_name, last_name, profile_color')
              .eq('id', task.assignee_id)
              .single();
            
            if (userData) {
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
            assignee,
            hoursSpent,
            hoursPlanned,
            project: sprintGroup?.PMA_Projects || { id: task.project_id, name: 'Unknown Project' },
            sprint_type: sprintGroup?.sprint_type || 'Sprint 1'
          };
        })
      );

      setInProgressTasks(tasksWithDetails);
    } catch (error) {
      console.error('Error loading in progress tasks:', error);
    } finally {
      setIsLoading(false);
    }
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


  const getSprintBadgeColor = (sprintType: string) => {
    return sprintType === 'Sprint 1' 
      ? { bg: brandTheme.status.infoLight, text: brandTheme.status.info }
      : { bg: brandTheme.status.warningLight, text: brandTheme.status.warning };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          className="animate-spin rounded-full h-6 w-6 border-b-2"
          style={{ borderColor: brandTheme.primary.navy }}
        />
        <span className="ml-2 text-sm" style={{ color: brandTheme.text.secondary }}>
          Loading in progress tasks...
        </span>
      </div>
    );
  }

  if (inProgressTasks.length === 0) {
    return (
      <div 
        className="text-center py-8 text-sm"
        style={{ color: brandTheme.text.muted }}
      >
        <p>No tasks in progress</p>
        <p className="text-xs mt-1">Tasks from active sprint groups will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {inProgressTasks.map((task) => {
          
          return (
            <div 
              key={task.id} 
              className="rounded-lg border overflow-hidden hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light,
                boxShadow: brandTheme.shadow.sm
              }}
            >
              {/* Header Section */}
              <div 
                className="px-4 py-3 border-b"
                style={{ 
                  backgroundColor: brandTheme.primary.navy,
                  borderColor: brandTheme.border.light
                }}
              >
                {/* Task Name - Clickable */}
                <div 
                  className="font-semibold text-sm cursor-pointer hover:underline transition-colors mb-1"
                  style={{ color: brandTheme.background.primary }}
                  onClick={() => handleTaskClick(task.id)}
                  title="Click to view task details"
                >
                  {task.name}
                </div>
                
                {/* Project Name */}
                <div 
                  className="text-xs opacity-90"
                  style={{ color: brandTheme.background.primary }}
                >
                  {task.project.name}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-3">
                {/* Priority and Sprint Row */}
                <div className="flex items-center justify-between">
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
                  
                  {/* Sprint */}
                  <div className="flex items-center space-x-1">
                    <span 
                      className="text-xs font-medium"
                      style={{ color: brandTheme.text.muted }}
                    >
                      Sprint:
                    </span>
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: getSprintBadgeColor(task.sprint_type).text }}
                    >
                      {task.sprint_type}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-xs font-medium"
                      style={{ color: brandTheme.text.muted }}
                    >
                      Progress
                    </span>
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {task.hoursPlanned > 0 
                        ? `${Math.min(Math.round((task.hoursSpent / task.hoursPlanned) * 100), 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: brandTheme.gray[200] }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: task.hoursPlanned > 0 
                          ? `${Math.min((task.hoursSpent / task.hoursPlanned) * 100, 100)}%`
                          : '0%',
                        backgroundColor: (() => {
                          if (task.hoursPlanned === 0) return brandTheme.gray[400];
                          const progressRatio = task.hoursSpent / task.hoursPlanned;
                          if (progressRatio >= 1) return brandTheme.status.success; // Green when complete/over
                          if (progressRatio >= 0.75) return brandTheme.status.warning; // Orange when close
                          return brandTheme.status.info; // Blue when in progress
                        })()
                      }}
                    />
                  </div>
                </div>

                {/* Hours Section */}
                <div>
                  <div 
                    className="text-xs font-medium mb-2"
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
                        className="text-sm font-semibold"
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
                        className="text-sm font-semibold"
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
                    className="text-xs font-medium mb-2"
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
                      size="sm"
                      showName={true}
                      className="text-xs"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: brandTheme.gray[200] }}
                      >
                        <User 
                          className="w-3 h-3" 
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

export default InProgressTaskContainer;

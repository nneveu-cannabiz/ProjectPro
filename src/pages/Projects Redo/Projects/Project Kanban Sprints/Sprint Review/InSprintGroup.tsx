import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { Clock, Target, User, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import UserAvatar from '../../../../../components/UserAvatar';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';
import { Task } from './types';

interface InSprintGroupProps {
  projectId: string;
  refreshTrigger?: number;
  sprintGroupId?: string; // Optional: filter to specific sprint group
  defaultExpanded?: boolean; // Optional: start expanded
}

interface SprintGroupTask extends Task {
  sprintType: 'Sprint 1' | 'Sprint 2';
  sprintGroupId: string;
  sprintGroupName: string;
  description?: string;
  assignee?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_color?: string;
  };
}

const InSprintGroup: React.FC<InSprintGroupProps> = ({ projectId, refreshTrigger, sprintGroupId, defaultExpanded = false }) => {
  const [sprintTasks, setSprintTasks] = useState<SprintGroupTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !!sprintGroupId); // Expanded by default if specified or sprintGroupId is provided
  
  // Task Details Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    loadSprintTasks();
  }, [projectId, refreshTrigger, sprintGroupId]);

  const loadSprintTasks = async () => {
    setIsLoading(true);
    try {
      // Get sprint groups for this project (all or specific one)
      let sprintQuery = (supabase as any)
        .from('PMA_Sprints')
        .select('id, name, sprint_type, selected_task_ids')
        .eq('project_id', projectId)
        .eq('status', 'active');
      
      // If sprintGroupId is provided, filter to that specific group
      if (sprintGroupId) {
        sprintQuery = sprintQuery.eq('id', sprintGroupId);
      }
      
      const { data: sprintGroups, error: sprintError } = await sprintQuery;

      if (sprintError) {
        console.error('Error fetching sprint groups:', sprintError);
        return;
      }

      if (!sprintGroups || sprintGroups.length === 0) {
        setSprintTasks([]);
        return;
      }

      // Collect all task IDs from all sprint groups
      const allSprintTaskIds = new Set<string>();
      const taskToSprintMap = new Map<string, { sprintType: string, sprintGroupId: string, sprintGroupName: string }>();

      sprintGroups.forEach((group: any) => {
        (group.selected_task_ids || []).forEach((taskId: string) => {
          allSprintTaskIds.add(taskId);
          taskToSprintMap.set(taskId, {
            sprintType: group.sprint_type,
            sprintGroupId: group.id,
            sprintGroupName: group.name
          });
        });
      });

      if (allSprintTaskIds.size === 0) {
        setSprintTasks([]);
        return;
      }

      // Fetch task details for all sprint tasks
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
        .in('id', Array.from(allSprintTaskIds));

      if (tasksError) {
        console.error('Error fetching sprint tasks:', tasksError);
        return;
      }

      // Enrich tasks with sprint info, hours, and assignee details
      const enrichedTasks = await Promise.all(
        (tasksData || []).map(async (task: any) => {
          const sprintInfo = taskToSprintMap.get(task.id);
          
          // Get assignee information
          let assigneeName = 'Unassigned';
          let assignee = null;
          if (task.assignee_id) {
            const { data: userData } = await (supabase as any)
              .from('PMA_Users')
              .select('id, email, first_name, last_name, profile_color')
              .eq('id', task.assignee_id)
              .single();
            if (userData) {
              assignee = userData;
              assigneeName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'Unknown';
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

          const totalHoursSpent = (spentHours || []).reduce((sum: number, h: any) => sum + (h.hours || 0), 0);
          const totalHoursPlanned = (plannedHours || []).reduce((sum: number, h: any) => sum + (h.hours || 0), 0);

          return {
            ...task,
            assigneeName,
            assignee,
            hoursSpent: totalHoursSpent,
            hoursPlanned: totalHoursPlanned,
            sprintType: sprintInfo?.sprintType || 'Unknown',
            sprintGroupId: sprintInfo?.sprintGroupId || '',
            sprintGroupName: sprintInfo?.sprintGroupName || 'Unknown Sprint',
            description: task.description || undefined
          } as SprintGroupTask;
        })
      );

      // Sort by sprint type, then by task name
      enrichedTasks.sort((a, b) => {
        if (a.sprintType !== b.sprintType) {
          return a.sprintType.localeCompare(b.sprintType);
        }
        return a.name.localeCompare(b.name);
      });

      setSprintTasks(enrichedTasks);
    } catch (error) {
      console.error('Error loading sprint tasks:', error);
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
      case 'critical': return '#FF0000'; // Bright Red
      case 'high': return '#DC2626'; // Red
      case 'medium': return '#EAB308'; // Yellow
      case 'low': return '#16A34A'; // Green
      default: return brandTheme.text.muted;
    }
  };

  const getPriorityBgColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#FECACA'; // Light Red background
      case 'high': return '#FEE2E2'; // Light Red background
      case 'medium': return '#FEF3C7'; // Light Yellow background
      case 'low': return '#DCFCE7'; // Light Green background
      default: return brandTheme.background.secondary;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done': return brandTheme.status.success;
      case 'in-progress': return brandTheme.status.info;
      case 'to do': return brandTheme.gray[500];
      default: return brandTheme.text.muted;
    }
  };

  const getSprintBadgeColor = (sprintType: string) => {
    return sprintType === 'Sprint 1' 
      ? { bg: brandTheme.status.infoLight, text: brandTheme.status.info }
      : { bg: brandTheme.status.warningLight, text: brandTheme.status.warning };
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-center p-4">
          <div 
            className="animate-spin rounded-full h-4 w-4 border-b-2"
            style={{ borderColor: brandTheme.primary.navy }}
          />
          <span className="ml-2 text-sm" style={{ color: brandTheme.text.secondary }}>
            Loading sprint tasks...
          </span>
        </div>
      </div>
    );
  }

  if (sprintTasks.length === 0) {
    return null; // Don't show section if no sprint tasks
  }

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        style={{ 
          backgroundColor: brandTheme.primary.navy,
          color: brandTheme.background.primary 
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <h3 className="text-lg font-bold">
            {sprintGroupId ? 'Sprint Group Tasks' : 'Already in Sprint Groups'}
          </h3>
        </div>
        <div className="text-sm opacity-90">
          {sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div 
          className="border-x border-b"
          style={{ 
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light 
          }}
        >
          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-4 p-4 text-sm font-medium border-b"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.medium,
              color: brandTheme.text.primary 
            }}
          >
            <div className="col-span-4">Task Name</div>
            <div className="col-span-2">Sprint Group</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-1 text-center">Hours</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
            {sprintTasks.map((task) => {
              const sprintColors = getSprintBadgeColor(task.sprintType);
              
              return (
                <div 
                  key={task.id} 
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-opacity-50"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {/* Task Name */}
                  <div className="col-span-4">
                    <div 
                      className="font-medium text-sm cursor-pointer hover:underline transition-colors"
                      style={{ color: brandTheme.primary.navy }}
                      onClick={() => handleTaskClick(task.id)}
                      title="Click to view task details"
                    >
                      {task.name}
                    </div>
                  </div>

                  {/* Sprint Group */}
                  <div className="col-span-2">
                    <div 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: sprintColors.bg,
                        color: sprintColors.text
                      }}
                    >
                      {task.sprintType}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: task.status === 'done' ? brandTheme.status.successLight :
                                         task.status === 'in-progress' ? brandTheme.status.infoLight :
                                         brandTheme.gray[100],
                        color: getStatusColor(task.status || '')
                      }}
                    >
                      {task.status === 'in-progress' ? 'In Progress' : 
                       task.status === 'to do' ? 'To Do' : 
                       (task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Unknown')}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1">
                    {task.priority && (
                      <div 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getPriorityBgColor(task.priority),
                          color: getPriorityColor(task.priority)
                        }}
                      >
                        <AlertCircle className="w-2 h-2 mr-1" />
                        {task.priority?.charAt(0).toUpperCase() || 'N'}
                      </div>
                    )}
                  </div>

                  {/* Assignee */}
                  <div className="col-span-2">
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
                        >
                          <User className="w-2 h-2" style={{ color: brandTheme.text.muted }} />
                        </div>
                        <span className="text-[10px]" style={{ color: brandTheme.text.secondary }}>
                          Unassigned
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hours */}
                  <div className="col-span-1 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                        <span className="text-xs font-medium" style={{ color: brandTheme.text.primary }}>
                          {task.hoursSpent.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                        <span className="text-xs font-medium" style={{ color: brandTheme.text.primary }}>
                          {task.hoursPlanned.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
};

export default InSprintGroup;

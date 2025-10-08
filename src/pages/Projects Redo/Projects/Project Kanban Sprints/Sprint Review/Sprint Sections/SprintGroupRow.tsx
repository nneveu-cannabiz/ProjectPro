import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { supabase } from '../../../../../../lib/supabase';
import { 
  Calendar, 
  Clock, 
  Target, 
  Users, 
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react';
import UserAvatar from '../../../../../../components/UserAvatar';
import HoursPlannedModal from '../HoursPlannedModal';
import TaskDetailsModal from '../../../Flow Chart/utils/Profiles/TaskDetailsModal';
import InSprintReviewModal from '../InSprintReviewModal';

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
  taskCount: number;
  hoursSpent: number;
  hoursPlanned: number;
  teamMembers: number;
}

interface TaskSummary {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  assignee?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_color?: string;
  };
  hoursSpent: number;
  hoursPlanned: number;
  start_date?: string;
  end_date?: string;
}

interface ModalSprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  status: string;
  name: string;
  description?: string;
  project: {
    id: string;
    name: string;
    description?: string;
    priority?: string;
    assignee_id?: string;
    status?: string;
  };
}

interface SprintGroupRowProps {
  sprintGroup: SprintGroup;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const SprintGroupRow: React.FC<SprintGroupRowProps> = ({
  sprintGroup,
  onProjectClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskForHours, setSelectedTaskForHours] = useState<TaskSummary | null>(null);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);
  const [editingDateField, setEditingDateField] = useState<'start_date' | 'end_date' | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [modalSprintGroup, setModalSprintGroup] = useState<ModalSprintGroup | null>(null);

  useEffect(() => {
    if (isExpanded && tasks.length === 0) {
      loadTasks();
    }
  }, [isExpanded]);

  const loadTasks = async () => {
    if (!sprintGroup.selected_task_ids || sprintGroup.selected_task_ids.length === 0) {
      return;
    }

    setIsLoadingTasks(true);
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await (supabase as any)
        .from('PMA_Tasks')
        .select(`
          id,
          name,
          status,
          priority,
          assignee_id,
          start_date,
          end_date
        `)
        .in('id', sprintGroup.selected_task_ids);

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        return;
      }

      // Enrich tasks with assignee and hours data
      const enrichedTasks = await Promise.all(
        (tasksData || []).map(async (task: any) => {
          // Get assignee information
          let assignee = null;
          if (task.assignee_id) {
            const { data: userData } = await (supabase as any)
              .from('PMA_Users')
              .select('id, email, first_name, last_name, profile_color')
              .eq('id', task.assignee_id)
              .single();
            
            if (userData) {
              assignee = userData;
            }
          }

          // Get hours data
          const { data: hoursData } = await (supabase as any)
            .from('PMA_Hours')
            .select('hours, is_planning_hours')
            .eq('task_id', task.id);

          let hoursSpent = 0;
          let hoursPlanned = 0;

          if (hoursData) {
            hoursData.forEach((hour: any) => {
              if (hour.is_planning_hours) {
                hoursPlanned += hour.hours || 0;
              } else {
                hoursSpent += hour.hours || 0;
              }
            });
          }

          return {
            ...task,
            assignee,
            hoursSpent,
            hoursPlanned
          };
        })
      );

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
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

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done': return brandTheme.status.success;
      case 'in-progress': return brandTheme.status.inProgress;
      case 'to do': return brandTheme.gray[500];
      default: return brandTheme.text.muted;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleHoursPlannedClick = (task: TaskSummary) => {
    setSelectedTaskForHours(task);
    setIsHoursModalOpen(true);
  };

  const handleCloseHoursModal = () => {
    setSelectedTaskForHours(null);
    setIsHoursModalOpen(false);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
    setIsTaskModalOpen(false);
  };

  const handleHoursUpdated = () => {
    // Reload tasks to get updated hours
    loadTasks();
  };

  const hasUnplannedTasks = () => {
    return tasks.some(task => task.hoursPlanned === 0);
  };

  const handleDateEdit = (taskId: string, field: 'start_date' | 'end_date', currentValue?: string) => {
    setEditingDateTaskId(taskId);
    setEditingDateField(field);
    setEditDateValue(currentValue || '');
  };

  const handleDateSave = async (taskId: string) => {
    if (!editingDateField) return;

    try {
      const updateData = {
        [editingDateField]: editDateValue || null
      };

      const { error } = await (supabase as any)
        .from('PMA_Tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task date:', error);
        return;
      }

      // Reset editing state
      setEditingDateTaskId(null);
      setEditingDateField(null);
      setEditDateValue('');

      // Reload tasks
      loadTasks();
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  const handleDateCancel = () => {
    setEditingDateTaskId(null);
    setEditingDateField(null);
    setEditDateValue('');
  };

  const formatTaskDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSprintNameClick = () => {
    // Transform the sprint group data to match the modal's expected format
    const modalData: ModalSprintGroup = {
      id: sprintGroup.id,
      project_id: sprintGroup.project_id,
      selected_task_ids: sprintGroup.selected_task_ids,
      sprint_type: sprintGroup.sprint_type,
      status: sprintGroup.status,
      name: sprintGroup.name,
      description: sprintGroup.description,
      project: sprintGroup.project,
    };

    setModalSprintGroup(modalData);
    setIsSprintModalOpen(true);
  };

  const handleCloseSprintModal = () => {
    setIsSprintModalOpen(false);
    setModalSprintGroup(null);
  };

  // Get the rank for this sprint type
  const rankingKey = `Sprint: ${sprintGroup.sprint_type}`;
  const currentRank = sprintGroup.ranking?.[rankingKey];
  const hasRank = currentRank !== undefined;

  return (
    <div 
      className="rounded-lg border hover:shadow-lg transition-all duration-200"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.medium,
        boxShadow: brandTheme.shadow.sm
      }}
    >
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Project Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Rank Badge */}
            <div
              className="flex-shrink-0 flex items-center justify-center font-bold text-xs rounded px-2 py-1 min-w-[40px]"
              style={{
                backgroundColor: hasRank ? brandTheme.primary.navy : brandTheme.gray[300],
                color: hasRank ? '#FFFFFF' : brandTheme.text.muted,
              }}
              title={hasRank ? `Rank ${currentRank}` : 'Unranked'}
            >
              {hasRank ? `#${currentRank}` : '-'}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
            >
              <ChevronRight 
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                style={{ color: brandTheme.primary.navy }}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h4 
                  className="font-semibold text-base truncate cursor-pointer hover:underline"
                  style={{ color: brandTheme.primary.navy }}
                  onClick={handleSprintNameClick}
                  title="Click to review sprint group"
                >
                  {sprintGroup.name}
                </h4>
                
                <button
                  onClick={() => onProjectClick?.(sprintGroup.project)}
                  className="flex-shrink-0 p-1 rounded transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="View project details"
                >
                  <ExternalLink 
                    className="w-3 h-3" 
                    style={{ color: brandTheme.primary.navy }} 
                  />
                </button>
              </div>
              
              <p 
                className="text-sm truncate mt-1"
                style={{ color: brandTheme.text.secondary }}
                title={sprintGroup.project.name}
              >
                {sprintGroup.project.name}
              </p>
            </div>
          </div>

          {/* Right Side - Stats */}
          <div className="flex items-center space-x-8 flex-shrink-0">
            {/* Task Count */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
              <Calendar className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
              <span 
                className="text-sm font-semibold"
                style={{ color: brandTheme.text.primary }}
              >
                {sprintGroup.taskCount}
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: brandTheme.text.secondary }}
              >
                tasks
              </span>
            </div>

            {/* Hours Spent */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: brandTheme.background.brandLight }}>
              <Clock className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
              <span 
                className="text-sm font-semibold"
                style={{ color: brandTheme.text.primary }}
              >
                {sprintGroup.hoursSpent.toFixed(1)}h
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: brandTheme.text.secondary }}
              >
                spent
              </span>
            </div>

            {/* Hours Planned */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: brandTheme.primary.paleBlue }}>
              <Target className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
              <span 
                className="text-sm font-semibold"
                style={{ color: (sprintGroup.hoursPlanned === 0 || hasUnplannedTasks()) ? brandTheme.status.error : brandTheme.text.primary }}
              >
                {sprintGroup.hoursPlanned.toFixed(1)}h
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: brandTheme.text.secondary }}
              >
                planned
              </span>
            </div>

            {/* Team Members */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
              <Users className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
              <span 
                className="text-sm font-semibold"
                style={{ color: brandTheme.text.primary }}
              >
                {sprintGroup.teamMembers}
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: brandTheme.text.secondary }}
              >
                members
              </span>
            </div>

            {/* Created Date */}
            <div className="text-xs font-medium px-2" style={{ color: brandTheme.text.muted }}>
              {formatDate(sprintGroup.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Task Details */}
      {isExpanded && (
        <div 
          className="border-t"
          style={{ 
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light 
          }}
        >
          {isLoadingTasks ? (
            <div className="p-6 text-center">
              <div 
                className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-3"
                style={{ borderColor: brandTheme.primary.navy }}
              />
              <p style={{ color: brandTheme.text.secondary }}>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div 
              className="p-6 text-center"
              style={{ color: brandTheme.text.muted }}
            >
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tasks found in this sprint group</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Task List Header */}
              <div 
                className="grid gap-2 p-4 mb-4 rounded-lg text-sm font-semibold"
                style={{ 
                  backgroundColor: brandTheme.primary.navy,
                  color: brandTheme.background.primary,
                  borderRadius: brandTheme.radius.lg,
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr 1fr 1.5fr 1fr 1fr'
                }}
              >
                <div className="text-left">Task Name</div>
                <div className="text-center">Hours Spent</div>
                <div className="text-center">Hours Planned</div>
                <div className="text-center">Priority</div>
                <div className="text-center">Status</div>
                <div className="text-center">Assignee</div>
                <div className="text-center">Start Date</div>
                <div className="text-center">End Date</div>
              </div>

              {/* Task Rows */}
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="grid gap-2 p-3 rounded-lg transition-all duration-200"
                    style={{ 
                      backgroundColor: brandTheme.background.secondary,
                      borderRadius: brandTheme.radius.md,
                      gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr 1fr 1.5fr 1fr 1fr'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.brandLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                  >
                    {/* Task Name */}
                    <div className="h-[2rem] flex items-center overflow-hidden">
                      <span 
                        className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap truncate block"
                        style={{ 
                          color: brandTheme.primary.navy,
                          lineHeight: '2rem'
                        }}
                        title={`${task.name} - Click to view task details`}
                        onClick={() => handleTaskClick(task.id)}
                      >
                        {task.name}
                      </span>
                    </div>

                    {/* Hours Spent */}
                    <div className="h-[2rem] flex items-center justify-center">
                      <span 
                        className="text-xs font-medium"
                        style={{ color: brandTheme.text.primary, lineHeight: '2rem' }}
                      >
                        {task.hoursSpent.toFixed(1)}h
                      </span>
                    </div>

                    {/* Hours Planned */}
                    <div className="h-[2rem] flex items-center justify-center">
                      <span 
                        className="text-xs font-medium cursor-pointer hover:underline hover:bg-opacity-10 px-1 py-1 rounded transition-all"
                        style={{ 
                          color: task.hoursPlanned === 0 ? brandTheme.status.error : brandTheme.primary.navy,
                          backgroundColor: 'transparent',
                          lineHeight: '1rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${brandTheme.primary.navy}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => handleHoursPlannedClick(task)}
                        title={task.hoursPlanned === 0 ? "No hours planned - Click to add planned hours" : "Click to edit planned hours"}
                      >
                        {task.hoursPlanned.toFixed(1)}h
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="h-[2rem] flex items-center justify-center">
                      {task.priority ? (
                        <div className="flex items-center justify-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          />
                          <span 
                            className="text-xs font-medium truncate whitespace-nowrap"
                            style={{ color: brandTheme.text.primary, lineHeight: '2rem' }}
                            title={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          >
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: brandTheme.text.muted, lineHeight: '2rem' }}>-</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="h-[2rem] flex items-center justify-center">
                      {task.status ? (
                        <div className="flex items-center justify-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getStatusColor(task.status) }}
                          />
                          <span 
                            className="text-xs font-medium truncate whitespace-nowrap"
                            style={{ color: brandTheme.text.primary, lineHeight: '2rem' }}
                            title={
                              task.status === 'in-progress' ? 'In Progress' : 
                              task.status === 'to do' ? 'To Do' : 
                              task.status.charAt(0).toUpperCase() + task.status.slice(1)
                            }
                          >
                            {task.status === 'in-progress' ? 'In Progress' : 
                             task.status === 'to do' ? 'To Do' : 
                             task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: brandTheme.text.muted, lineHeight: '2rem' }}>-</span>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="h-[2rem] flex items-center justify-center">
                      {task.assignee ? (
                        <div className="flex items-center space-x-2">
                          <UserAvatar 
                            user={{
                              id: task.assignee.id,
                              email: task.assignee.email || '',
                              firstName: task.assignee.first_name || '',
                              lastName: task.assignee.last_name || '',
                              profileColor: task.assignee.profile_color
                            }}
                            size="xs"
                            showName={false}
                            className="text-[10px]"
                          />
                          <span 
                            className="text-xs font-medium truncate max-w-[100px] whitespace-nowrap"
                            style={{ color: brandTheme.text.primary, lineHeight: '2rem' }}
                            title={`${task.assignee.first_name || ''} ${task.assignee.last_name || ''}`.trim() || task.assignee.email}
                          >
                            {task.assignee.first_name || task.assignee.email?.split('@')[0] || 'User'}
                          </span>
                        </div>
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
                          <span 
                            className="text-xs font-medium whitespace-nowrap"
                            style={{ color: brandTheme.text.muted, lineHeight: '2rem' }}
                          >
                            Unassigned
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Start Date */}
                    <div className="h-[2rem] flex items-center justify-center">
                      {editingDateTaskId === task.id && editingDateField === 'start_date' ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="date"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="text-xs px-1 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                            style={{ 
                              borderColor: brandTheme.border.medium,
                              backgroundColor: brandTheme.background.primary 
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleDateSave(task.id);
                              if (e.key === 'Escape') handleDateCancel();
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span 
                          className="text-xs font-medium cursor-pointer hover:underline px-1 py-1 rounded transition-all whitespace-nowrap"
                          style={{ color: brandTheme.primary.navy, lineHeight: '1rem' }}
                          onClick={() => handleDateEdit(task.id, 'start_date', task.start_date)}
                          title="Click to edit start date"
                        >
                          {formatTaskDate(task.start_date)}
                        </span>
                      )}
                    </div>

                    {/* End Date */}
                    <div className="h-[2rem] flex items-center justify-center">
                      {editingDateTaskId === task.id && editingDateField === 'end_date' ? (
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="date"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="text-xs px-1 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                            style={{ 
                              borderColor: brandTheme.border.medium,
                              backgroundColor: brandTheme.background.primary 
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleDateSave(task.id);
                              if (e.key === 'Escape') handleDateCancel();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleDateSave(task.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleDateCancel}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Cancel"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="text-xs font-medium cursor-pointer hover:underline px-1 py-1 rounded transition-all whitespace-nowrap"
                          style={{ color: brandTheme.primary.navy, lineHeight: '1rem' }}
                          onClick={() => handleDateEdit(task.id, 'end_date', task.end_date)}
                          title="Click to edit end date"
                        >
                          {formatTaskDate(task.end_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hours Planned Modal */}
      {selectedTaskForHours && (
        <HoursPlannedModal
          isOpen={isHoursModalOpen}
          onClose={handleCloseHoursModal}
          taskId={selectedTaskForHours.id}
          taskName={selectedTaskForHours.name}
          onHoursUpdated={handleHoursUpdated}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}

      {/* Sprint Review Modal */}
      <InSprintReviewModal
        isOpen={isSprintModalOpen}
        onClose={handleCloseSprintModal}
        sprintGroup={modalSprintGroup}
      />
    </div>
  );
};

export default SprintGroupRow;

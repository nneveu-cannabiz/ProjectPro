import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { X, User } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import SprintSummary from './SprintSummary';
import EditableCell from './EditableCell';
import EmptyState from './EmptyState';
import HoursPlannedModal from './HoursPlannedModal';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from '../../../../../components/UserAvatar';
import { useTaskEditing } from './useTaskEditing';
import { Task } from './types';

interface SprintGroup {
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

interface InSprintReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintGroup: SprintGroup | null;
}

const InSprintReviewModal: React.FC<InSprintReviewModalProps> = ({
  isOpen,
  onClose,
  sprintGroup
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'summary' | 'reports'>('tasks');
  const [sprintTasks, setSprintTasks] = useState<SprintGroupTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hours Planned Modal state
  const [selectedTaskForHours, setSelectedTaskForHours] = useState<{ id: string; name: string } | null>(null);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  const loadSprintTasks = async () => {
    if (!sprintGroup) return;
    
    setIsLoading(true);
    try {
      if (!sprintGroup.selected_task_ids || sprintGroup.selected_task_ids.length === 0) {
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
        .in('id', sprintGroup.selected_task_ids);

      if (tasksError) {
        console.error('Error fetching sprint tasks:', tasksError);
        return;
      }

      // Enrich tasks with sprint info, hours, and assignee details
      const enrichedTasks = await Promise.all(
        (tasksData || []).map(async (task: any) => {
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
            sprintType: sprintGroup.sprint_type,
            sprintGroupId: sprintGroup.id,
            sprintGroupName: sprintGroup.name,
            description: task.description || undefined,
            isSelected: false // Default selection state
          } as SprintGroupTask;
        })
      );

      // Sort by priority (Critical > High > Medium > Low) then by name
      enrichedTasks.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3, '': 4 };
        const aPriority = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4;
        const bPriority = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
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

  // Task editing functionality - must be after loadSprintTasks function declaration
  const {
    editingCell,
    editValue,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleEditValueChange
  } = useTaskEditing(loadSprintTasks);

  useEffect(() => {
    if (isOpen && sprintGroup) {
      loadSprintTasks();
    }
  }, [isOpen, sprintGroup]);

  const handleHoursPlannedClick = (taskId: string, taskName: string) => {
    setSelectedTaskForHours({ id: taskId, name: taskName });
    setIsHoursModalOpen(true);
  };

  const handleCloseHoursModal = () => {
    setIsHoursModalOpen(false);
    setSelectedTaskForHours(null);
  };

  const handleHoursUpdated = () => {
    loadSprintTasks(); // Refresh the task data to show updated hours
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

  // Separate tasks by status for display
  const activeTasks = sprintTasks.filter(task => task.status?.toLowerCase() !== 'done');
  const completedTasks = sprintTasks.filter(task => task.status?.toLowerCase() === 'done');

  if (!isOpen || !sprintGroup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-7xl flex flex-col"
        style={{ 
          minHeight: '80vh',
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light 
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.brand 
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">
              Epic Review
            </h2>
            <p className="text-sm text-white opacity-90 mt-1">
              {sprintGroup.name} • {sprintGroup.sprint_type}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          className="px-6 py-4 border-b"
          style={{ 
            backgroundColor: brandTheme.background.brandLight,
            borderColor: brandTheme.border.light 
          }}
        >
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'tasks' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'tasks' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Sprint Tasks
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'summary' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'summary' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'reports' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'reports' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 'calc(80vh - 200px)' }}>
          {activeTab === 'tasks' && (
            <div className="h-full">
              {isLoading ? (
                <LoadingSpinner />
              ) : sprintTasks.length === 0 ? (
                <EmptyState projectId={sprintGroup.project_id} />
              ) : (
                <div className="p-6">
                  {/* Sprint Summary */}
                  <SprintSummary 
                    tasks={sprintTasks}
                    isSelectionMode={false}
                    selectedTaskCount={0}
                  />

                  {/* Active Tasks Section */}
                  {activeTasks.length > 0 && (
                    <div className="mb-8">
                      {/* Section Header */}
                      <div 
                        className="p-4 mb-4"
                        style={{ 
                          backgroundColor: brandTheme.primary.navy,
                          color: brandTheme.background.primary 
                        }}
                      >
                        <h3 className="text-lg font-bold">
                          Active Tasks
                        </h3>
                        <div className="text-sm opacity-90">
                          {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Task Table Header */}
                      <div 
                        className="grid grid-cols-12 gap-4 p-4 text-sm font-medium border-b"
                        style={{ 
                          backgroundColor: brandTheme.background.secondary,
                          borderColor: brandTheme.border.medium,
                          color: brandTheme.text.primary 
                        }}
                      >
                        <div className="col-span-3">Task Name</div>
                        <div className="col-span-2">Hours Spent</div>
                        <div className="col-span-2">Hours Planned</div>
                        <div className="col-span-1 -ml-2">Priority</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Assignee</div>
                      </div>

                      {/* Task Rows */}
                      <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
                        {activeTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="grid grid-cols-12 gap-4 p-4 hover:bg-opacity-50"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            {/* Task Name */}
                            <div className="col-span-3">
                              <div 
                                className="font-medium text-sm"
                                style={{ color: brandTheme.text.primary }}
                                title={task.description || task.name}
                              >
                                {task.name}
                              </div>
                            </div>

                            {/* Hours Spent */}
                            <div className="col-span-2">
                              <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                                {task.hoursSpent.toFixed(1)}h
                              </span>
                            </div>

                            {/* Hours Planned */}
                            <div className="col-span-2">
                              <div 
                                className="text-sm font-medium cursor-pointer hover:underline transition-colors"
                                style={{ color: brandTheme.primary.navy }}
                                onClick={() => handleHoursPlannedClick(task.id, task.name)}
                                title="Click to view/edit planned hours"
                              >
                                {task.hoursPlanned.toFixed(1)}h
                              </div>
                            </div>

                            {/* Priority */}
                            <div className="col-span-1 -ml-2">
                              <EditableCell
                                task={task as Task}
                                field="priority"
                                value={task.priority || ''}
                                displayValue={
                                  task.priority && (
                                    <div className="flex items-center space-x-1">
                                      <div 
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                                      />
                                      <span 
                                        className="text-xs font-medium"
                                        style={{ color: getPriorityColor(task.priority) }}
                                      >
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                      </span>
                                    </div>
                                  )
                                }
                                editingCell={editingCell}
                                editValue={editValue}
                                onEditStart={handleEditStart}
                                onEditSave={handleEditSave}
                                onEditCancel={handleEditCancel}
                                onEditValueChange={handleEditValueChange}
                              />
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              <EditableCell
                                task={task as Task}
                                field="status"
                                value={task.status || ''}
                                displayValue={
                                  <div className="flex items-center">
                                    <div 
                                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                      style={{ 
                                        backgroundColor: task.status === 'done' ? brandTheme.status.success :
                                                       task.status === 'in-progress' ? brandTheme.status.inProgress :
                                                       task.status === 'to do' ? brandTheme.gray[400] :
                                                       brandTheme.text.muted
                                      }}
                                    />
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: getStatusColor(task.status || '') }}
                                    >
                                      {task.status === 'in-progress' ? 'In Progress' : 
                                       task.status === 'to do' ? 'To Do' : 
                                       (task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Unknown')}
                                    </span>
                                  </div>
                                }
                                editingCell={editingCell}
                                editValue={editValue}
                                onEditStart={handleEditStart}
                                onEditSave={handleEditSave}
                                onEditCancel={handleEditCancel}
                                onEditValueChange={handleEditValueChange}
                              />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks Section */}
                  {completedTasks.length > 0 && (
                    <div>
                      {/* Section Header */}
                      <div 
                        className="p-4 mb-4"
                        style={{ 
                          backgroundColor: brandTheme.primary.navy,
                          color: brandTheme.background.primary 
                        }}
                      >
                        <h3 className="text-lg font-bold">
                          Completed Tasks
                        </h3>
                        <div className="text-sm opacity-90">
                          {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Task Table Header */}
                      <div 
                        className="grid grid-cols-12 gap-4 p-4 text-sm font-medium border-b"
                        style={{ 
                          backgroundColor: brandTheme.background.secondary,
                          borderColor: brandTheme.border.medium,
                          color: brandTheme.text.primary 
                        }}
                      >
                        <div className="col-span-3">Task Name</div>
                        <div className="col-span-2">Hours Spent</div>
                        <div className="col-span-2">Hours Planned</div>
                        <div className="col-span-1 -ml-2">Priority</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Assignee</div>
                      </div>

                      {/* Task Rows */}
                      <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
                        {completedTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="grid grid-cols-12 gap-4 p-4 hover:bg-opacity-50 opacity-75"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            {/* Task Name */}
                            <div className="col-span-3">
                              <div 
                                className="font-medium text-sm"
                                style={{ color: brandTheme.text.primary }}
                                title={task.description || task.name}
                              >
                                {task.name}
                              </div>
                            </div>

                            {/* Hours Spent */}
                            <div className="col-span-2">
                              <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                                {task.hoursSpent.toFixed(1)}h
                              </span>
                            </div>

                            {/* Hours Planned */}
                            <div className="col-span-2">
                              <div 
                                className="text-sm font-medium cursor-pointer hover:underline transition-colors"
                                style={{ color: brandTheme.primary.navy }}
                                onClick={() => handleHoursPlannedClick(task.id, task.name)}
                                title="Click to view/edit planned hours"
                              >
                                {task.hoursPlanned.toFixed(1)}h
                              </div>
                            </div>

                            {/* Priority */}
                            <div className="col-span-1 -ml-2">
                              {task.priority && (
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                  />
                                  <span 
                                    className="text-xs font-medium"
                                    style={{ color: getPriorityColor(task.priority) }}
                                  >
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              <div className="flex items-center">
                                <div 
                                  className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                  style={{ backgroundColor: brandTheme.status.success }}
                                />
                                <span 
                                  className="text-xs font-medium"
                                  style={{ color: brandTheme.status.success }}
                                >
                                  Done
                                </span>
                              </div>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'summary' && (
            <div className="p-6">
              <div 
                className="text-center py-12"
                style={{ color: brandTheme.text.muted }}
              >
                <h3 className="text-lg font-semibold mb-2">Epic Summary</h3>
                <p>Summary view coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="p-6">
              <div 
                className="text-center py-12"
                style={{ color: brandTheme.text.muted }}
              >
                <h3 className="text-lg font-semibold mb-2">Epic Reports</h3>
                <p>Reports view coming soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="p-6 border-t flex justify-end space-x-3 flex-shrink-0"
          style={{ borderColor: brandTheme.border.light }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.medium,
              color: brandTheme.text.secondary,
            }}
          >
            Close
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default InSprintReviewModal;

import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { X, User, Edit2, Check } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import SprintSummary from './SprintSummary';
import EditableCell from './EditableCell';
import EmptyState from './EmptyState';
import HoursPlannedModal from './HoursPlannedModal';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from '../../../../../components/UserAvatar';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';
import { useTaskEditing } from './useTaskEditing';
import { Task } from './types';
import SprintProjectSummary from './sprintprojectsummary';

interface SprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  sprint_id?: string;
  start_date?: string;
  end_date?: string;
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

  // Task Details Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);

  // Epic Name Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedEpicName, setEditedEpicName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Task selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isManagingTasks, setIsManagingTasks] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableSprints, setAvailableSprints] = useState<any[]>([]);
  const [targetSprintId, setTargetSprintId] = useState<string>('');

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

  const handleTaskNameClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailsModalOpen(true);
  };

  const handleCloseTaskDetailsModal = () => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskId(null);
    loadSprintTasks(); // Refresh data when task modal closes
  };

  const handleEditName = () => {
    setEditedEpicName(sprintGroup?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!sprintGroup?.id || !editedEpicName.trim()) {
      alert('Please enter a valid epic name');
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .update({ name: editedEpicName.trim() })
        .eq('id', sprintGroup.id);

      if (error) {
        console.error('Error updating epic name:', error);
        alert('Failed to update epic name. Please try again.');
        return;
      }

      // Update local sprint group object
      if (sprintGroup) {
        sprintGroup.name = editedEpicName.trim();
      }
      
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating epic name:', error);
      alert('Failed to update epic name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedEpicName('');
  };

  const loadAvailableSprints = async () => {
    if (!sprintGroup) return;
    
    try {
      const { data: sprints, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('id, name, sprint_id, sprint_type, start_date, end_date')
        .eq('status', 'active')
        .neq('id', sprintGroup.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sprints:', error);
        return;
      }

      setAvailableSprints(sprints || []);
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.size === activeTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(activeTasks.map(t => t.id)));
    }
  };

  const handleRemoveTasks = async () => {
    if (!sprintGroup || selectedTaskIds.size === 0) return;

    if (!confirm(`Are you sure you want to remove ${selectedTaskIds.size} task(s) from this epic?`)) {
      return;
    }

    try {
      const updatedTaskIds = sprintGroup.selected_task_ids.filter(id => !selectedTaskIds.has(id));

      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .update({ selected_task_ids: updatedTaskIds })
        .eq('id', sprintGroup.id);

      if (error) {
        console.error('Error removing tasks:', error);
        alert('Failed to remove tasks. Please try again.');
        return;
      }

      // Update local state
      sprintGroup.selected_task_ids = updatedTaskIds;
      setSelectedTaskIds(new Set());
      setIsManagingTasks(false);
      loadSprintTasks();
    } catch (error) {
      console.error('Error removing tasks:', error);
      alert('Failed to remove tasks. Please try again.');
    }
  };

  const handleOpenMoveModal = async () => {
    if (selectedTaskIds.size === 0) {
      alert('Please select at least one task to move.');
      return;
    }
    await loadAvailableSprints();
    setShowMoveModal(true);
  };

  const handleMoveTasks = async () => {
    if (!sprintGroup || !targetSprintId || selectedTaskIds.size === 0) {
      alert('Please select a target sprint.');
      return;
    }

    try {
      // Get target sprint
      const { data: targetSprint, error: fetchError } = await (supabase as any)
        .from('PMA_Sprints')
        .select('selected_task_ids')
        .eq('id', targetSprintId)
        .single();

      if (fetchError) {
        console.error('Error fetching target sprint:', fetchError);
        alert('Failed to fetch target sprint. Please try again.');
        return;
      }

      // Remove tasks from current sprint
      const updatedCurrentTaskIds = sprintGroup.selected_task_ids.filter(id => !selectedTaskIds.has(id));

      // Add tasks to target sprint
      const targetTaskIds = targetSprint.selected_task_ids || [];
      const updatedTargetTaskIds = [...targetTaskIds, ...Array.from(selectedTaskIds)];

      // Update both sprints
      const { error: updateCurrentError } = await (supabase as any)
        .from('PMA_Sprints')
        .update({ selected_task_ids: updatedCurrentTaskIds })
        .eq('id', sprintGroup.id);

      if (updateCurrentError) {
        console.error('Error updating current sprint:', updateCurrentError);
        alert('Failed to update current sprint. Please try again.');
        return;
      }

      const { error: updateTargetError } = await (supabase as any)
        .from('PMA_Sprints')
        .update({ selected_task_ids: updatedTargetTaskIds })
        .eq('id', targetSprintId);

      if (updateTargetError) {
        console.error('Error updating target sprint:', updateTargetError);
        alert('Failed to update target sprint. Please try again.');
        return;
      }

      // Update local state
      sprintGroup.selected_task_ids = updatedCurrentTaskIds;
      setSelectedTaskIds(new Set());
      setIsManagingTasks(false);
      setShowMoveModal(false);
      setTargetSprintId('');
      loadSprintTasks();
      alert(`Successfully moved ${selectedTaskIds.size} task(s) to the target sprint.`);
    } catch (error) {
      console.error('Error moving tasks:', error);
      alert('Failed to move tasks. Please try again.');
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
          className="px-6 py-4 border-b relative"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.brand 
          }}
        >
          <div className="flex items-center justify-between w-full relative">
            {/* Left: Epic Review */}
            <div className="flex items-center gap-3 flex-shrink-0 z-10">
              <span className="text-sm font-semibold text-white opacity-90">
                Epic Review
              </span>
            </div>

            {/* Center: Epic Name (Absolutely centered) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedEpicName}
                    onChange={(e) => setEditedEpicName(e.target.value)}
                    className="px-3 py-2 text-xl font-bold rounded-lg text-center"
                    style={{
                      backgroundColor: 'white',
                      color: brandTheme.text.primary,
                      border: `2px solid ${brandTheme.primary.lightBlue}`,
                      minWidth: '300px',
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingName}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancel"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3 className="text-xl font-bold text-white text-center whitespace-nowrap">
                    {sprintGroup.name}
                  </h3>
                  <button
                    onClick={handleEditName}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-all"
                    title="Edit epic name"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Dates + Sprint Number + Close Button */}
            <div className="flex items-center gap-4 flex-shrink-0 z-10">
              {sprintGroup.start_date && sprintGroup.end_date && (
                <span className="text-sm font-medium text-white opacity-90">
                  {new Date(sprintGroup.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(sprintGroup.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="text-lg font-bold text-white">
                {sprintGroup.sprint_id ? `Sprint ${sprintGroup.sprint_id}` : sprintGroup.sprint_type}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div 
          className="px-6 py-2 border-b"
          style={{ 
            backgroundColor: brandTheme.background.brandLight,
            borderColor: brandTheme.border.light 
          }}
        >
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'tasks' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'tasks' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Epic Tasks
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                        className="px-4 py-2 mb-4 flex items-center justify-between"
                        style={{ 
                          backgroundColor: brandTheme.primary.navy,
                          color: brandTheme.background.primary 
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold">Active Tasks</h3>
                          <span className="text-xs opacity-90">
                            {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
                          </span>
                          {selectedTaskIds.size > 0 && (
                            <span className="text-xs opacity-90">
                              ({selectedTaskIds.size} selected)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isManagingTasks ? (
                            <button
                              onClick={() => setIsManagingTasks(true)}
                              className="px-3 py-1 text-xs rounded transition-colors"
                              style={{
                                backgroundColor: brandTheme.background.primary,
                                color: brandTheme.primary.navy
                              }}
                            >
                              Manage Tasks
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleSelectAllTasks}
                                className="px-3 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: brandTheme.background.primary,
                                  color: brandTheme.primary.navy
                                }}
                              >
                                {selectedTaskIds.size === activeTasks.length ? 'Deselect All' : 'Select All'}
                              </button>
                              {selectedTaskIds.size > 0 && (
                                <>
                                  <button
                                    onClick={handleOpenMoveModal}
                                    className="px-3 py-1 text-xs rounded transition-colors"
                                    style={{
                                      backgroundColor: brandTheme.status.inProgress,
                                      color: 'white'
                                    }}
                                  >
                                    Move ({selectedTaskIds.size})
                                  </button>
                                  <button
                                    onClick={handleRemoveTasks}
                                    className="px-3 py-1 text-xs rounded transition-colors"
                                    style={{
                                      backgroundColor: brandTheme.status.error,
                                      color: 'white'
                                    }}
                                  >
                                    Remove ({selectedTaskIds.size})
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setIsManagingTasks(false);
                                  setSelectedTaskIds(new Set());
                                }}
                                className="px-3 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: brandTheme.gray[400],
                                  color: 'white'
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Task Table Header */}
                      <div 
                        className={`grid ${isManagingTasks ? 'grid-cols-13' : 'grid-cols-12'} gap-4 px-4 py-2 text-xs font-medium border-b`}
                        style={{ 
                          backgroundColor: brandTheme.background.secondary,
                          borderColor: brandTheme.border.medium,
                          color: brandTheme.text.primary 
                        }}
                      >
                        {isManagingTasks && <div className="col-span-1"></div>}
                        <div className="col-span-3">Task Name</div>
                        <div className="col-span-2">Hours Spent</div>
                        <div className="col-span-2">Story Points</div>
                        <div className="col-span-1 -ml-2">Priority</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Assignee</div>
                      </div>

                      {/* Task Rows */}
                      <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
                        {activeTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className={`grid ${isManagingTasks ? 'grid-cols-13' : 'grid-cols-12'} gap-4 py-2 px-4 hover:bg-opacity-50`}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            {/* Checkbox */}
                            {isManagingTasks && (
                              <div className="col-span-1 flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.has(task.id)}
                                  onChange={() => handleToggleTaskSelection(task.id)}
                                  className="w-4 h-4 cursor-pointer"
                                  style={{ accentColor: brandTheme.primary.navy }}
                                />
                              </div>
                            )}
                            
                            {/* Task Name */}
                            <div className="col-span-3">
                              <div 
                                className="font-medium text-xs cursor-pointer hover:underline"
                                style={{ color: brandTheme.primary.navy }}
                                title={task.description || task.name}
                                onClick={() => handleTaskNameClick(task.id)}
                              >
                                {task.name}
                              </div>
                            </div>

                            {/* Hours Spent */}
                            <div className="col-span-2">
                              <span className="text-xs font-medium" style={{ color: brandTheme.text.primary }}>
                                {task.hoursSpent.toFixed(1)}h
                              </span>
                            </div>

                            {/* Story Points */}
                            <div className="col-span-2">
                              <div 
                                className="text-xs font-medium cursor-pointer hover:underline transition-colors"
                                style={{ color: brandTheme.primary.navy }}
                                onClick={() => handleHoursPlannedClick(task.id, task.name)}
                                title="Click to view/edit story points"
                              >
                                {task.hoursPlanned.toFixed(1)}
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
                        className="px-4 py-2 mb-4 flex items-center justify-between"
                        style={{ 
                          backgroundColor: brandTheme.primary.navy,
                          color: brandTheme.background.primary 
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold">Completed Tasks</h3>
                          <span className="text-xs opacity-90">
                            {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Task Table Header */}
                      <div 
                        className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium border-b"
                        style={{ 
                          backgroundColor: brandTheme.background.secondary,
                          borderColor: brandTheme.border.medium,
                          color: brandTheme.text.primary 
                        }}
                      >
                        <div className="col-span-3">Task Name</div>
                        <div className="col-span-2">Hours Spent</div>
                        <div className="col-span-2">Story Points</div>
                        <div className="col-span-1 -ml-2">Priority</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Assignee</div>
                      </div>

                      {/* Task Rows */}
                      <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
                        {completedTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="grid grid-cols-12 gap-4 py-2 px-4 hover:bg-opacity-50 opacity-75"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            {/* Task Name */}
                            <div className="col-span-3">
                              <div 
                                className="font-medium text-xs cursor-pointer hover:underline"
                                style={{ color: brandTheme.primary.navy }}
                                title={task.description || task.name}
                                onClick={() => handleTaskNameClick(task.id)}
                              >
                                {task.name}
                              </div>
                            </div>

                            {/* Hours Spent */}
                            <div className="col-span-2">
                              <span className="text-xs font-medium" style={{ color: brandTheme.text.primary }}>
                                {task.hoursSpent.toFixed(1)}h
                              </span>
                            </div>

                            {/* Story Points */}
                            <div className="col-span-2">
                              <div 
                                className="text-xs font-medium cursor-pointer hover:underline transition-colors"
                                style={{ color: brandTheme.primary.navy }}
                                onClick={() => handleHoursPlannedClick(task.id, task.name)}
                                title="Click to view/edit story points"
                              >
                                {task.hoursPlanned.toFixed(1)}
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
              {isLoading ? (
                <LoadingSpinner />
              ) : sprintTasks.length > 0 && sprintTasks[0].project_id ? (
                <SprintProjectSummary projectId={sprintTasks[0].project_id} />
              ) : (
                <div 
                  className="text-center py-12"
                  style={{ color: brandTheme.text.muted }}
                >
                  <h3 className="text-lg font-semibold mb-2">No Project Found</h3>
                  <p>This sprint has no tasks or associated project.</p>
                </div>
              )}
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

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskDetailsModalOpen}
          onClose={handleCloseTaskDetailsModal}
          taskId={selectedTaskId}
        />
      )}

      {/* Move Tasks Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: brandTheme.text.primary }}>
              Move {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''} to Sprint
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                Select Target Sprint:
              </label>
              <select
                value={targetSprintId}
                onChange={(e) => setTargetSprintId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: brandTheme.border.medium,
                  color: brandTheme.text.primary
                }}
              >
                <option value="">-- Select Sprint --</option>
                {availableSprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} {sprint.sprint_id ? `- Sprint ${sprint.sprint_id}` : `- ${sprint.sprint_type}`}
                    {sprint.start_date && sprint.end_date && (
                      ` (${new Date(sprint.start_date).toLocaleDateString()} - ${new Date(sprint.end_date).toLocaleDateString()})`
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setTargetSprintId('');
                }}
                className="px-4 py-2 border rounded-lg transition-colors"
                style={{
                  backgroundColor: brandTheme.background.primary,
                  borderColor: brandTheme.border.medium,
                  color: brandTheme.text.secondary
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMoveTasks}
                disabled={!targetSprintId}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.primary.navy,
                  color: 'white'
                }}
              >
                Move Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InSprintReviewModal;

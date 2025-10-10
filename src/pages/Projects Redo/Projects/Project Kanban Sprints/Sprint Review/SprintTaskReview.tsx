import React, { useState, useEffect } from 'react';
import { useTaskData } from './useTaskData';
import { useTaskEditing } from './useTaskEditing';
import { useTaskSelection } from './useTaskSelection';
import TaskTable from './TaskTable';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import SectionHeader from './SectionHeader';
import SprintSummary from './SprintSummary';
import HoursPlannedModal from './HoursPlannedModal';
import InSprintGroup from './InSprintGroup';
import { supabase } from '../../../../../lib/supabase';
import { Task } from './types';

interface SprintTaskReviewProps {
  projectId: string;
  onTaskSelectionChange?: (selectedTaskIds: string[]) => void;
  onCreateSprintGroup?: () => void;
  onAddToSprintGroup?: () => void;
  fromSprintGroup?: boolean; // Optional: indicates opened from sprint group
}

const SprintTaskReview: React.FC<SprintTaskReviewProps> = ({ projectId, onTaskSelectionChange, onCreateSprintGroup, onAddToSprintGroup, fromSprintGroup = false }) => {
  const { tasks, isLoading, loadTasks } = useTaskData(projectId);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskName, setSelectedTaskName] = useState<string>('');
  const [sprintTaskIds, setSprintTaskIds] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const {
    editingCell,
    editValue,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleEditValueChange
  } = useTaskEditing(loadTasks);
  const {
    isSelectionMode,
    setIsSelectionMode,
    updateTaskSelection
  } = useTaskSelection();

  // Load sprint task IDs to exclude from selectable tasks
  useEffect(() => {
    loadSprintTaskIds();
  }, [projectId]);

  const loadSprintTaskIds = async () => {
    try {
      const { data: sprintGroups, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('selected_task_ids')
        .eq('project_id', projectId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching sprint task IDs:', error);
        return;
      }

      const allSprintTaskIds = new Set<string>();
      (sprintGroups || []).forEach((group: any) => {
        (group.selected_task_ids || []).forEach((taskId: string) => {
          allSprintTaskIds.add(taskId);
        });
      });

      setSprintTaskIds(allSprintTaskIds);
    } catch (error) {
      console.error('Error loading sprint task IDs:', error);
    }
  };

  // Update local tasks when tasks change, filtering out sprint tasks
  React.useEffect(() => {
    // Filter out tasks that are already in sprint groups
    const availableTasks = tasks.filter(task => !sprintTaskIds.has(task.id));
    setLocalTasks(availableTasks);
  }, [tasks, sprintTaskIds]);

  const handleSelectRowsToggle = () => {
    if (isSelectionMode) {
      // Exiting selection mode - clear selections
      setLocalTasks(prev => prev.map(task => ({ ...task, isSelected: false })));
      setIsSelectionMode(false);
      
      // Notify parent of cleared selections
      if (onTaskSelectionChange) {
        onTaskSelectionChange([]);
      }
    } else {
      // Entering selection mode - select all active tasks
      setLocalTasks(prev => {
        const updatedTasks = prev.map(task => ({
          ...task,
          isSelected: task.status?.toLowerCase() !== 'done'
        }));
        
        // Notify parent of selected task IDs
        if (onTaskSelectionChange) {
          const selectedTaskIds = updatedTasks
            .filter(task => task.isSelected)
            .map(task => task.id);
          onTaskSelectionChange(selectedTaskIds);
        }
        
        return updatedTasks;
      });
      setIsSelectionMode(true);
    }
  };

  const handleTaskSelectionChange = (taskId: string, isSelected: boolean) => {
    setLocalTasks(prev => {
      const updatedTasks = updateTaskSelection(prev, taskId, isSelected);
      
      // Notify parent component of selected task IDs
      if (onTaskSelectionChange) {
        const selectedTaskIds = updatedTasks
          .filter(task => task.isSelected)
          .map(task => task.id);
        onTaskSelectionChange(selectedTaskIds);
      }
      
      return updatedTasks;
    });
  };

  const handleHoursPlannedClick = (taskId: string, taskName: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskName(taskName);
    setHoursModalOpen(true);
  };

  const handleHoursUpdated = () => {
    loadTasks(); // Refresh task data to update story points
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of InSprintGroup
  };

  const activeTasks = localTasks.filter(task => task.status?.toLowerCase() !== 'done');
  const completedTasks = localTasks.filter(task => task.status?.toLowerCase() === 'done');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {/* Sprint Summary - Always show if there are tasks */}
      {localTasks.length > 0 && (
        <SprintSummary 
          tasks={localTasks} 
          isSelectionMode={isSelectionMode}
          selectedTaskCount={localTasks.filter(task => task.isSelected).length}
          onCreateSprintGroup={onCreateSprintGroup}
          onAddToSprintGroup={onAddToSprintGroup}
        />
      )}

      <div className="mb-6">
        <SectionHeader 
          title="Task Review (not in epic)" 
          showSelectRows={true}
          onSelectRowsToggle={handleSelectRowsToggle}
          isSelectionMode={isSelectionMode}
        />
      </div>

      {localTasks.length > 0 ? (
        <div className="space-y-6">
          {/* Active Tasks Section */}
          <TaskTable
            tasks={activeTasks}
            isSelectionMode={isSelectionMode}
            editingCell={editingCell}
            editValue={editValue}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
            onEditValueChange={handleEditValueChange}
            onTaskSelectionChange={handleTaskSelectionChange}
            onHoursPlannedClick={handleHoursPlannedClick}
          />

          {/* Always show InSprintGroup section if there are tasks in sprint groups */}
          <InSprintGroup 
            projectId={projectId} 
            refreshTrigger={refreshTrigger}
            defaultExpanded={fromSprintGroup}
          />

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div>
              <SectionHeader title="Completed Tasks" />
              <TaskTable
                tasks={completedTasks}
                isCompleted={true}
                isSelectionMode={isSelectionMode}
                editingCell={editingCell}
                editValue={editValue}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onEditValueChange={handleEditValueChange}
                onTaskSelectionChange={handleTaskSelectionChange}
                onHoursPlannedClick={handleHoursPlannedClick}
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState projectId={projectId} />
      )}

      {/* Story Points Modal */}
      <HoursPlannedModal
        isOpen={hoursModalOpen}
        onClose={() => setHoursModalOpen(false)}
        taskId={selectedTaskId}
        taskName={selectedTaskName}
        onHoursUpdated={handleHoursUpdated}
      />
    </div>
  );
};

export default SprintTaskReview;

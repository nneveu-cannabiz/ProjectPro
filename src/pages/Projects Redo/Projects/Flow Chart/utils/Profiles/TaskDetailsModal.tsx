import React, { useState } from 'react';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../../../../../context/AppContext';
import { brandTheme } from '../../../../../../styles/brandTheme';
import TaskDetailsHeader from './TaskDetailsHeader';
import TaskDetailsContent from './TaskDetailsContent';
import TaskDetailsModals from './TaskDetailsModals';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  taskId
}) => {
  const { 
    projects,
    tasks, 
    subTasks,
    deleteTask, 
    updateTask,
    updateProject,
    getUpdatesForEntity,
    getRelatedUpdates,
    refreshData
  } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [currentSubTask, setCurrentSubTask] = useState<any>(null);
  
  // Tab management state
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  
  // Description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Completion date confirmation state
  const [isCompletionDateModalOpen, setIsCompletionDateModalOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState('');
  
  // Start date confirmation state
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  
  const task = tasks.find((t) => t.id === taskId);
  
  // Debug: Log task data in the modal
  console.log('TaskDetailsModal - ALL TASKS:', tasks);
  console.log('TaskDetailsModal - LOOKING FOR TASK ID:', taskId);
  console.log('TaskDetailsModal - task found:', task);
  console.log('TaskDetailsModal - task.priority:', task?.priority);
  
  if (!task) {
    return null;
  }
  
  // Get project for this task
  const project = projects.find((p) => p.id === task.projectId);
  
  // Get subtasks for this task
  const taskSubTasks = subTasks.filter((subTask) => subTask.taskId === taskId);
  
  // Get updates for this task
  const directUpdates = getUpdatesForEntity('task', taskId);
  const allRelatedUpdates = getRelatedUpdates('task', taskId);
  
  const handleDeleteTask = () => {
    deleteTask(taskId);
    onClose();
  };
  
  const handleEditSubTask = (subTask: any) => {
    setCurrentSubTask(subTask);
    setIsSubTaskModalOpen(true);
  };
  
  const handleAddSubTask = () => {
    setCurrentSubTask(null);
    setIsSubTaskModalOpen(true);
  };
  
  const handleSubTaskModalClose = () => {
    setIsSubTaskModalOpen(false);
    setCurrentSubTask(null);
  };
  
  const handleOpenUpdatesModal = () => {
    setIsUpdatesModalOpen(true);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const currentTags = task.tags || [];
      const updatedTags = currentTags.filter((tag: string) => tag !== tagToRemove);
      
      await updateTask({
        ...task,
        tags: updatedTags
      });
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  // Description editing handlers
  const handleEditDescription = () => {
    setEditedDescription(task.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      await updateTask({
        ...task,
        description: editedDescription
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  // Open completion date modal
  const handleMarkAsDone = () => {
    // Set default completion date to today
    const today = new Date().toISOString().split('T')[0];
    setCompletionDate(today);
    setIsCompletionDateModalOpen(true);
  };

  // Actually mark task as done with the selected completion date
  const handleConfirmCompletion = async () => {
    if (isUpdatingStatus) return; // Prevent double-clicks
    
    try {
      setIsUpdatingStatus(true);
      console.log('Marking task as done:', task.id, 'Current status:', task.status);
      console.log('Full task object:', task);
      console.log('Completion date:', completionDate);
      
      const updatedTask = {
        ...task,
        status: 'done' as const,
        progress: 100,
        endDate: completionDate, // Use the user-selected completion date
        updatedAt: new Date().toISOString(),
        // Ensure required fields are present
        description: task.description || '',
        tags: task.tags || []
      };
      
      console.log('Updated task object:', updatedTask);
      
      await updateTask(updatedTask);
      
      // Refresh data to ensure UI updates
      await refreshData();
      
      console.log('Task marked as done successfully');
      
      // Close the completion date modal
      setIsCompletionDateModalOpen(false);
    } catch (error) {
      console.error('Error marking task as done:', error);
      console.error('Error details:', error);
      alert('Failed to mark task as done. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open start date modal
  const handleMarkAsInProgress = () => {
    // Set default start date to today or existing start date
    const today = new Date().toISOString().split('T')[0];
    setStartDate(task.startDate || today);
    setIsStartDateModalOpen(true);
  };

  // Actually mark task as in progress with the selected start date
  const handleConfirmStartProgress = async () => {
    if (isUpdatingStatus) return; // Prevent double-clicks
    
    try {
      setIsUpdatingStatus(true);
      console.log('Marking task as in progress:', task.id, 'Current status:', task.status);
      console.log('Full task object:', task);
      console.log('Start date:', startDate);
      
      const updatedTask = {
        ...task,
        status: 'in-progress' as const,
        startDate: startDate, // Use the user-selected start date
        updatedAt: new Date().toISOString(),
        // Ensure required fields are present
        description: task.description || '',
        tags: task.tags || []
      };
      
      console.log('Updated task object:', updatedTask);
      
      await updateTask(updatedTask);
      
      // Refresh data to ensure UI updates
      await refreshData();
      
      console.log('Task marked as in progress successfully');
      
      // Close the start date modal
      setIsStartDateModalOpen(false);
    } catch (error) {
      console.error('Error marking task as in progress:', error);
      console.error('Error details:', error);
      alert('Failed to mark task as in progress. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Dropdown menu items for task actions
  const taskMenuItems = [
    {
      label: 'View Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Task',
      icon: <Edit size={18} />,
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'Delete Task',
      icon: <Trash2 size={18} />,
      onClick: () => setIsDeleteModalOpen(true),
      className: 'text-red-500'
    }
  ];

  return (
    <>
      {/* Main Task Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-7xl"
            style={{ 
              minHeight: '600px',
              borderColor: brandTheme.border.light 
            }}
          >
            {/* Header */}
            <TaskDetailsHeader
              task={task}
              project={project}
              isUpdatingStatus={isUpdatingStatus}
              taskMenuItems={taskMenuItems}
              onClose={onClose}
              onMarkAsDone={handleMarkAsDone}
              onMarkAsInProgress={handleMarkAsInProgress}
              onRemoveTag={handleRemoveTag}
            />
            
            {/* Content */}
            <TaskDetailsContent
              task={task}
              project={project}
              taskSubTasks={taskSubTasks}
              directUpdates={directUpdates}
              activeTab={activeTab}
              isEditingDescription={isEditingDescription}
              editedDescription={editedDescription}
              onSetActiveTab={setActiveTab}
              onEditDescription={handleEditDescription}
              onSaveDescription={handleSaveDescription}
              onCancelDescription={handleCancelDescription}
              onSetEditedDescription={setEditedDescription}
              onAddSubTask={handleAddSubTask}
              onEditSubTask={handleEditSubTask}
              onOpenUpdatesModal={handleOpenUpdatesModal}
              onUpdateTask={updateTask}
              onUpdateProject={updateProject}
            />
          </div>
        </div>
      )}
      
      {/* All Modals */}
      <TaskDetailsModals
        task={task}
        currentSubTask={currentSubTask}
        isEditModalOpen={isEditModalOpen}
        isSubTaskModalOpen={isSubTaskModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        isUpdatesModalOpen={isUpdatesModalOpen}
        directUpdates={directUpdates}
        allRelatedUpdates={allRelatedUpdates}
        onEditModalClose={() => setIsEditModalOpen(false)}
        onSubTaskModalClose={handleSubTaskModalClose}
        onDeleteModalClose={() => setIsDeleteModalOpen(false)}
        onUpdatesModalClose={() => setIsUpdatesModalOpen(false)}
        onDeleteTask={handleDeleteTask}
      />

      {/* Start Date Confirmation Modal */}
      {isStartDateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: brandTheme.status.warning,
                borderColor: brandTheme.border.light,
              }}
            >
              <h2 className="text-xl font-bold text-white">Confirm Start Date</h2>
              <p className="text-sm text-white opacity-90 mt-1">
                Set the start date for this task
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: brandTheme.text.primary }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                    color: brandTheme.text.primary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                  This date will be set as the task's start date
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
                <p className="text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
                  Task: {task.name}
                </p>
                <p className="text-xs" style={{ color: brandTheme.text.secondary }}>
                  This task will be marked as in progress
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex justify-end space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={() => setIsStartDateModalOpen(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.primary,
                  border: `1px solid ${brandTheme.border.medium}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartProgress}
                disabled={isUpdatingStatus || !startDate}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.status.warning,
                  color: 'white',
                }}
              >
                {isUpdatingStatus ? 'Marking as In Progress...' : 'Mark as In Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Date Confirmation Modal */}
      {isCompletionDateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: brandTheme.status.success,
                borderColor: brandTheme.border.light,
              }}
            >
              <h2 className="text-xl font-bold text-white">Confirm Task Completion</h2>
              <p className="text-sm text-white opacity-90 mt-1">
                Set the completion date for this task
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: brandTheme.text.primary }}
                >
                  Completion Date
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                    color: brandTheme.text.primary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                  This date will be set as the task's end date
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
                <p className="text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
                  Task: {task.name}
                </p>
                <p className="text-xs" style={{ color: brandTheme.text.secondary }}>
                  This task will be marked as complete
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex justify-end space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={() => setIsCompletionDateModalOpen(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.primary,
                  border: `1px solid ${brandTheme.border.medium}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                disabled={isUpdatingStatus || !completionDate}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.status.success,
                  color: 'white',
                }}
              >
                {isUpdatingStatus ? 'Marking as Done...' : 'Mark as Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskDetailsModal;
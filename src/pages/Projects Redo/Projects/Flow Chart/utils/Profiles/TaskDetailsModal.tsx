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

  // Mark task as done handler
  const handleMarkAsDone = async () => {
    if (isUpdatingStatus) return; // Prevent double-clicks
    
    try {
      setIsUpdatingStatus(true);
      console.log('Marking task as done:', task.id, 'Current status:', task.status);
      console.log('Full task object:', task);
      
      const updatedTask = {
        ...task,
        status: 'done' as const,
        progress: 100,
        endDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
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
    } catch (error) {
      console.error('Error marking task as done:', error);
      console.error('Error details:', error);
      alert('Failed to mark task as done. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Mark task as in progress handler
  const handleMarkAsInProgress = async () => {
    if (isUpdatingStatus) return; // Prevent double-clicks
    
    try {
      setIsUpdatingStatus(true);
      console.log('Marking task as in progress:', task.id, 'Current status:', task.status);
      console.log('Full task object:', task);
      
      const updatedTask = {
        ...task,
        status: 'in-progress' as const,
        startDate: task.startDate || new Date().toISOString().split('T')[0], // Set start date if not already set
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
    </>
  );
};

export default TaskDetailsModal;
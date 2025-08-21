import React, { useState } from 'react';
import { parseISO } from 'date-fns';
import { PlusCircle, Edit, Trash2, MessageSquare, X, Tag } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { Card, CardContent } from '../../../../../../components/ui/Card';
import Badge from '../../../../../../components/ui/Badge';
import Modal from '../../../../../../components/ui/Modal';
import TaskForm from '../../../../../../components/Task/TaskForm';
import SubTaskForm from '../../../../../../components/SubTask/SubTaskForm';
import SubTaskItem from '../../../../../../components/SubTask/SubTaskItem';
import { useAppContext } from '../../../../../../context/AppContext';
import UpdatesModal from '../../../../../../components/Update/UpdatesModal';
import DropdownMenu from '../../../../../../components/ui/DropdownMenu';
import { brandTheme } from '../../../../../../styles/brandTheme';
import TaskDetailsSection from './TaskDetailsSection';
import ProjectDocumentsSection from './ProjectDocumentsSection';
import TaskUpdates from './TaskUpdates';

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
    getRelatedUpdates
  } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [currentSubTask, setCurrentSubTask] = useState<any>(null);
  
  // Tab management state
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  
  const task = tasks.find((t) => t.id === taskId);
  
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
  
  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const currentTags = task.tags || [];
      const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
      
      await updateTask({
        ...task,
        tags: updatedTags
      });
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

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
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: brandTheme.border.light }}
            >
              <div className="flex-1">
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: brandTheme.text.primary }}
                >
                  {task.name} - Task
                </h1>
                <div className="flex items-center mt-2">
                  <Badge variant="primary" className="mr-2">{task.taskType}</Badge>
                  <Badge variant={getStatusVariant(task.status)} className="mr-2">
                    {getStatusText(task.status)}
                  </Badge>
                  {project && (
                    <Badge variant="secondary" className="mr-2">
                      Project: {project.name}
                    </Badge>
                  )}
                  <span 
                    className="text-sm mr-4"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Created: {parseISO(task.createdAt).toLocaleDateString()}
                  </span>
                  {task.deadline && (
                    <span 
                      className="text-sm font-medium"
                      style={{ color: brandTheme.status.warning }}
                    >
                      Deadline: {parseISO(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {typeof task.progress === 'number' && (
                    <span 
                      className="text-sm font-medium ml-4"
                      style={{ color: brandTheme.status.info }}
                    >
                      Progress: {task.progress}%
                    </span>
                  )}
                </div>
                
                {/* Tags Section */}
                {(task.tags && task.tags.length > 0) && (
                  <div className="flex items-center mt-2 flex-wrap">
                    <Tag size={16} className="mr-2" style={{ color: brandTheme.text.muted }} />
                    {task.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="cursor-pointer hover:opacity-80 mr-2 mb-1"
                        onClick={() => handleRemoveTag(tag)}
                        title="Click to remove tag"
                      >
                        <Badge 
                          variant="secondary" 
                        >
                          {tag} ×
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <DropdownMenu items={taskMenuItems} />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 120px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <p 
                        style={{ color: brandTheme.text.secondary }}
                      >
                        {task.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Subtasks
                    </h2>
                    <Button onClick={handleAddSubTask} size="sm">
                      <PlusCircle size={16} className="mr-1" />
                      Add Subtask
                    </Button>
                  </div>
                  
                  {taskSubTasks.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      {taskSubTasks.map((subTask) => (
                        <SubTaskItem
                          key={subTask.id}
                          subTask={subTask}
                          onEdit={handleEditSubTask}
                          taskId={taskId}
                          projectId={task.projectId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="text-center py-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: brandTheme.background.primary }}
                    >
                      <p style={{ color: brandTheme.text.muted }}>No subtasks created yet.</p>
                      <Button 
                        className="mt-4" 
                        onClick={handleAddSubTask}
                        size="sm"
                      >
                        Add Your First Subtask
                      </Button>
                    </div>
                  )}
                  
                  {/* Updates Section */}
                  <TaskUpdates
                    taskId={taskId}
                    directUpdates={directUpdates}
                    onOpenUpdatesModal={handleOpenUpdatesModal}
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'details'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Task Details
                          </button>
                          <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'documents'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Documents/Resources
                          </button>
                        </div>
                      </div>
                    </div>
                    <CardContent>
                      {activeTab === 'details' ? (
                        <TaskDetailsSection
                          task={task}
                          taskSubTasks={taskSubTasks}
                          onUpdateTask={updateTask}
                        />
                      ) : (
                        <ProjectDocumentsSection
                          project={project}
                          onUpdateProject={updateProject}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
      >
        <TaskForm 
          projectId={task.projectId}
          task={task} 
          onSubmit={() => setIsEditModalOpen(false)} 
        />
      </Modal>
      
      {/* Add/Edit SubTask Modal */}
      <Modal
        isOpen={isSubTaskModalOpen}
        onClose={handleSubTaskModalClose}
        title={currentSubTask ? "Edit Subtask" : "Add New Subtask"}
      >
        <SubTaskForm 
          taskId={taskId} 
          subTask={currentSubTask}
          onSubmit={handleSubTaskModalClose} 
        />
      </Modal>
      
      {/* Delete Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Task"
      >
        <div>
          <p className="mb-6">Are you sure you want to delete this task? This action cannot be undone and will also delete all subtasks associated with this task.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} size="sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTask} size="sm">
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Updates Modal */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="task"
        entityId={taskId}
        entityName={task.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </>
  );
};

export default TaskDetailsModal;

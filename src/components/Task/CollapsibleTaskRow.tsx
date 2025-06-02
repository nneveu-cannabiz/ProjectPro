import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlusCircle, MoreVertical, Circle, CheckCircle, Edit, Trash2, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import DropdownMenu from '../ui/DropdownMenu';
import { Task, SubTask } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UserAvatar from '../UserAvatar';
import Modal from '../ui/Modal';
import TaskForm from '../Task/TaskForm';
import SubTaskForm from '../SubTask/SubTaskForm';
import UpdatesModal from '../Update/UpdatesModal';

interface CollapsibleTaskRowProps {
  task: Task;
  projectId: string;
}

const CollapsibleTaskRow: React.FC<CollapsibleTaskRowProps> = ({ task, projectId }) => {
  const navigate = useNavigate();
  const { subTasks, updateSubTask, getUsers, deleteTask, getUpdatesForEntity, getRelatedUpdates } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  // Get subtasks for this task
  const taskSubTasks = subTasks.filter((subTask) => subTask.taskId === task.id);
  const completedSubTasks = taskSubTasks.filter((subTask) => subTask.status === 'done').length;
  
  // Get users
  const users = getUsers();
  const assignee = task.assigneeId ? users.find(user => user.id === task.assigneeId) : null;
  
  // Get updates for this task
  const directUpdates = getUpdatesForEntity('task', task.id);
  const allRelatedUpdates = getRelatedUpdates('task', task.id);
  
  // Toggle expansion
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Navigate to task details
  const handleViewTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/${task.id}`);
  };
  
  // Open edit task modal
  const handleEditTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };
  
  // Open delete task confirmation modal
  const handleOpenDeleteModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  // Handle task deletion
  const handleDeleteTask = () => {
    deleteTask(task.id);
    setIsDeleteModalOpen(false);
  };
  
  // Open add subtask modal
  const handleAddSubTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddSubTaskModalOpen(true);
  };
  
  // Open updates modal
  const handleOpenUpdatesModal = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  
  // Task type badge variant
  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'danger';
      case 'Feature':
        return 'primary';
      case 'Discovery':
        return 'secondary';
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
  
  // Toggle subtask status
  const toggleSubTaskStatus = (e: React.MouseEvent, subTask: SubTask) => {
    e.stopPropagation();
    updateSubTask({
      ...subTask,
      status: subTask.status === 'todo' ? 'done' : 'todo',
    });
  };
  
  // Navigate to subtask details
  const handleViewSubTask = (e: React.MouseEvent, subTaskId: string) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/${task.id}/subtasks/${subTaskId}`);
  };
  
  // Menu items for task actions
  const menuItems = [
    {
      label: 'View Task Details',
      icon: <ChevronRight size={16} />,
      onClick: handleViewTask
    },
    {
      label: 'See Updates',
      icon: <MessageSquare size={16} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Task',
      icon: <Edit size={16} />,
      onClick: handleEditTask
    },
    {
      label: 'Add Subtask',
      icon: <PlusCircle size={16} />,
      onClick: handleAddSubTask
    },
    {
      label: 'Delete Task',
      icon: <Trash2 size={16} />,
      onClick: handleOpenDeleteModal,
      className: 'text-red-500'
    }
  ];
  
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Task Row */}
      <div 
        className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors pl-6"
        onClick={handleToggleExpand}
      >
        <button className="mr-3 text-gray-500">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="text-md font-medium text-gray-800">{task.name}</div>
          {!isExpanded && task.description && (
            <div className="text-sm text-gray-500 truncate mt-0.5">{task.description}</div>
          )}
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <Badge variant={getTypeVariant(task.taskType)} className="whitespace-nowrap">
            {task.taskType}
          </Badge>
          
          <Badge variant={getStatusVariant(task.status)}>
            {getStatusText(task.status)}
          </Badge>
          
          <span className="text-sm text-gray-500 whitespace-nowrap ml-3">
            {completedSubTasks}/{taskSubTasks.length} subtasks
          </span>
          
          {assignee && (
            <UserAvatar user={assignee} size="sm" />
          )}
          
          {directUpdates.length > 0 && (
            <button 
              onClick={handleOpenUpdatesModal}
              className="text-sm flex items-center text-blue-600 hover:text-blue-800"
            >
              <MessageSquare size={16} className="mr-1" />
              {directUpdates.length}
            </button>
          )}
          
          <DropdownMenu items={menuItems} />
        </div>
      </div>
      
      {/* Expanded Content - Subtasks */}
      {isExpanded && (
        <div className="bg-blue-50 px-6 py-3 border-t border-gray-200 pl-12">
          {/* Task Description */}
          {task.description && (
            <div className="mb-4 pb-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-1">Description:</div>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}
          
          {/* Subtasks Section */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Subtasks</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAddSubTask}
              >
                <PlusCircle size={14} className="mr-1" />
                Add Subtask
              </Button>
            </div>
            
            {taskSubTasks.length > 0 ? (
              <div className="space-y-2">
                {taskSubTasks.map(subTask => {
                  const subTaskAssignee = subTask.assigneeId ? users.find(user => user.id === subTask.assigneeId) : null;
                  
                  return (
                    <div 
                      key={subTask.id} 
                      className="flex items-center justify-between py-2 px-3 hover:bg-white rounded-md border border-gray-200 bg-white cursor-pointer"
                      onClick={(e) => handleViewSubTask(e, subTask.id)}
                    >
                      <div className="flex items-center flex-1">
                        <button 
                          className="mr-3 flex-shrink-0"
                          onClick={(e) => toggleSubTaskStatus(e, subTask)}
                        >
                          {subTask.status === 'done' ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Circle size={16} className="text-gray-400" />
                          )}
                        </button>
                        
                        <div className={`flex-1 text-sm ${subTask.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {subTask.name}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={getTypeVariant(subTask.taskType)} className="text-xs px-1.5 py-0">
                          {subTask.taskType}
                        </Badge>
                        
                        <Badge variant={getStatusVariant(subTask.status)} className="text-xs px-1.5 py-0">
                          {getStatusText(subTask.status)}
                        </Badge>
                        
                        {subTaskAssignee && (
                          <UserAvatar user={subTaskAssignee} size="sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded-md border border-gray-200">
                <p className="text-gray-500 text-sm">No subtasks created for this task yet.</p>
              </div>
            )}
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
          projectId={projectId}
          task={task}
          onSubmit={() => setIsEditModalOpen(false)}
        />
      </Modal>
      
      {/* Add Subtask Modal */}
      <Modal
        isOpen={isAddSubTaskModalOpen}
        onClose={() => setIsAddSubTaskModalOpen(false)}
        title="Add Subtask"
      >
        <SubTaskForm 
          taskId={task.id}
          onSubmit={() => setIsAddSubTaskModalOpen(false)}
        />
      </Modal>
      
      {/* Delete Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Task"
      >
        <div>
          <p className="mb-6">Are you sure you want to delete this task? This action cannot be undone and will also delete all sub-tasks associated with this task.</p>
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
        entityId={task.id}
        entityName={task.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </div>
  );
};

export default CollapsibleTaskRow;
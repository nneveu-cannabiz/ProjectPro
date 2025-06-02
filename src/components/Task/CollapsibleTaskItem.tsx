import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Edit, Trash2, CheckCircle, Circle, MessageSquare, MoreVertical, Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import UserAvatar from '../UserAvatar';
import { Task, SubTask } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UpdatesModal from '../Update/UpdatesModal';
import DropdownMenu from '../ui/DropdownMenu';

interface CollapsibleTaskItemProps {
  task: Task;
  projectId: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const CollapsibleTaskItem: React.FC<CollapsibleTaskItemProps> = ({
  task,
  projectId,
  onEditTask,
  onDeleteTask
}) => {
  const navigate = useNavigate();
  const { 
    subTasks, 
    updateSubTask, 
    deleteSubTask, 
    getUsers, 
    getUpdatesForEntity,
    getRelatedUpdates
  } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  // Get subtasks for this task
  const taskSubTasks = subTasks.filter((subTask) => subTask.taskId === task.id);
  const completedSubTasks = taskSubTasks.filter((subTask) => subTask.status === 'done').length;
  
  // Get updates for this task
  const directUpdates = getUpdatesForEntity('task', task.id);
  const allRelatedUpdates = getRelatedUpdates('task', task.id);
  
  // Task status badge variant
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
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/${task.id}`);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditTask(task);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
  };
  
  const handleUpdatesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatesModalOpen(true);
  };
  
  const handleViewSubtask = (e: React.MouseEvent, subTaskId: string) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/${task.id}/subtasks/${subTaskId}`);
  };
  
  const toggleSubTaskStatus = (e: React.MouseEvent, subTask: SubTask) => {
    e.stopPropagation();
    updateSubTask({
      ...subTask,
      status: subTask.status === 'todo' ? 'done' : 'todo',
    });
  };
  
  const handleDeleteSubTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSubTask(id);
  };
  
  const users = getUsers();
  const assignee = task.assigneeId ? users.find(user => user.id === task.assigneeId) : null;
  
  // Dropdown menu items for task actions
  const taskMenuItems = [
    {
      label: 'View Task',
      icon: <Eye size={18} />,
      onClick: handleViewDetails
    },
    {
      label: 'See Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleUpdatesClick
    },
    {
      label: 'Edit Task',
      icon: <Edit size={18} />,
      onClick: handleEdit
    },
    {
      label: 'Delete Task',
      icon: <Trash2 size={18} />,
      onClick: handleDelete,
      className: 'text-red-500'
    }
  ];
  
  return (
    <>
      <div className="mb-3 border rounded-md overflow-hidden bg-white shadow-sm border-gray-200">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50"
          onClick={toggleOpen}
        >
          <div className="flex items-center">
            <button className="mr-2 flex-shrink-0 focus:outline-none text-gray-500">
              {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <div>
              <h3 className="text-md font-medium text-gray-800">{task.name}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={getTypeVariant(task.taskType)}>
              {task.taskType}
            </Badge>
            <Badge variant={getStatusVariant(task.status)}>
              {getStatusText(task.status)}
            </Badge>
            <div className="text-sm text-gray-500">
              {completedSubTasks}/{taskSubTasks.length} subtasks
            </div>
            
            {assignee && (
              <div className="mr-2">
                <UserAvatar user={assignee} size="sm" />
              </div>
            )}
            
            {directUpdates.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto text-gray-500"
                onClick={handleUpdatesClick}
                title="View Updates"
              >
                <MessageSquare size={16} />
                <span className="ml-1 text-xs">{directUpdates.length}</span>
              </Button>
            )}
            
            <DropdownMenu items={taskMenuItems} />
          </div>
        </div>
        
        {isOpen && (
          <div className="border-t border-gray-100 px-4 py-3 bg-blue-50">
            {/* Description shown at the top when expanded */}
            {task.description && (
              <div className="mb-4 pb-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{task.description}</p>
              </div>
            )}
            
            {/* Subtasks section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks:</h4>
              {taskSubTasks.length > 0 ? (
                <div className="space-y-2 py-1">
                  {taskSubTasks.map((subTask) => {
                    const subTaskAssignee = subTask.assigneeId ? users.find(user => user.id === subTask.assigneeId) : null;
                    const subTaskUpdates = getUpdatesForEntity('subtask', subTask.id);
                    
                    // Dropdown menu items for subtask actions
                    const subtaskMenuItems = [
                      {
                        label: 'View Subtask',
                        icon: <Eye size={18} />,
                        onClick: (e: React.MouseEvent) => handleViewSubtask(e, subTask.id)
                      },
                      {
                        label: 'See Updates',
                        icon: <MessageSquare size={18} />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`/projects/${projectId}/tasks/${task.id}/subtasks/${subTask.id}`);
                        }
                      },
                      {
                        label: 'Delete Subtask',
                        icon: <Trash2 size={18} />,
                        onClick: (e: React.MouseEvent) => handleDeleteSubTask(e, subTask.id),
                        className: 'text-red-500'
                      }
                    ];
                    
                    return (
                      <div 
                        key={subTask.id} 
                        className="flex items-center justify-between py-2 px-3 hover:bg-white rounded-md border border-gray-100 bg-white"
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
                          
                          <div 
                            className={`flex-1 font-medium text-sm ${subTask.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800'}`}
                            onClick={(e) => handleViewSubtask(e, subTask.id)}
                          >
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
                            <div>
                              <UserAvatar user={subTaskAssignee} size="sm" />
                            </div>
                          )}
                          
                          {subTaskUpdates.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0.5 h-auto text-gray-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${projectId}/tasks/${task.id}/subtasks/${subTask.id}`);
                              }}
                            >
                              <MessageSquare size={14} />
                              <span className="ml-1 text-xs">{subTaskUpdates.length}</span>
                            </Button>
                          )}
                          
                          <DropdownMenu items={subtaskMenuItems} buttonClassName="p-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No subtasks for this task.</p>
              )}
            </div>
            
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleViewDetails}
                className="w-full justify-center"
              >
                Manage Subtasks
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="task"
        entityId={task.id}
        entityName={task.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </>
  );
};

export default CollapsibleTaskItem;
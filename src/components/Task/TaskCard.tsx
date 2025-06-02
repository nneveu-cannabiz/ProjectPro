import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UpdatesModal from '../Update/UpdatesModal';

interface TaskCardProps {
  task: Task;
  projectId: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, projectId }) => {
  const navigate = useNavigate();
  const { subTasks, projects, getUpdatesForEntity, getRelatedUpdates } = useAppContext();
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  // Get subtasks for this task
  const taskSubTasks = subTasks.filter((subTask) => subTask.taskId === task.id);
  const completedSubTasks = taskSubTasks.filter((subTask) => subTask.status === 'done').length;
  const totalSubTasks = taskSubTasks.length;
  
  // Get project for this task
  const project = projects.find(p => p.id === projectId);
  
  // Get updates for this task
  const directUpdates = getUpdatesForEntity('task', task.id);
  const allRelatedUpdates = getRelatedUpdates('task', task.id);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
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
  
  const handleClick = () => {
    navigate(`/projects/${projectId}/tasks/${task.id}`);
  };
  
  const handleUpdatesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatesModalOpen(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
        onClick={handleClick}
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{task.name}</h3>
            </div>
            <div className="flex space-x-2">
              <Badge variant={getTypeVariant(task.taskType)}>
                {task.taskType}
              </Badge>
              <Badge variant={getStatusVariant(task.status)}>
                {getStatusText(task.status)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(task.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-3">
              {totalSubTasks > 0 && (
                <div className="flex items-center text-gray-500">
                  <CheckCircle2 size={16} className="mr-1" />
                  <span>{completedSubTasks}/{totalSubTasks}</span>
                </div>
              )}
              {directUpdates.length > 0 && (
                <button 
                  className="flex items-center text-gray-600 hover:text-gray-800"
                  onClick={handleUpdatesClick}
                >
                  <MessageSquare size={16} className="mr-1" />
                  <span>{directUpdates.length}</span>
                </button>
              )}
            </div>
          </div>
        </div>
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

export default TaskCard;
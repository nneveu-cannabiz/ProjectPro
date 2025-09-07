import React from 'react';
import { parseISO } from 'date-fns';
import { X, Tag } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import Badge from '../../../../../../components/ui/Badge';
import DropdownMenu from '../../../../../../components/ui/DropdownMenu';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface TaskDetailsHeaderProps {
  task: any;
  project?: any;
  isUpdatingStatus: boolean;
  taskMenuItems: any[];
  onClose: () => void;
  onMarkAsDone: () => void;
  onMarkAsInProgress: () => void;
  onRemoveTag: (tag: string) => void;
}

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

const TaskDetailsHeader: React.FC<TaskDetailsHeaderProps> = ({
  task,
  project,
  isUpdatingStatus,
  taskMenuItems,
  onClose,
  onMarkAsDone,
  onMarkAsInProgress,
  onRemoveTag
}) => {
  return (
    <div 
      className="p-6 border-b"
      style={{ 
        borderColor: brandTheme.border.light,
        backgroundColor: brandTheme.primary.navy
      }}
    >
      {/* Main Header Row */}
      <div className="flex items-center">
        {/* Task Info - Left Side */}
        <div className="flex-1">
          <h1 
            className="text-2xl font-bold"
            style={{ color: brandTheme.background.primary }}
          >
            {task.name} - Task
          </h1>
          <div className="flex items-center mt-2">
            <Badge variant="primary" className="mr-2">{task.taskType}</Badge>
            {project && (
              <Badge variant="secondary" className="mr-2">
                Project: {project.name}
              </Badge>
            )}
            <span 
              className="text-sm mr-4"
              style={{ color: brandTheme.background.primary }}
            >
              Created: {parseISO(task.createdAt).toLocaleDateString()}
            </span>
            {task.deadline && (
              <span 
                className="text-sm font-medium"
                style={{ color: brandTheme.background.primary }}
              >
                Deadline: {parseISO(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Status and Progress - Center */}
        <div className="text-center mx-40">
          <div className="flex items-center justify-center">
            <div className="text-right">
              <div 
                className="text-lg font-semibold"
                style={{ color: brandTheme.background.primary }}
              >
                Status:
              </div>
              {typeof task.progress === 'number' && (
                <div 
                  className="text-lg font-semibold"
                  style={{ color: brandTheme.background.primary }}
                >
                  Progress:
                </div>
              )}
            </div>
            <div className="mx-3 flex flex-col items-center">
              <span className="text-gray-300 text-lg">|</span>
              {typeof task.progress === 'number' && (
                <span className="text-gray-300 text-lg">|</span>
              )}
            </div>
            <div className="text-left">
              <div 
                className="text-lg font-semibold"
                style={{ color: brandTheme.background.primary }}
              >
                {getStatusText(task.status)}
              </div>
              {typeof task.progress === 'number' && (
                <div 
                  className="text-lg font-semibold"
                  style={{ color: brandTheme.background.primary }}
                >
                  {task.progress}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Right Side */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col space-y-2">
            {task.status !== 'done' && (
              <Button
                onClick={onMarkAsDone}
                variant="primary"
                size="sm"
                className="flex items-center bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                style={{ minWidth: '120px' }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Mark as Done'}
              </Button>
            )}
            {task.status === 'todo' && (
              <Button
                onClick={onMarkAsInProgress}
                variant="primary"
                size="sm"
                className="flex items-center hover:opacity-90"
                style={{ 
                  minWidth: '120px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E'
                }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Mark as In Progress'}
              </Button>
            )}
          </div>
          <DropdownMenu items={taskMenuItems} />
          <button
            onClick={onClose}
            className="p-2 rounded-lg border hover:bg-blue-800 transition-colors"
            style={{
              borderColor: brandTheme.background.primary,
              color: brandTheme.background.primary
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Tags Section - Second Row */}
      {(task.tags && task.tags.length > 0) && (
        <div className="flex items-center mt-3 flex-wrap">
          <Tag size={16} className="mr-2" style={{ color: brandTheme.background.primary }} />
          {task.tags.map((tag: string, index: number) => (
            <div
              key={index}
              className="cursor-pointer hover:opacity-80 mr-2 mb-1"
              onClick={() => onRemoveTag(tag)}
              title="Click to remove tag"
            >
              <Badge variant="secondary">
                {tag} ×
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskDetailsHeader;

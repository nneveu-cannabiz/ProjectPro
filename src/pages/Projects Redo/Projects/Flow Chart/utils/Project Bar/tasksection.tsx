import React from 'react';
import { format } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';

export interface TaskSectionProps {
  tasks: Task[];
}

const TaskSection: React.FC<TaskSectionProps> = ({ 
  tasks
}) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return brandTheme.status.warning;
      case 'in-progress':
        return brandTheme.status.info;
      case 'done':
        return brandTheme.status.success;
      default:
        return brandTheme.text.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return '○';
      case 'in-progress':
        return '◐';
      case 'done':
        return '●';
      default:
        return '○';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress === 0) return brandTheme.gray[500];
    if (progress <= 25) return '#DC2626';
    if (progress <= 50) return '#D97706';
    if (progress <= 75) return '#CA8A04';
    if (progress <= 99) return '#65A30D';
    return brandTheme.status.success;
  };

  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return '';
    }
  };

  return (
    <div 
      className="mt-1 rounded-md p-2 inline-block"
      style={{ 
        minWidth: '120px', // Minimum width
        maxWidth: '200px', // Maximum width to prevent overflow
        backgroundColor: brandTheme.primary.paleBlue,
        border: `1px solid ${brandTheme.primary.lightBlue}`
      }}
    >
      <div className="space-y-1">
        {tasks.slice(0, 5).map((task) => ( // Limit to 5 tasks for space
          <div
            key={task.id}
            className="w-full mb-1"
            style={{ 
              color: brandTheme.text.secondary,
              lineHeight: '1.2'
            }}
          >
            {/* Task name and status */}
            <div className="flex items-center text-xs w-full mb-1">
              <span 
                className="mr-1 flex-shrink-0"
                style={{ 
                  color: getStatusColor(task.status),
                  fontSize: '11px'
                }}
              >
                {getStatusIcon(task.status)}
              </span>
              <span 
                className="truncate"
                style={{ 
                  fontSize: '12px',
                  flex: 1
                }}
                title={task.name}
              >
                {task.name}
              </span>
              {/* Progress percentage */}
              {typeof task.progress === 'number' && (
                <span 
                  className="ml-1 px-1 rounded text-xs flex-shrink-0"
                  style={{ 
                    backgroundColor: getProgressColor(task.progress),
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}
                >
                  {task.progress}%
                </span>
              )}
            </div>
            
            {/* Additional info row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {/* Deadline */}
                {task.deadline && (
                  <span 
                    style={{ 
                      color: brandTheme.status.error,
                      fontSize: '9px'
                    }}
                  >
                    ⚠ {formatShortDate(task.deadline)}
                  </span>
                )}
                {/* End date */}
                {task.endDate && (
                  <span 
                    style={{ 
                      color: brandTheme.text.muted,
                      fontSize: '9px'
                    }}
                  >
                    → {formatShortDate(task.endDate)}
                  </span>
                )}
              </div>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center">
                  <span 
                    className="px-1 rounded"
                    style={{ 
                      backgroundColor: brandTheme.primary.lightBlue,
                      color: brandTheme.primary.navy,
                      fontSize: '8px'
                    }}
                  >
                    {task.tags[0]}
                    {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {tasks.length > 5 && (
          <div 
            className="text-xs italic"
            style={{ 
              color: brandTheme.text.muted,
              fontSize: '11px' // Increased from 9px to 11px
            }}
          >
            +{tasks.length - 5} more tasks
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSection;

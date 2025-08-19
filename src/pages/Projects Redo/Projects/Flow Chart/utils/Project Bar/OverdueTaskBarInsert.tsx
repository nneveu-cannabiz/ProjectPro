import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Task } from '../../../../../../types';
import { calculatePositionFromToday } from '../columnUtils';

interface OverdueTaskBarInsertProps {
  overdueTasks: Task[];
  projectStart: Date;
  projectEnd: Date;
  projectWeekStart: Date;
  projectWeekEnd: Date;
  onTaskClick?: (taskId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
}



// Use shared column positioning utility
const calculateOverdueContainerPosition = (
  projectWeekStart: Date
): { leftPercent: number; widthPercent: number } => {
  const result = calculatePositionFromToday(projectWeekStart, 2);
  
  // If today is not in current week, don't show
  if (result.widthPercent <= 0) {
    return { leftPercent: 0, widthPercent: 0 };
  }
  
  // Force minimum positioning - if we get here, today IS in the week, so show it
  return {
    leftPercent: Math.max(0, result.leftPercent),
    widthPercent: Math.max(30, result.widthPercent) // Force at least 30% width
  };
};

const OverdueTaskBarInsert: React.FC<OverdueTaskBarInsertProps> = ({
  overdueTasks,
  projectWeekStart,
  onTaskClick,
  onTaskUpdatesClick
}) => {
  // Don't render if no overdue tasks
  if (!overdueTasks || overdueTasks.length === 0) {
    return null;
  }
  
  // Calculate container position
  const { leftPercent, widthPercent } = calculateOverdueContainerPosition(projectWeekStart);
  
  // If width is 0, don't render (today not in current week)
  if (widthPercent <= 0) {
    return null;
  }
  
  // Calculate container height based on number of overdue tasks
  const taskBarHeight = 32;
  const taskBarMargin = 3;
  const headerHeight = 28;
  const containerPadding = 8;
  const totalHeight = headerHeight + (overdueTasks.length * (taskBarHeight + taskBarMargin)) + containerPadding;
  
  return (
    <div
      className="absolute"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: `${totalHeight}px`,
        bottom: '32px', // Position just above the project start date section with more spacing
        backgroundColor: 'rgba(219, 234, 254, 0.95)', // Light blue background to match task bars
        border: `2px solid #3B82F6`, // Blue border to match task bars
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', // Blue shadow
        zIndex: 30, // Higher than task bars
        overflow: 'visible'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center px-3 py-1 border-b"
        style={{ 
          borderBottomColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue header background
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          height: `${headerHeight}px`
        }}
      >
        <AlertTriangle 
          size={16} 
          className="mr-2"
          style={{ color: '#DC2626' }}
        />
        <span 
          className="text-sm font-bold"
          style={{ color: '#DC2626' }}
        >
          {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Overdue Tasks List */}
      <div 
        className="relative"
        style={{ 
          padding: '6px',
          height: `${totalHeight - headerHeight}px`
        }}
      >
        {overdueTasks.map((task, index) => {
          return (
            <div
              key={task.id}
              className={`absolute flex items-center px-2 py-1 rounded ${onTaskClick ? 'cursor-pointer hover:bg-blue-100' : ''}`}
              onClick={onTaskClick ? (e) => {
                e.stopPropagation();
                onTaskClick(task.id);
              } : undefined}
              style={{
                top: `${index * (taskBarHeight + taskBarMargin)}px`,
                left: '0',
                right: '0',
                height: `${taskBarHeight}px`,
                backgroundColor: 'rgba(219, 234, 254, 0.8)', // Light blue background to match task bars
                border: '1px solid #3B82F6', // Blue border to match task bars
                borderRadius: '4px'
              }}
            >
              {/* Task Status */}
              <span 
                className="flex-shrink-0 mr-2"
                style={{ 
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {task.status === 'todo' ? '○' : task.status === 'in-progress' ? '◐' : '●'}
              </span>
              
              {/* Task Name */}
              <span 
                className="flex-1 truncate font-medium mr-2"
                style={{ 
                  color: '#DC2626',
                  fontSize: '12px'
                }}
              >
                {task.name}
              </span>
              
              {/* Overdue Days */}
              <span 
                className="flex-shrink-0 mr-2 font-bold"
                style={{ 
                  color: '#DC2626',
                  fontSize: '11px'
                }}
              >
                {(() => {
                  if (task.endDate) {
                    const today = new Date();
                    const endDate = new Date(task.endDate);
                    const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000));
                    return `${daysOverdue}d`;
                  }
                  return '';
                })()}
              </span>
              
              {/* Progress */}
              <span 
                className="flex-shrink-0 mr-1 font-bold"
                style={{ 
                  color: '#DC2626',
                  fontSize: '11px'
                }}
              >
                {task.progress || 0}%
              </span>
              
              {/* Updates Icon */}
              {onTaskUpdatesClick && (
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskUpdatesClick(task.id);
                    }}
                    className="p-1 rounded hover:bg-blue-200"
                    style={{ color: '#DC2626' }}
                  >
                    <span style={{ fontSize: '10px' }}>💬</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverdueTaskBarInsert;

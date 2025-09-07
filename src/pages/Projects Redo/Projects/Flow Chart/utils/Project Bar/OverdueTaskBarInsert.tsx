import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Task } from '../../../../../../types';
import { calculatePositionFromToday, findTodayColumnIndex } from '../columnUtils';

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
  // Find today's column index using the existing utility
  const todayIndex = findTodayColumnIndex(projectWeekStart);
  
  // If today is not in current week, don't show
  if (todayIndex === -1) {
    return { leftPercent: 0, widthPercent: 0 };
  }
  
  // Calculate today's position in the timeline using the column positioning utility
  const result = calculatePositionFromToday(projectWeekStart, 2);
  
  // Special handling for when today is the first column (index 0)
  // The issue is that the overdue container tries to overhang left, but can't when at index 0
  if (todayIndex === 0) {

    // Instead of trying to overhang left, position it at the start of today's column
    // and extend it to the right for visibility
    return { 
      leftPercent: 0, // Start exactly at today's column (no negative overhang)
      widthPercent: 45 // Extend rightward for good visibility
    };
  }
  
  // For other positions, allow the normal overhang behavior
  // But ensure we don't go negative on the left
  if (result.widthPercent <= 0) {
    return { leftPercent: 0, widthPercent: 40 };
  }
  
  // Force minimum positioning and prevent negative left positioning
  return {
    leftPercent: Math.max(0, result.leftPercent),
    widthPercent: Math.max(30, result.widthPercent)
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
  
  // Use a fixed, compact height to avoid interfering with project sizing
  const maxDisplayTasks = 2; // Only show first 2 overdue tasks to keep compact
  const taskBarHeight = 20; // Smaller task bars
  const taskBarMargin = 2;
  const headerHeight = 24; // Smaller header
  const containerPadding = 6;
  const displayTaskCount = Math.min(overdueTasks.length, maxDisplayTasks);
  const totalHeight = headerHeight + (displayTaskCount * (taskBarHeight + taskBarMargin)) + containerPadding;
  
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
          className="text-xs font-bold"
          style={{ color: '#DC2626' }}
        >
          {overdueTasks.length} Overdue{overdueTasks.length > maxDisplayTasks ? ` (${maxDisplayTasks} shown)` : ''}
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
        {overdueTasks.slice(0, maxDisplayTasks).map((task, index) => {
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
                className="flex-shrink-0 mr-1"
                style={{ 
                  color: '#DC2626',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                {task.status === 'todo' ? '○' : task.status === 'in-progress' ? '◐' : '●'}
              </span>
              
              {/* Task Name */}
              <span 
                className="flex-1 truncate font-medium mr-1"
                style={{ 
                  color: '#DC2626',
                  fontSize: '10px'
                }}
              >
                {task.name}
              </span>
              
              {/* Overdue Days */}
              <span 
                className="flex-shrink-0 mr-1 font-bold"
                style={{ 
                  color: '#DC2626',
                  fontSize: '9px'
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
                  fontSize: '9px'
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

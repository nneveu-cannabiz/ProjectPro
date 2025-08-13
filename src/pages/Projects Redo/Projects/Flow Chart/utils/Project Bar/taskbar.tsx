import React from 'react';
import { format } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';

export interface TaskBarProps {
  task: Task;
  projectStart: Date;
  projectEnd: Date;
  projectWeekStart: Date;
  projectWeekEnd: Date;
  stackLevel: number;
  onTaskClick?: (taskId: string) => void;
  isClickable?: boolean;
}

const diffDays = (startDate: Date, endDate: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.floor((end - start) / msPerDay);
};

const formatShortDate = (date: Date): string => {
  return format(date, 'MMM dd');
};





const getProgressColor = (progress: number): string => {
  if (progress === 0) return brandTheme.gray[500];
  if (progress <= 25) return '#DC2626';
  if (progress <= 50) return '#D97706';
  if (progress <= 75) return '#CA8A04';
  if (progress <= 99) return '#65A30D';
  return brandTheme.status.success;
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

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  projectStart,
  projectEnd,
  projectWeekStart,
  projectWeekEnd,
  stackLevel,
  onTaskClick,
  isClickable = true
}) => {
  // Calculate task dates - use project dates if task dates are not available
  const taskStartDate = task.startDate ? new Date(task.startDate) : projectStart;
  const taskEndDate = task.endDate ? new Date(task.endDate) : projectEnd;
  const taskDeadline = task.deadline ? new Date(task.deadline) : undefined;

  // Check if task overlaps with current week view
  if (taskEndDate < projectWeekStart || taskStartDate > projectWeekEnd) {
    return null;
  }

  // Calculate the visible project boundaries within the current week
  const visibleProjectStart = projectStart < projectWeekStart ? projectWeekStart : projectStart;
  const visibleProjectEnd = projectEnd > projectWeekEnd ? projectWeekEnd : projectEnd;
  
  // Calculate task boundaries constrained to the visible project area
  const constrainedTaskStart = taskStartDate < visibleProjectStart ? visibleProjectStart : taskStartDate;
  const constrainedTaskEnd = taskEndDate > visibleProjectEnd ? visibleProjectEnd : taskEndDate;
  
  // Calculate positioning based on the visible project timeline
  const totalVisibleDays = Math.max(1, diffDays(visibleProjectStart, visibleProjectEnd));
  const taskStartOffset = Math.max(0, diffDays(visibleProjectStart, constrainedTaskStart));
  const taskEndOffset = Math.min(totalVisibleDays, diffDays(visibleProjectStart, constrainedTaskEnd));
  
  // Calculate positioning as percentage of visible project width
  const leftPercent = (taskStartOffset / totalVisibleDays) * 100;
  const rightPercent = ((taskEndOffset + 1) / totalVisibleDays) * 100;
  const widthPercent = Math.max(5, rightPercent - leftPercent); // Minimum 5% width for visibility
  
  // Ensure the task bar stays within 0-100% bounds
  const clampedLeftPercent = Math.max(0, Math.min(95, leftPercent));
  const clampedWidthPercent = Math.min(100 - clampedLeftPercent, widthPercent);

  // Task bar height
  const taskBarHeight = 24; // Compact height for tasks
  const taskBarMargin = 2; // Small margin between task bars

  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-90' : ''}`}
      onClick={isClickable && onTaskClick ? (e) => {
        e.stopPropagation();
        onTaskClick(task.id);
      } : undefined}
      style={{
        top: `${stackLevel * (taskBarHeight + taskBarMargin)}px`,
        left: `${clampedLeftPercent}%`,
        width: `${clampedWidthPercent}%`,
        height: `${taskBarHeight}px`,
        backgroundColor: brandTheme.primary.paleBlue, // Light blue background
        border: `1px solid ${brandTheme.primary.lightBlue}`, // Medium blue border
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '6px',
        paddingRight: '6px',
        overflow: 'hidden',
        zIndex: 25, // Higher than project bar
        transition: 'opacity 0.2s ease',
      }}
      title={`${task.name}
Status: ${task.status.toUpperCase()}${task.progress ? `
Progress: ${task.progress}%` : ''}
Start: ${formatShortDate(taskStartDate)}
End: ${formatShortDate(taskEndDate)}${taskDeadline ? `
Deadline: ${formatShortDate(taskDeadline)}` : ''}${
        taskStartDate < visibleProjectStart || taskEndDate > visibleProjectEnd 
          ? '\n(Task extends beyond visible project timeline)' 
          : ''
      }`}
    >
      {/* Task content - All info in one line */}
      <div className="flex items-center w-full min-w-0 space-x-1">
        {/* Left arrow if task starts before visible area */}
        {taskStartDate < visibleProjectStart && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '8px'
            }}
          >
            ←
          </span>
        )}

        {/* Status icon */}
        <span 
          className="flex-shrink-0"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          {getStatusIcon(task.status)}
        </span>

        {/* Task name */}
        <span 
          className="truncate font-medium min-w-0"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '10px'
          }}
        >
          {task.name}
        </span>

        {/* Status */}
        <span 
          className="flex-shrink-0 px-1 rounded"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '8px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            fontWeight: '500'
          }}
        >
          {task.status.toUpperCase()}
        </span>

        {/* Progress */}
        {typeof task.progress === 'number' && (
          <span 
            className="flex-shrink-0 px-1 rounded font-bold"
            style={{ 
              backgroundColor: getProgressColor(task.progress),
              color: 'white',
              fontSize: '8px',
              minWidth: '18px',
              textAlign: 'center'
            }}
          >
            {task.progress}%
          </span>
        )}

        {/* Start Date */}
        <span 
          className="flex-shrink-0"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '8px'
          }}
        >
          {formatShortDate(taskStartDate)}
        </span>

        {/* Separator */}
        <span 
          className="flex-shrink-0"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '8px'
          }}
        >
          →
        </span>

        {/* End Date */}
        <span 
          className="flex-shrink-0"
          style={{ 
            color: brandTheme.primary.navy,
            fontSize: '8px'
          }}
        >
          {formatShortDate(taskEndDate)}
        </span>

        {/* Deadline (if different from end date) */}
        {taskDeadline && taskDeadline.getTime() !== taskEndDate.getTime() && (
          <>
            <span 
              className="flex-shrink-0"
              style={{ 
                color: brandTheme.status.error,
                fontSize: '8px'
              }}
            >
              ⚠
            </span>
            <span 
              className="flex-shrink-0"
              style={{ 
                color: brandTheme.status.error,
                fontSize: '8px',
                fontWeight: 'bold'
              }}
            >
              {formatShortDate(taskDeadline)}
            </span>
          </>
        )}

        {/* Right arrow if task ends after visible area */}
        {taskEndDate > visibleProjectEnd && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '8px'
            }}
          >
            →
          </span>
        )}
      </div>

      {/* Hover tooltip would show more details */}
    </div>
  );
};

export default TaskBar;

import React from 'react';
import { format } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { calculateColumnPosition } from '../columnUtils';
import TaskUpdateIcon from './taskupdateicon';

export interface StandaloneTaskBarProps {
  taskId: string;
  taskName: string;
  taskType: string;
  status: 'todo' | 'in-progress' | 'done';
  weekStart: Date;
  weekEnd: Date;
  taskStart: Date;
  taskEnd: Date;
  taskDeadline?: Date;
  taskProgress?: number;
  today: Date;
  barHeightPx: number;
  stackLevel: number;
  topPosition?: number;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (taskId: string) => void;
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
  isClickable?: boolean;
  onClick?: () => void;
}

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

const getStatusColor = (status: 'todo' | 'in-progress' | 'done'): string => {
  switch (status) {
    case 'todo':
      return brandTheme.gray[500];
    case 'in-progress':
      return brandTheme.status.warning;
    case 'done':
      return brandTheme.status.success;
    default:
      return brandTheme.gray[500];
  }
};

const getTaskTypeColor = (taskType: string): string => {
  switch (taskType.toLowerCase()) {
    case 'bug':
      return '#DC2626';
    case 'feature':
      return brandTheme.primary.navy;
    case 'discovery':
      return '#7C3AED';
    case 'enhancement':
      return '#059669';
    default:
      return brandTheme.gray[600];
  }
};

const StandaloneTaskBar: React.FC<StandaloneTaskBarProps> = ({
  taskId,
  taskName,
  taskType,
  status,
  weekStart,
  weekEnd,
  taskStart,
  taskEnd,
  taskDeadline,
  taskProgress = 0,
  today,
  barHeightPx,
  stackLevel,
  topPosition,
  onTaskClick,
  onUpdatesClick,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0,
  isClickable = false,
  onClick
}) => {
  // Check if task has no end date (start === end)
  const hasNoEndDate = taskStart.getTime() === taskEnd.getTime();
  
  // For tasks with no end date, extend them to the end of the current week for visual display
  const effectiveEndDate = hasNoEndDate ? weekEnd : taskEnd;
  
  // Use shared column positioning utility
  const { leftPercent, widthPercent } = calculateColumnPosition(
    taskStart,
    effectiveEndDate,
    weekStart
  );

  // Check if task is visible in the current week
  // For tasks with no real end date (start === end), show them if they start before or during the week
  const isVisible = hasNoEndDate 
    ? taskStart <= weekEnd 
    : taskEnd >= weekStart && taskStart <= weekEnd;
  
  if (!isVisible) {
    return null;
  }

  

  const handleTaskNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  const handleBarClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  // Calculate if task is overdue
  const isOverdue = taskDeadline && taskDeadline < today && status !== 'done';
  
  // Determine bar color based on status and type
  const barColor = getStatusColor(status);
  const typeColor = getTaskTypeColor(taskType);

  return (
    <div
      className={`absolute rounded-md shadow-sm border ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: topPosition ? `${topPosition}px` : `${8 + stackLevel * (barHeightPx + 4)}px`,
        height: `${barHeightPx}px`,
        backgroundColor: barColor,
        borderColor: isOverdue ? '#DC2626' : typeColor,
        borderWidth: '2px',
        zIndex: 20 + stackLevel,
        minWidth: '120px'
      }}
      onClick={handleBarClick}
    >
      {/* Progress bar background */}
      <div
        className="absolute inset-0 rounded-md opacity-20"
        style={{
          backgroundColor: getProgressColor(taskProgress),
          width: `${taskProgress}%`,
        }}
      />

      {/* Content container */}
      <div className="relative h-full flex items-center justify-between px-3 text-white text-sm">
        {/* Left side - Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {/* Task type indicator */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: typeColor }}
            />
            
            {/* Task name - clickable */}
            <button
              onClick={handleTaskNameClick}
              className="font-medium text-left hover:underline truncate"
              style={{ color: 'white' }}
              title={taskName}
            >
              {taskName}
            </button>
          </div>
          
          {/* Task details */}
          <div className="text-xs opacity-90 mt-1">
            {taskType} • {status.replace('-', ' ')}
            {taskProgress > 0 && ` • ${taskProgress}%`}
            {hasNoEndDate && ' • Ongoing'}
          </div>
        </div>

        {/* Right side - Updates and dates */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {/* Deadline indicator */}
          {taskDeadline && (
            <div
              className={`text-xs px-2 py-1 rounded ${
                isOverdue ? 'bg-red-600' : 'bg-black bg-opacity-20'
              }`}
              title={`Deadline: ${formatShortDate(taskDeadline)}`}
            >
              {formatShortDate(taskDeadline)}
            </div>
          )}

          {/* Updates icon */}
          {onUpdatesClick && (
            <TaskUpdateIcon
              taskId={taskId}
              unreadCount={unreadUpdatesCount}
              totalCount={totalUpdatesCount}
              onUpdatesClick={onUpdatesClick}
            />
          )}
        </div>
      </div>

      {/* Overdue indicator stripe */}
      {isOverdue && (
        <div
          className="absolute left-0 top-0 w-1 h-full rounded-l-md"
          style={{ backgroundColor: '#DC2626' }}
        />
      )}
    </div>
  );
};

export default StandaloneTaskBar;
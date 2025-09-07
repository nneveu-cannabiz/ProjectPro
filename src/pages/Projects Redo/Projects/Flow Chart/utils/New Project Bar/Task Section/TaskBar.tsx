import React from 'react';
import { brandTheme } from '../../../../../../../styles/brandTheme';
import { Task, User } from '../../../../../../../types';
import { addDays, isWeekend } from 'date-fns';

// Temporary inline constants and functions to avoid import issues
const TASK_BAR_HEIGHT = 32;

const generateWorkDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  let workDaysAdded = 0;
  
  // Generate dates until we have 5 working days, including weekends in between
  while (workDaysAdded < 5) {
    dates.push(new Date(currentDate));
    
    if (!isWeekend(currentDate)) {
      workDaysAdded++;
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

const isWeekendDay = (date: Date): boolean => {
  return isWeekend(date);
};

const calculateColumnPosition = (
  startDate: Date,
  endDate: Date,
  weekStart: Date
): { leftPercent: number; widthPercent: number } => {
  // Generate all dates in the current week view (same as FlowChartContainer)
  const allDates = generateWorkDates(weekStart);
  
  // Find the column indices for start and end
  let startColumnIndex = -1;
  let endColumnIndex = -1;
  
  for (let i = 0; i < allDates.length; i++) {
    const currentDate = allDates[i];
    
    // Normalize dates to start of day for accurate comparison
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Find the start column
    if (startColumnIndex === -1 && normalizedCurrentDate >= normalizedStartDate) {
      startColumnIndex = i;
    }
    
    // Find the end column - include the full day that contains the end date
    if (normalizedCurrentDate.getTime() === normalizedEndDate.getTime()) {
      endColumnIndex = i;
      break;
    } else if (normalizedCurrentDate > normalizedEndDate) {
      // If we've passed the end date, use the previous column
      endColumnIndex = Math.max(0, i - 1);
      break;
    }
  }
  
  // Handle edge cases
  if (startColumnIndex === -1) {
    startColumnIndex = 0;
  }
  if (endColumnIndex === -1) {
    endColumnIndex = allDates.length - 1;
  }
  
  // Ensure end is at least at start
  if (endColumnIndex < startColumnIndex) {
    endColumnIndex = startColumnIndex;
  }
  
  // Calculate layout with exact CSS matching
  const totalColumns = allDates.length;
  const weekendColumns = allDates.filter(date => isWeekendDay(date)).length;
  const weekdayColumns = totalColumns - weekendColumns;
  
  // Weekend column width: 24px - much smaller, just enough for header text
  // Weekday columns share the remaining space equally
  const weekendWidthPx = 24;
  const totalWeekendWidthPx = weekendColumns * weekendWidthPx;
  
  // Use same calculation approach as columnUtils.ts
  const assumedContainerWidth = 1000;
  const totalFlexWidth = assumedContainerWidth - totalWeekendWidthPx;
  const flexColumnWidth = weekdayColumns > 0 ? totalFlexWidth / weekdayColumns : 0;
  
  // Calculate position up to start column
  let leftPx = 0;
  for (let i = 0; i < startColumnIndex; i++) {
    if (isWeekendDay(allDates[i])) {
      leftPx += weekendWidthPx;
    } else {
      leftPx += flexColumnWidth;
    }
  }
  
  // Calculate spanned width from start to end column
  let widthPx = 0;
  for (let i = startColumnIndex; i <= endColumnIndex; i++) {
    if (isWeekendDay(allDates[i])) {
      widthPx += weekendWidthPx;
    } else {
      widthPx += flexColumnWidth;
    }
  }
  
  // Convert to percentages
  const leftPercent = (leftPx / assumedContainerWidth) * 100;
  const widthPercent = (widthPx / assumedContainerWidth) * 100;
  
  return {
    leftPercent: Math.max(0, Math.min(100, leftPercent)),
    widthPercent: Math.max(0.1, Math.min(100, widthPercent))
  };
};

export interface TaskBarProps {
  task: Task;
  projectStart: Date;
  projectEnd: Date;
  weekStart: Date;
  stackLevel: number;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (taskId: string) => void;
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
  isClickable?: boolean;
  users?: User[];
  projectAssigneeId?: string;
}

const getTaskStatusColor = (status: string): { backgroundColor: string; color: string } => {
  switch (status) {
    case 'todo':
      return { backgroundColor: brandTheme.gray[400], color: 'white' };
    case 'in-progress':
      return { backgroundColor: '#FEF3C7', color: '#92400E' }; // Tailwind bg-yellow-100 text-yellow-800
    case 'done':
      return { backgroundColor: brandTheme.status.success, color: 'white' };
    case 'blocked':
      return { backgroundColor: brandTheme.status.error, color: 'white' };
    default:
      return { backgroundColor: brandTheme.gray[400], color: 'white' };
  }
};

// Profile colors for user avatars
const getProfileColor = (userId: string): { backgroundColor: string; textColor: string } => {
  const colors = [
    { backgroundColor: '#3B82F6', textColor: 'white' }, // Blue
    { backgroundColor: '#10B981', textColor: 'white' }, // Green
    { backgroundColor: '#F59E0B', textColor: 'white' }, // Yellow
    { backgroundColor: '#EF4444', textColor: 'white' }, // Red
    { backgroundColor: '#8B5CF6', textColor: 'white' }, // Purple
    { backgroundColor: '#06B6D4', textColor: 'white' }, // Cyan
    { backgroundColor: '#84CC16', textColor: 'white' }, // Lime
    { backgroundColor: '#F97316', textColor: 'white' }, // Orange
    { backgroundColor: '#EC4899', textColor: 'white' }, // Pink
    { backgroundColor: '#6366F1', textColor: 'white' }, // Indigo
  ];
  
  // Generate consistent color based on user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  return colors[colorIndex];
};

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  projectStart,
  projectEnd,
  weekStart,
  stackLevel,
  onTaskClick,
  onUpdatesClick,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0,
  isClickable = false,
  users = [],
  projectAssigneeId
}) => {
  // Calculate task date boundaries
  const taskStartDate = task.startDate ? new Date(task.startDate) : projectStart;
  const taskEndDate = task.endDate ? new Date(task.endDate) : projectEnd;
  
  // Calculate positioning
  const { leftPercent, widthPercent } = calculateColumnPosition(
    taskStartDate,
    taskEndDate,
    weekStart
  );
  
  // Find assignee user
  const assignee = users.find(user => user.id === task.assigneeId);
  const showAssigneeAvatar = task.assigneeId && task.assigneeId !== projectAssigneeId;
  const isAssignedToDifferentUser = task.assigneeId && task.assigneeId !== projectAssigneeId;
  
  // Get profile color for assignee
  const profileColor = assignee ? getProfileColor(assignee.id) : { backgroundColor: brandTheme.primary.lightBlue, textColor: brandTheme.text.primary };
  
  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={isClickable && onTaskClick ? () => onTaskClick(task.id) : undefined}
      style={{
        top: `${stackLevel * (TASK_BAR_HEIGHT + 2)}px`,
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`,
        height: `${TASK_BAR_HEIGHT}px`,
        backgroundColor: isAssignedToDifferentUser ? brandTheme.primary.paleBlue : 'white',
        border: `1px solid ${brandTheme.border.light}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        color: brandTheme.text.primary,
        fontSize: '12px',
        fontWeight: 'medium',
        overflow: 'hidden',
        zIndex: 30,
        transition: 'opacity 0.2s ease'
      }}
      title={`${task.name} - ${(task.status || 'todo').toUpperCase()} - ${task.progress || 0}% Complete`}
    >
      {/* Task content - Name, Status, Progress in one line */}
      <div className="flex-1 flex items-center space-x-2 min-w-0">
        <span className="truncate flex-1" style={{ fontSize: '12px' }}>
          {task.name}
        </span>
        <span 
          className="flex-shrink-0 px-1 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: getTaskStatusColor(task.status || 'todo').backgroundColor,
            color: getTaskStatusColor(task.status || 'todo').color,
            fontSize: '10px'
          }}
        >
          {(task.status || 'todo').toUpperCase()}
        </span>
        <span 
          className="flex-shrink-0 font-semibold"
          style={{
            color: brandTheme.text.secondary,
            fontSize: '10px'
          }}
        >
          {task.progress || 0}%
        </span>
      </div>
      
      {/* Assignee avatar if different from project assignee */}
      {showAssigneeAvatar && assignee && (
        <div
          className="flex-shrink-0 ml-2"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: profileColor.backgroundColor,
            border: `1px solid ${brandTheme.border.light}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: profileColor.textColor
          }}
          title={`Assigned to: ${assignee.firstName} ${assignee.lastName}`}
        >
          {assignee.firstName?.charAt(0)}{assignee.lastName?.charAt(0)}
        </div>
      )}
      
      {/* Updates indicator */}
      {onUpdatesClick && (unreadUpdatesCount > 0 || totalUpdatesCount > 0) && (
        <div
          className="flex-shrink-0 ml-2 cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            onUpdatesClick(task.id);
          }}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: unreadUpdatesCount > 0 ? brandTheme.status.warning : brandTheme.gray[300],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 'bold',
            color: brandTheme.background.primary
          }}
          title={`${unreadUpdatesCount} unread, ${totalUpdatesCount} total updates`}
        >
          {unreadUpdatesCount > 0 ? unreadUpdatesCount : totalUpdatesCount}
        </div>
      )}
    </div>
  );
};

export default TaskBar;


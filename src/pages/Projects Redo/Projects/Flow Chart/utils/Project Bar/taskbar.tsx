import React from 'react';
import { format, parseISO } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';
import { generateWorkDates, isWeekendDay } from '../dateUtils';
import TaskUpdateIcon from './taskupdateicon';

export interface TaskBarProps {
  task: Task;
  projectStart: Date;
  projectEnd: Date;
  projectWeekStart: Date;
  projectWeekEnd: Date;
  stackLevel: number;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (taskId: string) => void;
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
  isClickable?: boolean;
}



// Calculate positioning that accounts for weekend columns having fixed width
const calculatePositionInFlexLayout = (
  taskStart: Date,
  taskEnd: Date,
  weekStart: Date
): { leftPercent: number; widthPercent: number } => {
  // Generate all dates in the current week view
  const allDates = generateWorkDates(weekStart);
  
  // Find the column indices for task start and end
  let startColumnIndex = -1;
  let endColumnIndex = -1;
  
  for (let i = 0; i < allDates.length; i++) {
    const currentDate = allDates[i];
    
    // Find the start column
    if (startColumnIndex === -1 && currentDate >= taskStart) {
      startColumnIndex = i;
    }
    
    // Find the end column - we want to include the full day that contains the end date
    if (currentDate.toDateString() === taskEnd.toDateString()) {
      endColumnIndex = i;
      break;
    } else if (currentDate > taskEnd) {
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
  
  // Ensure we span at least one column
  if (endColumnIndex < startColumnIndex) {
    endColumnIndex = startColumnIndex;
  }
  
  // Calculate position based on actual CSS layout:
  // Weekend columns: w-12 (48px fixed)
  // Working day columns: flex-1 (share remaining space equally)
  
  // Count total flex units and fixed pixels
  let totalFlexUnits = 0;
  let totalFixedWidth = 0;
  let leftFlexUnits = 0;
  let leftFixedWidth = 0;
  let spannedFlexUnits = 0;
  let spannedFixedWidth = 0;
  
  allDates.forEach((date, index) => {
    const isWeekend = isWeekendDay(date);
    
    if (isWeekend) {
      totalFixedWidth += 48; // w-12 = 48px
      if (index < startColumnIndex) {
        leftFixedWidth += 48;
      }
      if (index >= startColumnIndex && index <= endColumnIndex) {
        spannedFixedWidth += 48;
      }
    } else {
      totalFlexUnits += 1; // flex-1 = 1 flex unit
      if (index < startColumnIndex) {
        leftFlexUnits += 1;
      }
      if (index >= startColumnIndex && index <= endColumnIndex) {
        spannedFlexUnits += 1;
      }
    }
  });
  
  // Calculate actual pixel positions
  const assumedContainerWidth = 1000; // Assume 1000px container for calculation
  const remainingWidth = assumedContainerWidth - totalFixedWidth;
  const flexUnitWidth = totalFlexUnits > 0 ? remainingWidth / totalFlexUnits : 0;
  
  const leftPixels = leftFixedWidth + (leftFlexUnits * flexUnitWidth);
  const spannedPixels = spannedFixedWidth + (spannedFlexUnits * flexUnitWidth);
  
  // Convert to percentages
  const leftPercent = (leftPixels / assumedContainerWidth) * 100;
  const widthPercent = (spannedPixels / assumedContainerWidth) * 100;
  
  // Add a small buffer to ensure we reach the end of the end column
  const bufferedWidthPercent = widthPercent + 0.1; // Small buffer
  const finalWidthPercent = Math.min(100 - leftPercent, bufferedWidthPercent);
  
  return { leftPercent, widthPercent: finalWidthPercent };
};

const formatShortDate = (date: Date): string => {
  return format(date, 'MMM dd');
};

const calculateDaysFromToday = (targetDate: Date): number => {
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  return Math.ceil((targetTime - todayTime) / (24 * 60 * 60 * 1000));
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
  onUpdatesClick,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0,
  isClickable = true
}) => {
  // Calculate task dates - use project dates if task dates are not available
  // Ensure we parse ISO dates correctly and normalize to start of day
  const taskStartDate = task.startDate ? 
    new Date(parseISO(task.startDate).getFullYear(), parseISO(task.startDate).getMonth(), parseISO(task.startDate).getDate()) : 
    projectStart;
  const taskEndDate = task.endDate ? 
    new Date(parseISO(task.endDate).getFullYear(), parseISO(task.endDate).getMonth(), parseISO(task.endDate).getDate()) : 
    projectEnd;
  const taskDeadline = task.deadline ? parseISO(task.deadline) : undefined;

  // Check if task overlaps with current week view
  if (taskEndDate < projectWeekStart || taskStartDate > projectWeekEnd) {
    return null;
  }

  // Calculate positioning using the flex layout logic that accounts for weekends
  const { leftPercent, widthPercent } = calculatePositionInFlexLayout(
    taskStartDate,
    taskEndDate,
    projectWeekStart
  );
  
  // Ensure minimum width for visibility and bounds checking
  const finalWidthPercent = Math.max(5, Math.min(100 - leftPercent, widthPercent));
  const clampedLeftPercent = Math.max(0, Math.min(95, leftPercent));

  // Task bar height
  const taskBarHeight = 32; // Increased height for tasks
  const taskBarMargin = 3; // Slightly larger margin between task bars

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
        width: `${finalWidthPercent}%`,
        height: `${taskBarHeight}px`,
        backgroundColor: brandTheme.primary.paleBlue, // Light blue background
        border: `1px solid ${brandTheme.primary.lightBlue}`, // Medium blue border
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
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
        taskStartDate < projectWeekStart || taskEndDate > projectWeekEnd 
          ? '\n(Task extends beyond visible week timeline)' 
          : ''
      }`}
    >
      {/* Task content - All info in one line */}
      <div className="flex items-center w-full min-w-0 space-x-1">
        {/* Left arrow if task starts before visible area */}
        {taskStartDate < projectWeekStart && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '10px'
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
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {getStatusIcon(task.status)}
        </span>

        {/* Task name and updates icon container - left aligned */}
        <div className="flex items-center min-w-0 flex-1">
          <span 
            className="truncate font-semibold"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '15px'
            }}
          >
            {task.name}
          </span>

          {/* Updates Icon - immediately to the right of task name */}
          {onUpdatesClick && (
            <div className="flex-shrink-0 ml-1.5">
              <TaskUpdateIcon
                taskId={task.id}
                unreadCount={unreadUpdatesCount}
                totalCount={totalUpdatesCount}
                onClick={onUpdatesClick}
              />
            </div>
          )}
        </div>

                 {/* Days counter - centered */}
         <div className="flex-shrink-0 mx-4">
           <span 
             className="font-medium"
             style={{ 
               color: brandTheme.primary.navy,
               fontSize: '15px',
               whiteSpace: 'nowrap'
             }}
           >
            {(() => {
              const daysToStart = calculateDaysFromToday(taskStartDate);
              const daysToEnd = calculateDaysFromToday(taskEndDate);
              
              if (daysToStart > 0) {
                return `Starts in: ${daysToStart}d`;
              } else if (daysToEnd >= 0) {
                return `${daysToEnd}d Left`;
              } else {
                return 'Overdue';
              }
            })()}
          </span>
        </div>

        {/* Spacer between days and progress */}
        <div className="flex-shrink-0" style={{ width: '16px' }} />

                {/* Progress bar and percentage - grouped and aligned right */}
        <div className="flex items-center space-x-2 flex-shrink-0">
                     {/* Progress bar */}
          <div 
            className="rounded-full overflow-hidden"
            style={{ 
              width: '48px',
              height: '6px',
              backgroundColor: 'rgba(255,255,255,0.4)'
            }}
          >
           <div
             className="h-full rounded-full transition-all duration-300"
             style={{
               width: `${task.progress || 0}%`,
               backgroundColor: getProgressColor(task.progress || 0)
             }}
           />
         </div>
         
                     {/* Progress percentage */}
          <span 
            className="font-bold"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '15px',
              minWidth: '36px',
              textAlign: 'right'
            }}
          >
            {task.progress || 0}%
          </span>
        </div>

        {/* Right arrow if task ends after visible area */}
        {taskEndDate > projectWeekEnd && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '10px'
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

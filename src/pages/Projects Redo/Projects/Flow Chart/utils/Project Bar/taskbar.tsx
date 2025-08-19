import React from 'react';
import { format, parseISO } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';

import { calculateColumnPosition } from '../columnUtils';
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



// Use shared column positioning utility
const calculatePositionInFlexLayout = calculateColumnPosition;

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
  // Check if project has no end date (same as start date means no real end date was set)
  const projectHasNoEndDate = projectStart.getTime() === projectEnd.getTime();
  
  // Calculate task dates - use project dates if task dates are not available
  // For projects with no end date, default tasks without dates to project start date
  const taskStartDate = task.startDate ? 
    new Date(parseISO(task.startDate).getFullYear(), parseISO(task.startDate).getMonth(), parseISO(task.startDate).getDate()) : 
    projectStart;
  const originalTaskEndDate = task.endDate ? 
    new Date(parseISO(task.endDate).getFullYear(), parseISO(task.endDate).getMonth(), parseISO(task.endDate).getDate()) : 
    (projectHasNoEndDate ? projectStart : projectEnd); // Use project start if project has no end date
  const taskDeadline = task.deadline ? parseISO(task.deadline) : undefined;
  
  // Get current date for overdue calculation
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Check if task is overdue and incomplete
  const isTaskComplete = task.status === 'done';
  const isTaskOverdue = originalTaskEndDate < todayNormalized && !isTaskComplete;
  
  // Keep original end date for positioning - don't extend overdue tasks visually
  const taskEndDate = originalTaskEndDate;
  
  // Check if task has no real dates (both start and end default to project start for ongoing projects)
  const taskHasNoDates = !task.startDate && !task.endDate && projectHasNoEndDate;

  // Check if task overlaps with current week view
  // For ongoing tasks (no specific dates), always show them since they're ongoing
  if (!taskHasNoDates && (taskEndDate < projectWeekStart || taskStartDate > projectWeekEnd)) {
    return null;
  }

  // For ongoing tasks (no dates), span the full width of the project
  let clampedLeftPercent, finalWidthPercent;
  
  if (taskHasNoDates) {
    // Ongoing tasks span the full width of the project bar
    clampedLeftPercent = 0;
    finalWidthPercent = 100;
  } else {
    // Calculate task positioning relative to the full timeline (same as project bars)
    const taskPosition = calculatePositionInFlexLayout(
      taskStartDate,
      taskEndDate,
      projectWeekStart
    );
    
    // Calculate project positioning relative to the full timeline
    const projectPosition = calculatePositionInFlexLayout(
      projectStart,
      projectEnd,
      projectWeekStart
    );
    
    // Convert task position from project-relative to timeline-relative
    const timelineLeftPercent = taskPosition.leftPercent;
    const timelineWidthPercent = taskPosition.widthPercent;
    
    // Convert to project-relative coordinates for rendering within the project bar
    const relativeLeftPercent = ((timelineLeftPercent - projectPosition.leftPercent) / projectPosition.widthPercent) * 100;
    const relativeWidthPercent = (timelineWidthPercent / projectPosition.widthPercent) * 100;
    
    // Ensure minimum width for visibility and bounds checking
    const calculatedWidth = Math.min(100 - relativeLeftPercent, relativeWidthPercent);
    finalWidthPercent = Math.max(15, calculatedWidth);
    clampedLeftPercent = Math.max(0, Math.min(85, relativeLeftPercent));
  }
  
  // Debug logging for task positioning (only for tasks with dates)
  if (!taskHasNoDates && task.name.includes("Left")) {
    console.log(`Task: ${task.name}`, {
      taskStartDate: taskStartDate.toDateString(),
      taskEndDate: taskEndDate.toDateString(),
      finalPosition: { left: clampedLeftPercent, width: finalWidthPercent }
    });
  }

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
        backgroundColor: isTaskOverdue ? '#FEF3C7' : brandTheme.primary.paleBlue, // Yellow background for overdue
        border: `1px solid ${isTaskOverdue ? '#F59E0B' : brandTheme.primary.lightBlue}`, // Orange border for overdue
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
Progress: ${task.progress}%` : ''}${
        taskHasNoDates 
          ? `\nOngoing task (no specific dates set)`
          : `\nStart: ${formatShortDate(taskStartDate)}
End: ${formatShortDate(originalTaskEndDate)}${isTaskOverdue ? ' (OVERDUE)' : ''}`
      }${taskDeadline ? `
Deadline: ${formatShortDate(taskDeadline)}` : ''}${
        !taskHasNoDates && (taskStartDate < projectWeekStart || taskEndDate > projectWeekEnd)
          ? '\n(Task extends beyond visible week timeline)' 
          : ''
      }${isTaskOverdue ? '\n⚠️ This task is overdue and incomplete' : ''}`}
    >
      {/* Task content - All info in one line */}
      <div className="flex items-center w-full min-w-0 space-x-1">
        {/* Left indicator if task starts before visible area (not for ongoing tasks) */}
        {!taskHasNoDates && taskStartDate < projectWeekStart && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            ⋯
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
              fontSize: '13px',
              whiteSpace: 'nowrap'
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
               color: isTaskOverdue ? '#DC2626' : brandTheme.primary.navy, // Red text for overdue
               fontSize: '15px',
               whiteSpace: 'nowrap',
               fontWeight: isTaskOverdue ? 'bold' : 'medium' // Bold text for overdue
             }}
           >
            {(() => {
              // If task has no dates and project has no end date, show "Ongoing"
              if (taskHasNoDates) {
                return 'Ongoing';
              }
              
              // Show overdue status for incomplete tasks past their original end date
              if (isTaskOverdue) {
                const daysOverdue = Math.abs(calculateDaysFromToday(originalTaskEndDate));
                return `OVERDUE ${daysOverdue}d`;
              }
              
              const daysToStart = calculateDaysFromToday(taskStartDate);
              const daysToEnd = calculateDaysFromToday(originalTaskEndDate); // Use original end date for calculation
              
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

        {/* Right indicator if task ends after visible area (not for ongoing tasks) */}
        {!taskHasNoDates && taskEndDate > projectWeekEnd && (
          <span 
            className="flex-shrink-0"
            style={{ 
              color: brandTheme.primary.navy,
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            ⋯
          </span>
        )}
      </div>

      {/* Hover tooltip would show more details */}
    </div>
  );
};

export default TaskBar;

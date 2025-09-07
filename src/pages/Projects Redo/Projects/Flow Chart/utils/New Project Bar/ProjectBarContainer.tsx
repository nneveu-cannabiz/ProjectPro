import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task, User } from '../../../../../../types';
import ProjectBarHeader from './ProjectBarHeader';
import TaskContainer from './Task Section/TaskContainer';
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

const TASK_BAR_SPACING = 2; // Reduced spacing between tasks
const PROJECT_HEADER_HEIGHT = 36;
const PROJECT_PADDING = 2; // Reduced padding around projects
const PROJECT_BORDER = 2;

const calculateTaskContainerHeight = (visibleTasks: Task[]): number => {
  if (!visibleTasks || visibleTasks.length === 0) {
    return 0; // No task container needed - return 0!
  }
  
  const taskCount = visibleTasks.length;
  const totalTaskHeight = taskCount * TASK_BAR_HEIGHT;
  const totalSpacing = Math.max(0, taskCount - 1) * TASK_BAR_SPACING;
  const containerPadding = 2; // Ultra minimal padding for task container
  
  return totalTaskHeight + totalSpacing + containerPadding;
};

const calculateProjectBarHeight = (visibleTasks: Task[]): number => {
  const headerHeight = PROJECT_HEADER_HEIGHT;
  const taskContainerHeight = calculateTaskContainerHeight(visibleTasks);
  const padding = PROJECT_PADDING * 2; // Top and bottom padding
  const border = PROJECT_BORDER * 2; // Top and bottom border
  
  // NO MINIMUM HEIGHT - wrap exactly around content
  return headerHeight + taskContainerHeight + padding + border;
};

const isTaskVisibleInWeek = (
  task: Task,
  weekStart: Date,
  weekEnd: Date,
  projectStart: Date,
  projectEnd: Date
): boolean => {
  // Hide completed tasks from the flow chart display
  if (task.status === 'done') {
    return false;
  }
  
  const taskStartDate = task.startDate ? new Date(task.startDate) : projectStart;
  const originalTaskEndDate = task.endDate ? new Date(task.endDate) : projectEnd;
  const taskHasNoDates = !task.startDate && !task.endDate;
  
  // For tasks without dates, they should be visible throughout the entire project duration
  if (taskHasNoDates) {
    return true;
  }
  
  // Check if task is overdue
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue = task.endDate && 
    new Date(task.endDate).getTime() < todayNormalized.getTime();
  
  if (isOverdue) {
    // Show overdue task if today is within the current week OR if the original task overlaps
    // Normalize all dates to avoid timezone issues
    const weekStartNormalized = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const weekEndNormalized = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
    
    const todayInWeek = todayNormalized.getTime() >= weekStartNormalized.getTime() && 
                        todayNormalized.getTime() <= weekEndNormalized.getTime();
    const originalTaskOverlaps = !(originalTaskEndDate < weekStart || taskStartDate > weekEnd);
    
    return todayInWeek || originalTaskOverlaps;
  } else {
    // Regular visibility check for non-overdue tasks
    return !(originalTaskEndDate < weekStart || taskStartDate > weekEnd);
  }
};

const getVisibleTasks = (
  tasks: Task[],
  weekStart: Date,
  weekEnd: Date,
  projectStart: Date,
  projectEnd: Date
): Task[] => {
  return tasks.filter(task => 
    isTaskVisibleInWeek(task, weekStart, weekEnd, projectStart, projectEnd)
  );
};

// Temporary inline functions to avoid import issues
const isProjectVisibleInWeek = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): boolean => {
  // For projects with no end date, only check if start is after the week end
  if (hasNoEndDate) {
    return projectStart <= weekEnd;
  }
  
  // Check if project overlaps with current week view at all
  return !(projectEnd < weekStart || projectStart > weekEnd);
};

const getProjectExtensions = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): { startsBeforeWeek: boolean; endsAfterWeek: boolean } => {
  const startsBeforeWeek = projectStart < weekStart;
  const endsAfterWeek = hasNoEndDate ? true : projectEnd > weekEnd;
  
  return { startsBeforeWeek, endsAfterWeek };
};

const calculateVisualBoundaries = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): { visualStartDate: Date; visualEndDate: Date } => {
  const { startsBeforeWeek, endsAfterWeek } = getProjectExtensions(
    projectStart,
    projectEnd,
    weekStart,
    weekEnd,
    hasNoEndDate
  );
  
  const visualStartDate = startsBeforeWeek ? weekStart : projectStart;
  const visualEndDate = hasNoEndDate ? weekEnd : (endsAfterWeek ? weekEnd : projectEnd);
  
  return { visualStartDate, visualEndDate };
};

export interface ProjectBarContainerProps {
  projectId?: string;
  projectName: string;
  projectStart: Date;
  projectEnd: Date;
  projectDeadline?: Date;
  projectProgress?: number;
  projectTasks?: Task[];
  weekStart: Date;
  weekEnd: Date;
  today: Date;
  stackLevel?: number;
  topPosition?: number;
  onProjectNameClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
  users?: User[];
  projectAssigneeId?: string;
  isClickable?: boolean;
  onClick?: (projectId?: string) => void;
}

const ProjectBarContainer: React.FC<ProjectBarContainerProps> = ({
  projectId,
  projectName,
  projectStart,
  projectEnd,
  projectDeadline,
  projectProgress = 0,
  projectTasks = [],
  weekStart,
  weekEnd,
  today,
  stackLevel = 0,
  topPosition,
  onProjectNameClick,
  onTaskClick,
  onUpdatesClick,
  onTaskUpdatesClick,
  getTaskUpdatesCount,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0,
  users = [],
  projectAssigneeId,
  isClickable = false,
  onClick
}) => {
  // Check if project has no end date
  const hasNoEndDate = projectStart.getTime() === projectEnd.getTime();
  
  // Check if project is visible in current week
  if (!isProjectVisibleInWeek(projectStart, projectEnd, weekStart, weekEnd, hasNoEndDate)) {
    return null;
  }
  
  // Get visible tasks for this week
  const visibleTasks = getVisibleTasks(projectTasks, weekStart, weekEnd, projectStart, projectEnd);
  
  // Calculate visual boundaries
  const { visualStartDate, visualEndDate } = calculateVisualBoundaries(
    projectStart,
    projectEnd,
    weekStart,
    weekEnd,
    hasNoEndDate
  );
  
  // Calculate positioning
  const { leftPercent, widthPercent } = calculateColumnPosition(
    visualStartDate,
    visualEndDate,
    weekStart
  );
  
  // Calculate height
  const totalHeight = calculateProjectBarHeight(visibleTasks);
  
  // Ensure minimum visibility
  const clampedLeftPercent = Math.max(-100, leftPercent);
  const adjustedWidthPercent = widthPercent + (leftPercent - clampedLeftPercent);
  
  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={isClickable && onClick ? () => onClick(projectId) : undefined}
      style={{
        top: topPosition !== undefined ? `${topPosition}px` : `${16 + stackLevel * 120}px`,
        left: `${clampedLeftPercent}%`,
        width: `${adjustedWidthPercent}%`,
        height: `${totalHeight}px`,
        minHeight: `${totalHeight}px`,
        backgroundColor: brandTheme.primary.lightBlue,
        border: `2px solid ${brandTheme.primary.navy}`,
        borderRadius: '8px',
        boxShadow: brandTheme.shadow.sm,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        transition: 'opacity 0.2s ease',
        zIndex: 20,
      }}
    >
      {/* Project Header */}
      <ProjectBarHeader
        projectId={projectId}
        projectName={projectName}
        projectStart={projectStart}
        projectEnd={projectEnd}
        projectDeadline={projectDeadline}
        projectProgress={projectProgress}
        weekStart={weekStart}
        weekEnd={weekEnd}
        today={today}
        hasNoEndDate={hasNoEndDate}
        onProjectNameClick={onProjectNameClick}
        onUpdatesClick={onUpdatesClick}
        unreadUpdatesCount={unreadUpdatesCount}
        totalUpdatesCount={totalUpdatesCount}
      />
      
      {/* Task Container */}
      <div className="flex-1 px-1" style={{ padding: '2px 4px' }}>
        <TaskContainer
          tasks={visibleTasks}
          projectStart={projectStart}
          projectEnd={projectEnd}
          weekStart={weekStart}
          onTaskClick={onTaskClick}
          onTaskUpdatesClick={onTaskUpdatesClick}
          getTaskUpdatesCount={getTaskUpdatesCount}
          users={users}
          projectAssigneeId={projectAssigneeId}
        />
      </div>
    </div>
  );
};

export default ProjectBarContainer;


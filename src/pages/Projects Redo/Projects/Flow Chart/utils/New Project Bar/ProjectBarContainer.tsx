import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task, User } from '../../../../../../types';
import ProjectBarHeader from './ProjectBarHeader';
import TaskContainer from './Task Section/TaskContainer';
import { calculateColumnPosition } from '../columnUtils';
import { getVisibleTasks } from './utils/visibleTasks';
import { isProjectVisibleInWeek, calculateVisualBoundaries } from './utils/visibleProjects';

// Constants
const TASK_BAR_HEIGHT = 32;

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
  currentUserId?: string; // The user whose row this project appears in
  projectMultiAssigneeIds?: string[]; // Array of multi-assignee IDs
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
  currentUserId,
  projectMultiAssigneeIds = [],
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
          currentUserId={currentUserId}
          projectMultiAssigneeIds={projectMultiAssigneeIds}
        />
      </div>
    </div>
  );
};

export default ProjectBarContainer;


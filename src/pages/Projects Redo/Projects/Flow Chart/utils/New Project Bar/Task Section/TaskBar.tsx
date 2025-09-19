import React from 'react';
import { brandTheme } from '../../../../../../../styles/brandTheme';
import { Task, User } from '../../../../../../../types';
import { parseISO } from 'date-fns';
import { calculateColumnPosition } from '../../columnUtils';

// Constants
const TASK_BAR_HEIGHT = 32;


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
  currentUserId?: string; // The user whose row this task bar appears in
  projectMultiAssigneeIds?: string[]; // Array of multi-assignee IDs
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

const getTaskPriorityStyle = (priority: string | null | undefined): { backgroundColor: string; showBadge: boolean; badgeColor: string; badgeText: string } => {
  // Ensure we handle null, undefined, and empty strings
  if (!priority || typeof priority !== 'string' || priority.trim() === '') {
    return {
      backgroundColor: '',
      showBadge: false,
      badgeColor: '',
      badgeText: ''
    };
  }
  
  const normalizedPriority = priority.toLowerCase().trim();
  
  switch (normalizedPriority) {
    case 'critical':
      return {
        backgroundColor: '#FECACA', // Light red background for critical tasks
        showBadge: true,
        badgeColor: '#B91C1C', // Red-700
        badgeText: 'CRITICAL'
      };
    case 'high':
      return {
        backgroundColor: '#FEE2E2', // Very light red background for high tasks
        showBadge: true,
        badgeColor: '#DC2626', // Red-600
        badgeText: 'HIGH'
      };
    case 'medium':
      return {
        backgroundColor: '', // No background color for medium
        showBadge: false, // Don't show badge for medium priority
        badgeColor: '',
        badgeText: ''
      };
    case 'low':
      return {
        backgroundColor: '', // No background color for low
        showBadge: false, // Don't show badge for low priority
        badgeColor: '',
        badgeText: ''
      };
    case 'very low':
      return {
        backgroundColor: '', // No background color for very low
        showBadge: false, // Don't show badge for very low priority
        badgeColor: '',
        badgeText: ''
      };
    default:
      return {
        backgroundColor: '',
        showBadge: false,
        badgeColor: '',
        badgeText: ''
      };
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
  projectAssigneeId,
  currentUserId,
  projectMultiAssigneeIds = []
}) => {
  // Calculate task date boundaries - use parseISO for proper date parsing
  const taskStartDate = task.startDate ? parseISO(task.startDate) : projectStart;
  const taskEndDate = task.endDate ? parseISO(task.endDate) : projectEnd;
  
  // Calculate positioning
  const { leftPercent, widthPercent } = calculateColumnPosition(
    taskStartDate,
    taskEndDate,
    weekStart
  );
  
  // Find assignee user
  const assignee = users.find(user => user.id === task.assigneeId);
  
  // Determine the context user (who's row this task bar is in)
  const contextUserId = currentUserId || projectAssigneeId;
  
  // Check if current user is multi-assignee of the project
  const isMultiAssignee = contextUserId && projectMultiAssigneeIds.includes(contextUserId);
  
  // Show assignee avatar if task is assigned to someone different than the context user
  const showAssigneeAvatar = task.assigneeId && task.assigneeId !== contextUserId;
  
  // Determine if task is assigned to a different user (affects background color)
  // For multi-assignee projects, tasks assigned to others should show different background
  const isAssignedToDifferentUser = task.assigneeId && task.assigneeId !== contextUserId;
  
  // For multi-assignees, only show pale blue background if task is NOT assigned to them
  // For main assignees, show pale blue background for tasks assigned to others
  const shouldShowDifferentBackground = isMultiAssignee 
    ? (task.assigneeId && task.assigneeId !== contextUserId) // Multi-assignee: show different only if task assigned to someone else
    : isAssignedToDifferentUser; // Main assignee: show different if assigned to different user
  
  // Get profile color for assignee
  const profileColor = assignee ? getProfileColor(assignee.id) : { backgroundColor: brandTheme.primary.lightBlue, textColor: brandTheme.text.primary };
  
  // Get priority styling
  const priorityStyle = getTaskPriorityStyle(task.priority);
  
  
  
  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={isClickable && onTaskClick ? () => onTaskClick(task.id) : undefined}
      style={{
        top: `${stackLevel * (TASK_BAR_HEIGHT + 2)}px`,
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`,
        height: `${TASK_BAR_HEIGHT}px`,
        backgroundColor: priorityStyle.backgroundColor ? priorityStyle.backgroundColor : (shouldShowDifferentBackground ? brandTheme.primary.paleBlue : 'white'),
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
      title={`${task.name}${priorityStyle.showBadge ? ` - ${priorityStyle.badgeText} PRIORITY` : ''} - ${(task.status || 'todo').toUpperCase()} - ${task.progress || 0}% Complete`}
    >
      {/* Task content - Name, Priority, Status, Progress in one line */}
      <div className="flex-1 flex items-center space-x-2 min-w-0">
        <span className="truncate" style={{ fontSize: '12px' }}>
          {task.name}
        </span>
        
        {/* Priority badge - show right after task name */}
        {task.priority && priorityStyle.showBadge && (
          <span 
            className="flex-shrink-0 px-1 py-0.5 rounded text-xs font-bold"
            style={{
              backgroundColor: priorityStyle.badgeColor,
              color: 'white',
              fontSize: '9px'
            }}
          >
            {priorityStyle.badgeText}
          </span>
        )}
        
        {/* Spacer to push status and progress to the right */}
        <div className="flex-1"></div>
        
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


import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';
import TaskBar from './taskbar';
import ProjectUpdateIcon from './projectupdateicon';
import { calculateDynamicHeight } from '../heightUtils';
import { generateWorkDates, isWeekendDay } from '../dateUtils';

export interface ProjectBarProps {
  projectId?: string;
  projectName: string;
  weekStart: Date;
  weekEnd: Date;
  projectStart: Date;
  projectEnd: Date;
  projectDeadline?: Date;
  projectProgress?: number;
  projectTasks?: Task[];
  today: Date;
  barHeightPx?: number;
  isClickable?: boolean;
  onClick?: (projectId?: string) => void;
  onProjectNameClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
  stackLevel?: number;
}



const formatShortDate = (d: Date) => format(d, 'EEE, MMM d');

const calculateRemainingDays = (endDate: Date, today: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.max(0, Math.ceil((endTime - todayTime) / msPerDay));
};

const getProgressColor = (progress: number): string => {
  if (progress === 0) return brandTheme.gray[500]; // Grey for 0%
  if (progress <= 25) return '#DC2626'; // Red for 1-25%
  if (progress <= 50) return '#D97706'; // Orange for 26-50%
  if (progress <= 75) return '#CA8A04'; // Yellow for 51-75%
  if (progress <= 99) return '#65A30D'; // Light green for 76-99%
  return brandTheme.status.success; // Full green for 100%
};

// Calculate position accounting for mixed flex and fixed width columns
const calculatePositionInFlexLayout = (
  startDate: Date,
  endDate: Date,
  rangeStart: Date
): { leftPercent: number; widthPercent: number } => {
  const allDates = generateWorkDates(rangeStart);
  
  // Find start and end column indices
  let startColumnIndex = -1;
  let endColumnIndex = -1;
  
  for (let i = 0; i < allDates.length; i++) {
    const currentDate = allDates[i];
    
    // Find the start column
    if (startColumnIndex === -1 && currentDate >= startDate) {
      startColumnIndex = i;
    }
    
    // Find the end column - we want to include the full day that contains the end date
    if (currentDate.toDateString() === endDate.toDateString()) {
      endColumnIndex = i;
      break;
    } else if (currentDate > endDate) {
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
  
  // In CSS flexbox with mixed flex and fixed items:
  // 1. Fixed width items (w-12) take their space first
  // 2. Remaining space is divided equally among flex-1 items
  // 3. We need to calculate percentages based on this actual distribution
  
  // Approximate the actual rendered widths
  // Assume container is 100% width, weekend columns take minimal space
  const assumedContainerWidth = 1000; // Assume 1000px container for calculation
  const remainingWidth = assumedContainerWidth - totalFixedWidth;
  const flexUnitWidth = totalFlexUnits > 0 ? remainingWidth / totalFlexUnits : 0;
  
  // Calculate actual pixel positions
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



const ProjectBar: React.FC<ProjectBarProps> = ({
  projectId,
  projectName,
  weekStart,
  weekEnd,
  projectStart,
  projectEnd,
  projectDeadline,
  projectProgress,
  projectTasks,
  today,
  barHeightPx = 80,
  isClickable = false,
  onClick,
  onProjectNameClick,
  onTaskClick,
  onUpdatesClick,
  onTaskUpdatesClick,
  getTaskUpdatesCount,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0,
  stackLevel = 0,
}) => {
  // Check if this project has no end date (same as start date means no real end date was set)
  const hasNoEndDate = projectStart.getTime() === projectEnd.getTime();
  

  

  // Calculate dynamic height based on task content
  const baseDynamicHeight = calculateDynamicHeight(projectTasks || [], barHeightPx);
  
  // Ensure minimum height for new vertical layout (project name + dates + padding)
  const minVerticalLayoutHeight = 65; // Balanced height to prevent overlap without excessive spacing
  const dynamicHeight = Math.max(baseDynamicHeight, minVerticalLayoutHeight);
  

  // Check if project overlaps with current week view at all
  // For projects with no end date, only check if start is after the week end
  if ((!hasNoEndDate && projectEnd < weekStart) || projectStart > weekEnd) {
    return null;
  }

  // Determine visual boundaries and arrow indicators
  const projectStartsBeforeWeek = projectStart < weekStart;
  const projectEndsAfterWeek = hasNoEndDate ? true : projectEnd > weekEnd; // If no end date, always show right arrow
  const showOriginalStartDate = projectStart < today;
  
  // Calculate the visual start date for rendering checks
  const visualStartDate = projectStartsBeforeWeek ? weekStart : (projectStart < today ? today : projectStart);
  
  // If visual start is after week end, don't render
  if (visualStartDate > weekEnd) {
    return null;
  }

  // Calculate positioning using the new layout system
  const barStartDate = projectStartsBeforeWeek ? weekStart : projectStart;
  const barEndDate = hasNoEndDate ? weekEnd : (projectEndsAfterWeek ? weekEnd : projectEnd);
  
  // Use the new positioning calculation that accounts for weekend columns
  const { leftPercent, widthPercent } = calculatePositionInFlexLayout(
    barStartDate,
    barEndDate,
    weekStart
  );
  
  // Ensure minimum visibility - if bar starts way before the range, clamp the left position
  const clampedLeftPercent = Math.max(-100, leftPercent); // Allow up to 100% off-screen to the left
  const adjustedWidthPercent = widthPercent + (leftPercent - clampedLeftPercent);
  
  // Calculate remaining days from today to project end (or show as ongoing if no end date)
  const remainingDays = hasNoEndDate ? null : calculateRemainingDays(projectEnd, today);

  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={isClickable && onClick ? () => onClick(projectId) : undefined}
      style={{
        top: `${16 + stackLevel * (dynamicHeight + 65)}px`,
        left: `${clampedLeftPercent}%`,
        width: `${adjustedWidthPercent}%`,
        height: `${dynamicHeight}px`,
        minHeight: `${dynamicHeight}px`, // Ensure minimum height is respected
        backgroundColor: brandTheme.primary.lightBlue,
        border: `2px solid ${brandTheme.primary.navy}`,
        borderRadius: '8px',
        boxShadow: brandTheme.shadow.sm,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        color: brandTheme.text.primary,
        overflow: 'visible',
        transition: 'opacity 0.2s ease',
        zIndex: 20,
      }}
    >
      {/* Top section - Project name and progress in top left */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center flex-wrap">
          {projectStartsBeforeWeek && (
            <ChevronLeft 
              size={14} 
              style={{ color: brandTheme.text.primary }}
              className="mr-1"
            />
          )}
          <span 
            className={`font-medium text-sm mr-2 min-w-0 ${
              onProjectNameClick && projectId ? 'cursor-pointer hover:underline hover:opacity-80' : ''
            }`}
            onClick={onProjectNameClick && projectId ? (e) => {
              e.stopPropagation();
              onProjectNameClick(projectId);
            } : undefined}
            title={onProjectNameClick && projectId ? 'Click to view project details' : undefined}
          >
            {projectName}
          </span>
          <span 
            className="text-xs font-bold px-2 py-1 rounded flex-shrink-0"
            style={{ 
              color: brandTheme.background.primary,
              backgroundColor: getProgressColor(projectProgress || 0),
              minWidth: '35px',
              textAlign: 'center'
            }}
          >
            {projectProgress || 0}%
          </span>
          
          {/* Updates Icon */}
          {projectId && onUpdatesClick && (
            <div className="ml-2">
              <ProjectUpdateIcon
                projectId={projectId}
                unreadCount={unreadUpdatesCount}
                totalCount={totalUpdatesCount}
                onClick={onUpdatesClick}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          {projectEndsAfterWeek && (
            <ChevronRight 
              size={14} 
              style={{ color: brandTheme.text.primary }}
              className="mr-1"
            />
          )}
          <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
            {hasNoEndDate ? 'Ongoing' : `${remainingDays}d left`}
          </span>
        </div>
      </div>
      
      {/* Middle section - Task Bars */}
      <div className="relative flex-1" style={{ minHeight: (projectTasks || []).length > 0 ? '40px' : '10px', marginBottom: '6px' }}>
        {(projectTasks || []).map((task, index) => {
          const taskUpdatesCount = getTaskUpdatesCount ? getTaskUpdatesCount(task.id) : { unreadCount: 0, totalCount: 0 };
          
          return (
            <TaskBar
              key={task.id}
              task={task}
              projectStart={projectStart}
              projectEnd={projectEnd}
              projectWeekStart={weekStart}
              projectWeekEnd={weekEnd}
              stackLevel={index}
              onTaskClick={onTaskClick}
              onUpdatesClick={onTaskUpdatesClick}
              unreadUpdatesCount={taskUpdatesCount.unreadCount}
              totalUpdatesCount={taskUpdatesCount.totalCount}
              isClickable={!!onTaskClick}
            />
          );
        })}
      </div>
      
      {/* Bottom section - Start and End dates */}
      <div className="flex items-center justify-between mt-1 text-sm">
        <div style={{ color: brandTheme.text.secondary }}>
          {projectStartsBeforeWeek ? (
            <span>Started: {formatShortDate(projectStart)}</span>
          ) : showOriginalStartDate ? (
            <span>Started: {formatShortDate(projectStart)}</span>
          ) : (
            <span>Start: {formatShortDate(projectStart)}</span>
          )}
        </div>
        
        <div className="flex items-center" style={{ color: brandTheme.text.secondary }}>
          {projectDeadline && (
            <span className="mr-3" style={{ color: brandTheme.text.primary, fontWeight: 'medium' }}>
              Deadline: {formatShortDate(projectDeadline)}
            </span>
          )}
          <span>
            {hasNoEndDate ? 'No end date set' : `End: ${formatShortDate(projectEnd)}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectBar;

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Task } from '../../../../../../types';
import TaskBar from './taskbar';
import { calculateDynamicHeight } from '../heightUtils';

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
  stackLevel?: number;
}

const diffDays = (startDate: Date, endDate: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.floor((end - start) / msPerDay);
};

const formatShortDate = (d: Date) => format(d, 'MMM d');

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
  stackLevel = 0,
}) => {
  // Calculate dynamic height based on task content
  const dynamicHeight = calculateDynamicHeight(projectTasks || [], barHeightPx);
  
  // Debug: Log height calculation
  if (projectTasks && projectTasks.length > 0) {
    console.log(`Project: ${projectName}, Tasks: ${projectTasks.length}, Dynamic Height: ${dynamicHeight}px`);
  }
  // Check if project overlaps with current week view at all
  if (projectEnd < weekStart || projectStart > weekEnd) {
    return null;
  }

  // Determine visual boundaries and arrow indicators
  const projectStartsBeforeWeek = projectStart < weekStart;
  const projectEndsAfterWeek = projectEnd > weekEnd;
  const showOriginalStartDate = projectStart < today;
  
  // Calculate the visual start date for rendering checks
  const visualStartDate = projectStartsBeforeWeek ? weekStart : (projectStart < today ? today : projectStart);
  
  // If visual start is after week end, don't render
  if (visualStartDate > weekEnd) {
    return null;
  }

  // Calculate positioning based on day boundaries
  const totalWeekDays = 5; // Monday to Friday
  
  // Calculate the actual start date for positioning (not the visual start)
  const barStartDate = projectStartsBeforeWeek ? weekStart : projectStart;
  const barEndDate = projectEndsAfterWeek ? weekEnd : projectEnd;
  
  const startDayOffset = diffDays(weekStart, barStartDate);
  const endDayOffset = diffDays(weekStart, barEndDate);
  
  // Calculate precise positioning - allow negative left for bars starting before week
  const leftPercent = (startDayOffset / totalWeekDays) * 100;
  const rightPercent = ((endDayOffset + 1) / totalWeekDays) * 100;
  const widthPercent = rightPercent - leftPercent;
  
  // Ensure minimum visibility - if bar starts way before the week, clamp the left position
  const clampedLeftPercent = Math.max(-100, leftPercent); // Allow up to 100% off-screen to the left
  const adjustedWidthPercent = widthPercent + (leftPercent - clampedLeftPercent);
  
  // Calculate remaining days for tooltip
  const remainingDays = projectEndsAfterWeek ? calculateRemainingDays(projectEnd, today) : 0;

  return (
    <div
      className={`absolute ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={isClickable && onClick ? () => onClick(projectId) : undefined}
      style={{
        top: `${8 + stackLevel * (dynamicHeight + 8)}px`,
        left: `${clampedLeftPercent}%`,
        width: `${adjustedWidthPercent}%`,
        height: `${dynamicHeight}px`,
        minHeight: `${dynamicHeight}px`, // Ensure minimum height is respected
        backgroundColor: brandTheme.primary.lightBlue,
        border: `2px solid ${brandTheme.primary.navy}`,
        borderRadius: '8px',
        boxShadow: brandTheme.shadow.sm,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        paddingLeft: projectStartsBeforeWeek ? '4px' : '12px',
        paddingRight: projectEndsAfterWeek ? '4px' : '12px',
        color: brandTheme.text.primary,
        overflow: 'visible',
        transition: 'opacity 0.2s ease',
        zIndex: 20,
      }}
    >
      {/* Left side - Arrow if project starts before week, or project info */}
      <div className="flex items-center min-w-0 flex-1">
        {projectStartsBeforeWeek && (
          <div className="flex items-center mr-2">
            <ChevronLeft 
              size={14} 
              style={{ color: brandTheme.text.primary }}
            />
            <span className="text-xs ml-1" style={{ color: brandTheme.text.secondary }}>
              Started: {formatShortDate(projectStart)}
            </span>
          </div>
        )}
        
        <div className="flex flex-col justify-start min-w-0 flex-1 h-full py-2">
          {/* Project name with inline progress percentage */}
          <div className="flex items-center mb-1 flex-wrap">
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
          </div>
          
          {/* Task Bars - Positioned relative to project timeline */}
          <div className="relative w-full" style={{ height: '60px', marginTop: '4px' }}>
            {(projectTasks || []).slice(0, 3).map((task, index) => (
              <TaskBar
                key={task.id}
                task={task}
                projectStart={projectStart}
                projectEnd={projectEnd}
                projectWeekStart={weekStart}
                projectWeekEnd={weekEnd}
                stackLevel={index}
                onTaskClick={onTaskClick}
                isClickable={!!onTaskClick}
              />
            ))}
            {(projectTasks || []).length > 3 && (
              <div 
                className="absolute bottom-0 right-0 text-xs italic"
                style={{ 
                  color: brandTheme.text.muted,
                  fontSize: '10px',
                  backgroundColor: brandTheme.background.primary,
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}
              >
                +{(projectTasks || []).length - 3} more
              </div>
            )}
          </div>
          
          {showOriginalStartDate && !projectStartsBeforeWeek && typeof projectProgress !== 'number' && (
            <span className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
              Started: {formatShortDate(projectStart)}
            </span>
          )}
        </div>
      </div>

      {/* Right side - Deadline, End date and extension info */}
      <div className="relative flex flex-col items-end justify-center ml-2 flex-shrink-0 h-full py-2">
        {/* Show deadline if available */}
        {projectDeadline && (
          <span className="text-xs mb-1" style={{ color: brandTheme.text.primary, fontWeight: 'medium' }}>
            Deadline: {formatShortDate(projectDeadline)}
          </span>
        )}
        
        {/* Always show end date */}
        <div className="flex items-center">
          <span className="text-xs mr-2" style={{ color: brandTheme.text.secondary }}>
            End: {formatShortDate(projectEnd)}
          </span>
          
          {/* Show arrow and remaining days if project extends beyond week */}
          {projectEndsAfterWeek && (
            <>
              <ChevronRight 
                size={14} 
                style={{ color: brandTheme.text.primary }}
              />
              <span className="text-xs ml-1" style={{ color: brandTheme.text.secondary }}>
                {remainingDays}d left
              </span>
              
              {/* Tooltip-style info below the arrow */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border rounded px-2 py-1 shadow-sm z-30 opacity-0 hover:opacity-100 transition-opacity"
                style={{ 
                  borderColor: brandTheme.border.light,
                  fontSize: '10px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ color: brandTheme.text.primary, fontWeight: 'medium' }}>
                  {remainingDays} days remaining
                </div>
                <div style={{ color: brandTheme.text.muted }}>
                  Full end date: {formatShortDate(projectEnd)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectBar;

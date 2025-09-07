import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { format } from 'date-fns';

// Temporary inline constants and functions to avoid import issues
const PROJECT_HEADER_HEIGHT = 36;
const formatShortDate = (date: Date): string => {
  return format(date, 'EEE, MMM d');
};

const calculateRemainingDays = (endDate: Date, today: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.max(0, Math.ceil((endTime - todayTime) / msPerDay));
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

export interface ProjectBarHeaderProps {
  projectId?: string;
  projectName: string;
  projectStart: Date;
  projectEnd: Date;
  projectDeadline?: Date;
  projectProgress?: number;
  weekStart: Date;
  weekEnd: Date;
  today: Date;
  hasNoEndDate?: boolean;
  onProjectNameClick?: (projectId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  unreadUpdatesCount?: number;
  totalUpdatesCount?: number;
}

const getProgressColor = (progress: number): string => {
  if (progress === 0) return brandTheme.gray[500];
  if (progress <= 25) return '#DC2626'; // Red
  if (progress <= 50) return '#D97706'; // Orange
  if (progress <= 75) return '#CA8A04'; // Yellow
  if (progress <= 99) return '#65A30D'; // Light green
  return brandTheme.status.success; // Full green
};

const ProjectBarHeader: React.FC<ProjectBarHeaderProps> = ({
  projectId,
  projectName,
  projectStart,
  projectEnd,
  projectDeadline,
  projectProgress = 0,
  weekStart,
  weekEnd,
  today,
  hasNoEndDate = false,
  onProjectNameClick,
  onUpdatesClick,
  unreadUpdatesCount = 0,
  totalUpdatesCount = 0
}) => {
  const { startsBeforeWeek, endsAfterWeek } = getProjectExtensions(
    projectStart,
    projectEnd,
    weekStart,
    weekEnd,
    hasNoEndDate
  );
  
  const remainingDays = hasNoEndDate ? null : calculateRemainingDays(projectEnd, today);
  const showOriginalStartDate = projectStart < today;
  
  return (
    <div
      className="flex items-center justify-between"
      style={{
        height: `${PROJECT_HEADER_HEIGHT}px`,
        borderBottom: `1px solid ${brandTheme.border.light}`,
        padding: '2px 4px'
      }}
    >
      {/* Left section - Project name and indicators */}
      <div className="flex items-center flex-1 min-w-0">
        {startsBeforeWeek && (
          <ChevronLeft 
            size={14} 
            style={{ color: brandTheme.text.primary }}
            className="mr-1 flex-shrink-0"
          />
        )}
        
        <span 
          className={`font-medium text-sm mr-2 truncate ${
            onProjectNameClick && projectId ? 'cursor-pointer hover:underline hover:opacity-80' : ''
          }`}
          onClick={onProjectNameClick && projectId ? (e) => {
            e.stopPropagation();
            onProjectNameClick(projectId);
          } : undefined}
          title={onProjectNameClick && projectId ? 'Click to view project details' : projectName}
        >
          {projectName}
        </span>
        
        <span 
          className="text-xs font-bold px-2 py-1 rounded flex-shrink-0"
          style={{ 
            color: brandTheme.background.primary,
            backgroundColor: getProgressColor(projectProgress),
            minWidth: '35px',
            textAlign: 'center'
          }}
        >
          {projectProgress}%
        </span>
        
        {/* Updates Icon */}
        {projectId && onUpdatesClick && (totalUpdatesCount > 0) && (
          <div
            className="ml-2 flex-shrink-0 cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onUpdatesClick(projectId);
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: unreadUpdatesCount > 0 ? brandTheme.status.warning : brandTheme.gray[300],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: brandTheme.background.primary
            }}
            title={`${unreadUpdatesCount} unread, ${totalUpdatesCount} total updates`}
          >
            {unreadUpdatesCount > 0 ? unreadUpdatesCount : totalUpdatesCount}
          </div>
        )}
      </div>
      
      {/* Right section - Time remaining and arrow */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-sm font-medium mr-1" style={{ color: brandTheme.text.secondary }}>
          {hasNoEndDate ? 'Ongoing' : `${remainingDays}d left`}
        </span>
        
        {endsAfterWeek && (
          <ChevronRight 
            size={14} 
            style={{ color: brandTheme.text.primary }}
            className="ml-1"
          />
        )}
      </div>
      
      {/* Bottom section - Dates (only show when space allows) */}
      <div className="absolute bottom-1 left-3 right-3 flex items-center justify-between text-xs" style={{ color: brandTheme.text.muted }}>
        <div>
          {startsBeforeWeek ? (
            <span>Started: {formatShortDate(projectStart)}</span>
          ) : showOriginalStartDate ? (
            <span>Started: {formatShortDate(projectStart)}</span>
          ) : (
            <span>Start: {formatShortDate(projectStart)}</span>
          )}
        </div>
        
        <div className="flex items-center">
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

export default ProjectBarHeader;


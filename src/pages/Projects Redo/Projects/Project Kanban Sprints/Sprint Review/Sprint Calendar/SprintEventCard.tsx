import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar, Target, Clock } from 'lucide-react';

interface SprintGroup {
  id: string;
  name: string;
  sprint_type: 'Sprint 1' | 'Sprint 2';
  project: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    priority?: string;
  }>;
}

interface SprintEventCardProps {
  sprintGroup: SprintGroup;
  date: Date;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const SprintEventCard: React.FC<SprintEventCardProps> = ({
  sprintGroup,
  date,
  onProjectClick,
  onSprintReviewClick
}) => {
  const getSprintStyle = () => {
    if (sprintGroup.sprint_type === 'Sprint 1') {
      return {
        backgroundColor: brandTheme.primary.paleBlue,
        borderColor: brandTheme.primary.lightBlue,
        color: brandTheme.primary.navy,
        icon: Calendar
      };
    } else {
      return {
        backgroundColor: brandTheme.background.brandLight,
        borderColor: brandTheme.border.brand,
        color: brandTheme.text.primary,
        icon: Target
      };
    }
  };

  const getTasksInProgress = () => {
    return sprintGroup.tasks.filter(task => 
      task.status?.toLowerCase() === 'in-progress'
    ).length;
  };

  const isOverdue = () => {
    const today = new Date();
    return sprintGroup.tasks.some(task => {
      if (task.end_date) {
        const endDate = new Date(task.end_date);
        return endDate < today && task.status?.toLowerCase() !== 'done';
      }
      return false;
    });
  };

  const sprintStyle = getSprintStyle();
  const IconComponent = sprintStyle.icon;
  const tasksInProgress = getTasksInProgress();
  const hasOverdueTasks = isOverdue();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSprintReviewClick?.(sprintGroup.project);
  };

  return (
    <div
      className="p-2 rounded-md border cursor-pointer transition-all duration-200 hover:shadow-sm"
      style={{
        backgroundColor: sprintStyle.backgroundColor,
        borderColor: sprintStyle.borderColor,
        borderLeftWidth: '3px'
      }}
      onClick={handleClick}
      title={`${sprintGroup.name} - Click to review`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = brandTheme.shadow.sm;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center space-x-1 mb-1">
        <IconComponent 
          className="w-3 h-3 flex-shrink-0" 
          style={{ color: sprintStyle.color }}
        />
        <span 
          className="text-xs font-medium truncate"
          style={{ color: sprintStyle.color }}
        >
          {sprintGroup.name}
        </span>
      </div>

      <div className="text-xs truncate mb-1" style={{ color: sprintStyle.color }}>
        {sprintGroup.project.name}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {tasksInProgress > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" style={{ color: brandTheme.status.inProgress }} />
              <span 
                className="text-xs font-medium"
                style={{ color: brandTheme.status.inProgress }}
              >
                {tasksInProgress}
              </span>
            </div>
          )}
          
          {hasOverdueTasks && (
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: brandTheme.status.error }}
              title="Has overdue tasks"
            />
          )}
        </div>

        <span 
          className="text-xs font-medium"
          style={{ color: sprintStyle.color }}
        >
          {sprintGroup.tasks.length} tasks
        </span>
      </div>
    </div>
  );
};

export default SprintEventCard;


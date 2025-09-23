import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import SprintEventCard from './SprintEventCard';

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

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  sprintGroups: SprintGroup[];
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  sprintGroups,
  onProjectClick,
  onSprintReviewClick
}) => {
  const dayNumber = date.getDate();

  const getDayStyle = () => {
    let backgroundColor = brandTheme.background.primary;
    let borderColor = brandTheme.border.light;

    if (isToday) {
      backgroundColor = brandTheme.primary.paleBlue;
      borderColor = brandTheme.primary.lightBlue;
    } else if (!isCurrentMonth) {
      backgroundColor = brandTheme.background.secondary;
    }

    return { backgroundColor, borderColor };
  };

  const getDateStyle = () => {
    let color = brandTheme.text.primary;
    let fontWeight = 'font-normal';

    if (isToday) {
      color = brandTheme.primary.navy;
      fontWeight = 'font-bold';
    } else if (!isCurrentMonth) {
      color = brandTheme.text.muted;
    }

    return { color, fontWeight };
  };

  const dayStyle = getDayStyle();
  const dateStyle = getDateStyle();

  return (
    <div
      className={`min-h-[120px] p-2 border transition-colors ${dateStyle.fontWeight}`}
      style={{
        backgroundColor: dayStyle.backgroundColor,
        borderColor: dayStyle.borderColor,
        borderRadius: brandTheme.radius.md
      }}
    >
      {/* Date Number */}
      <div 
        className="text-sm mb-2 text-center"
        style={{ color: dateStyle.color }}
      >
        {dayNumber}
      </div>

      {/* Sprint Events */}
      <div className="space-y-1">
        {sprintGroups.slice(0, 3).map((sprintGroup) => (
          <SprintEventCard
            key={sprintGroup.id}
            sprintGroup={sprintGroup}
            date={date}
            onProjectClick={onProjectClick}
            onSprintReviewClick={onSprintReviewClick}
          />
        ))}
        
        {/* Show overflow indicator */}
        {sprintGroups.length > 3 && (
          <div 
            className="text-xs text-center py-1 rounded-md cursor-pointer"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              color: brandTheme.text.muted 
            }}
            title={`${sprintGroups.length - 3} more events`}
          >
            +{sprintGroups.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDay;


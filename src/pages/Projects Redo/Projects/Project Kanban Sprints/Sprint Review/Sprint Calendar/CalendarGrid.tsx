import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import CalendarDay from './CalendarDay';
import { getCalendarDays, isDateInRange, getSprintGroupsForDate } from './utils/dateUtils';

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

interface CalendarGridProps {
  currentDate: Date;
  sprintGroups: SprintGroup[];
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  sprintGroups,
  onProjectClick,
  onSprintReviewClick
}) => {
  const calendarDays = getCalendarDays(currentDate);
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-1">
      {calendarDays.map((date, index) => {
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === today.toDateString();
        const daySprintGroups = getSprintGroupsForDate(date, sprintGroups);

        return (
          <CalendarDay
            key={index}
            date={date}
            isCurrentMonth={isCurrentMonth}
            isToday={isToday}
            sprintGroups={daySprintGroups}
            onProjectClick={onProjectClick}
            onSprintReviewClick={onSprintReviewClick}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;


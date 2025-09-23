import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';

const CalendarHeader: React.FC = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-7 gap-1">
      {daysOfWeek.map((day) => (
        <div
          key={day}
          className="p-3 text-center font-semibold text-sm"
          style={{
            backgroundColor: brandTheme.background.secondary,
            color: brandTheme.text.primary,
            borderRadius: brandTheme.radius.md
          }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export default CalendarHeader;


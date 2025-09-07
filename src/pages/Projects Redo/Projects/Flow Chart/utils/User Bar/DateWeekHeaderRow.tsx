import React from 'react';
import { format, isSameDay, isWeekend } from 'date-fns';
import { brandTheme } from '../../../../../../styles/brandTheme';

export interface DateWeekHeaderRowProps {
  dates: Date[];
  today: Date;
}

const DateWeekHeaderRow: React.FC<DateWeekHeaderRowProps> = ({
  dates,
  today
}) => {
  return (
    <div 
      className="flex border-b"
      style={{
        backgroundColor: brandTheme.background.secondary,
        borderBottomColor: brandTheme.border.light,
        minHeight: '50px'
      }}
    >
      {dates.map((date, index) => {
        const isToday = isSameDay(date, today);
        const isWeekendDay = isWeekend(date);
        
        return (
          <div
            key={index}
            className={`${isWeekendDay ? '' : 'flex-1'} flex flex-col items-center justify-center py-2 px-1 border-r`}
            style={{
              borderRightColor: brandTheme.border.light,
              backgroundColor: isToday 
                ? brandTheme.primary.paleBlue 
                : isWeekendDay 
                ? brandTheme.background.tertiary 
                : 'transparent',
              minWidth: isWeekendDay ? '24px' : '80px',
              width: isWeekendDay ? '24px' : undefined,
              flexShrink: isWeekendDay ? 0 : undefined
            }}
          >
            {/* Day of Week */}
            <div 
              className="text-xs font-medium mb-1"
              style={{ 
                color: isToday 
                  ? brandTheme.primary.navy 
                  : isWeekendDay 
                  ? brandTheme.text.muted 
                  : brandTheme.text.secondary 
              }}
            >
              {format(date, 'EEE')}
            </div>
            
            {/* Date */}
            <div 
              className="text-sm font-semibold"
              style={{ 
                color: isToday 
                  ? brandTheme.primary.navy 
                  : isWeekendDay 
                  ? brandTheme.text.muted 
                  : brandTheme.text.primary 
              }}
            >
              {format(date, 'MMM d')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DateWeekHeaderRow;

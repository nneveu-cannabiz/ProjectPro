import { format, addDays, startOfWeek, addWeeks as dateFnsAddWeeks, isSameDay, isWeekend } from 'date-fns';

export const generateWorkDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  let workDaysAdded = 0;
  
  // Generate dates until we have 5 working days, including weekends in between
  while (workDaysAdded < 5) {
    dates.push(new Date(currentDate));
    
    if (!isWeekend(currentDate)) {
      workDaysAdded++;
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

export const getCurrentDay = (): Date => {
  return new Date();
};

export const getDateRangeLabel = (startDate: Date): string => {
  const dates = generateWorkDates(startDate);
  const endDate = dates[dates.length - 1];
  
  const startFormatted = format(startDate, 'MMM d');
  const endFormatted = format(endDate, 'MMM d, yyyy');
  
  return `${startFormatted} - ${endFormatted}`;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  return dateFnsAddWeeks(date, weeks);
};

export const addWorkDays = (startDate: Date, days: number): Date => {
  let currentDate = new Date(startDate);
  let workDaysAdded = 0;
  
  if (days > 0) {
    while (workDaysAdded < days) {
      currentDate = addDays(currentDate, 1);
      if (!isWeekend(currentDate)) {
        workDaysAdded++;
      }
    }
  } else if (days < 0) {
    while (workDaysAdded > days) {
      currentDate = addDays(currentDate, -1);
      if (!isWeekend(currentDate)) {
        workDaysAdded--;
      }
    }
  }
  
  return currentDate;
};

export const isWeekendDay = (date: Date): boolean => {
  return isWeekend(date);
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM d');
};

export const formatDayName = (date: Date): string => {
  return format(date, 'EEE');
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
}; 
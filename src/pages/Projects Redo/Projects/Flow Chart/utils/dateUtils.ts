import { format, addDays, startOfWeek, addWeeks as dateFnsAddWeeks, isSameDay } from 'date-fns';

export const generateWeekDates = (startDate: Date): Date[] => {
  const weekDates: Date[] = [];
  for (let i = 0; i < 5; i++) { // Monday to Friday
    weekDates.push(addDays(startDate, i));
  }
  return weekDates;
};

export const getCurrentWeekMonday = (): Date => {
  const today = new Date();
  // Get Monday of current week (weekStartsOn: 1 means Monday)
  return startOfWeek(today, { weekStartsOn: 1 });
};

export const getWeekLabel = (startDate: Date): string => {
  const endDate = addDays(startDate, 4); // Friday
  
  const startFormatted = format(startDate, 'MMM d');
  const endFormatted = format(endDate, 'MMM d, yyyy');
  
  return `${startFormatted} - ${endFormatted}`;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  return dateFnsAddWeeks(date, weeks);
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
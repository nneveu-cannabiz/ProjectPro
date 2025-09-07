// Re-export the date utilities from the main utils
export { 
  generateWorkDates,
  isWeekendDay 
} from '../../dateUtils';

import { format } from 'date-fns';

/**
 * Format date for display in project bars
 */
export const formatShortDate = (date: Date): string => {
  return format(date, 'EEE, MMM d');
};

/**
 * Format date range for display
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
};

/**
 * Calculate remaining days from today to project end
 */
export const calculateRemainingDays = (endDate: Date, today: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.max(0, Math.ceil((endTime - todayTime) / msPerDay));
};


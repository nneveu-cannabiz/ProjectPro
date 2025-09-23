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

/**
 * Get all days to display in a calendar month view (including previous/next month days)
 */
export const getCalendarDays = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // End on the Saturday of the week containing the last day
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

/**
 * Check if a date falls within a date range
 */
export const isDateInRange = (date: Date, startDate?: string, endDate?: string): boolean => {
  if (!startDate && !endDate) return false;
  
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return targetDate >= start && targetDate <= end;
  } else if (startDate) {
    const start = new Date(startDate);
    return targetDate.getTime() === start.getTime();
  } else if (endDate) {
    const end = new Date(endDate);
    return targetDate.getTime() === end.getTime();
  }
  
  return false;
};

/**
 * Get sprint groups that have tasks on or spanning a specific date
 */
export const getSprintGroupsForDate = (date: Date, sprintGroups: SprintGroup[]): SprintGroup[] => {
  return sprintGroups.filter(group => {
    // Check if any task in the group falls on this date
    return group.tasks.some(task => {
      // If task has both start and end dates, check if date is in range
      if (task.start_date && task.end_date) {
        return isDateInRange(date, task.start_date, task.end_date);
      }
      // If task has only start date, check if it matches
      else if (task.start_date) {
        return isDateInRange(date, task.start_date);
      }
      // If task has only end date, check if it matches
      else if (task.end_date) {
        return isDateInRange(date, undefined, task.end_date);
      }
      return false;
    });
  });
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Get the start and end of a month
 */
export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};


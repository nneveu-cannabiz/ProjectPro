import { generateWorkDates, isWeekendDay } from './dateUtils';

/**
 * Calculate column positioning that matches FlowChartContainer's CSS layout exactly
 * Weekend columns: w-12 (48px fixed)
 * Weekday columns: flex-1 (share remaining space)
 */
export const calculateColumnPosition = (
  startDate: Date,
  endDate: Date,
  weekStart: Date
): { leftPercent: number; widthPercent: number } => {
  // Generate all dates in the current week view (same as FlowChartContainer)
  const allDates = generateWorkDates(weekStart);
  
  // Find the column indices for start and end
  let startColumnIndex = -1;
  let endColumnIndex = -1;
  
  for (let i = 0; i < allDates.length; i++) {
    const currentDate = allDates[i];
    
    // Normalize dates to start of day for accurate comparison
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Find the start column
    if (startColumnIndex === -1 && normalizedCurrentDate >= normalizedStartDate) {
      startColumnIndex = i;
    }
    
    // Find the end column - include the full day that contains the end date
    if (normalizedCurrentDate.getTime() === normalizedEndDate.getTime()) {
      endColumnIndex = i;
      break;
    } else if (normalizedCurrentDate > normalizedEndDate) {
      // If we've passed the end date, use the previous column
      endColumnIndex = Math.max(0, i - 1);
      break;
    }
  }
  
  // Handle edge cases
  if (startColumnIndex === -1) {
    startColumnIndex = 0;
  }
  if (endColumnIndex === -1) {
    endColumnIndex = allDates.length - 1;
  }
  
  // Ensure we span at least one column
  if (endColumnIndex < startColumnIndex) {
    endColumnIndex = startColumnIndex;
  }
  
  // Calculate position using FlowChartContainer's exact CSS logic
  // Weekend columns: w-12 (48px fixed), Weekday columns: flex-1 (share remaining space)
  
  // Count columns and calculate flex distribution
  let weekendCount = 0;
  let flexCount = 0;
  
  allDates.forEach(date => {
    if (isWeekendDay(date)) {
      weekendCount++;
    } else {
      flexCount++;
    }
  });
  
  // Calculate how much space flex columns get
  // Use the same assumption as FlowChartContainer's minWidth: '120px' for workdays
  const assumedContainerWidth = 1000;
  const totalWeekendWidth = weekendCount * 48; // w-12 = 48px
  const totalFlexWidth = assumedContainerWidth - totalWeekendWidth;
  const flexColumnWidth = flexCount > 0 ? totalFlexWidth / flexCount : 0;
  

  
  // Calculate position up to start column
  let leftPixels = 0;
  
  for (let i = 0; i < startColumnIndex; i++) {
    if (isWeekendDay(allDates[i])) {
      leftPixels += 48; // w-12 = 48px
    } else {
      leftPixels += flexColumnWidth; // flex-1 share
    }
  }
  
  // Calculate spanned width from start to end column
  let spannedPixels = 0;
  
  for (let i = startColumnIndex; i <= endColumnIndex; i++) {
    if (isWeekendDay(allDates[i])) {
      spannedPixels += 48;
    } else {
      spannedPixels += flexColumnWidth;
    }
  }
  
  // Convert to percentages
  const leftPercent = (leftPixels / assumedContainerWidth) * 100;
  const widthPercent = (spannedPixels / assumedContainerWidth) * 100;
  
  const finalWidthPercent = Math.max(widthPercent, 0.1); // Ensure minimum visibility
  
  return { leftPercent, widthPercent: finalWidthPercent };
};

/**
 * Find today's column index in the week view
 */
export const findTodayColumnIndex = (weekStart: Date): number => {
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const allDates = generateWorkDates(weekStart);
  

  
  for (let i = 0; i < allDates.length; i++) {
    const currentDate = allDates[i];
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    if (normalizedCurrentDate.getTime() === todayNormalized.getTime()) {
      return i;
    }
  }
  
  return -1; // Today is not in the current week view
};

/**
 * Calculate position starting from today's column (for overdue containers)
 */
export const calculatePositionFromToday = (
  weekStart: Date,
  minWidthColumns: number = 2
): { leftPercent: number; widthPercent: number } => {
  const todayColumnIndex = findTodayColumnIndex(weekStart);
  
  // If today is not in the current week, don't show
  if (todayColumnIndex === -1) {
    return { leftPercent: 0, widthPercent: 0 };
  }
  
  // FORCE SHOW when today is first column (index 0)
  if (todayColumnIndex === 0) {
    return { leftPercent: 0, widthPercent: 60 }; // Increased width for better visibility
  }
  
  const allDates = generateWorkDates(weekStart);
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Calculate position manually to ensure proper handling when today is first column
  let leftPixels = 0;
  let spannedPixels = 0;
  
  // Calculate column structure
  const weekendCount = allDates.filter(date => isWeekendDay(date)).length;
  const flexCount = allDates.length - weekendCount;
  const assumedContainerWidth = 1000;
  const totalWeekendWidth = weekendCount * 48;
  const totalFlexWidth = assumedContainerWidth - totalWeekendWidth;
  const flexColumnWidth = flexCount > 0 ? totalFlexWidth / flexCount : 0;
  
  // Calculate left position (pixels before today's column)
  for (let i = 0; i < todayColumnIndex; i++) {
    if (isWeekendDay(allDates[i])) {
      leftPixels += 48;
    } else {
      leftPixels += flexColumnWidth;
    }
  }
  
  // Calculate spanned width (from today to end of week)
  for (let i = todayColumnIndex; i < allDates.length; i++) {
    if (isWeekendDay(allDates[i])) {
      spannedPixels += 48;
    } else {
      spannedPixels += flexColumnWidth;
    }
  }
  
  // Ensure minimum width
  const minPixels = flexColumnWidth * minWidthColumns;
  spannedPixels = Math.max(spannedPixels, minPixels);
  
  // Convert to percentages
  const leftPercent = (leftPixels / assumedContainerWidth) * 100;
  const widthPercent = (spannedPixels / assumedContainerWidth) * 100;
  

  
  return {
    leftPercent: Math.max(0, leftPercent),
    widthPercent: Math.max(20, widthPercent) // Ensure at least 20% width
  };
};
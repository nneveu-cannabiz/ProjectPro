/**
 * Check if a project is visible in the current week view
 */
export const isProjectVisibleInWeek = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): boolean => {
  // For projects with no end date, only check if start is after the week end
  if (hasNoEndDate) {
    return projectStart <= weekEnd;
  }
  
  // Check if project overlaps with current week view at all
  return !(projectEnd < weekStart || projectStart > weekEnd);
};

/**
 * Determine if project extends beyond the current week view
 */
export const getProjectExtensions = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): { startsBeforeWeek: boolean; endsAfterWeek: boolean } => {
  const startsBeforeWeek = projectStart < weekStart;
  const endsAfterWeek = hasNoEndDate ? true : projectEnd > weekEnd;
  
  return { startsBeforeWeek, endsAfterWeek };
};

/**
 * Calculate the visual boundaries for a project bar within the week view
 */
export const calculateVisualBoundaries = (
  projectStart: Date,
  projectEnd: Date,
  weekStart: Date,
  weekEnd: Date,
  hasNoEndDate: boolean = false
): { visualStartDate: Date; visualEndDate: Date } => {
  const { startsBeforeWeek, endsAfterWeek } = getProjectExtensions(
    projectStart,
    projectEnd,
    weekStart,
    weekEnd,
    hasNoEndDate
  );
  
  const visualStartDate = startsBeforeWeek ? weekStart : projectStart;
  const visualEndDate = hasNoEndDate ? weekEnd : (endsAfterWeek ? weekEnd : projectEnd);
  
  return { visualStartDate, visualEndDate };
};

// calculateRemainingDays moved to dateUtils.ts where it belongs


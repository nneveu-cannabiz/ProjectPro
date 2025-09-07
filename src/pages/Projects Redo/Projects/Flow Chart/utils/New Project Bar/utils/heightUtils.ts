import { Task } from '../../../../../../../types';

// Constants for height calculations
export const TASK_BAR_HEIGHT = 32;
export const TASK_BAR_SPACING = 4;
export const PROJECT_HEADER_HEIGHT = 36;
export const PROJECT_PADDING = 4;
export const PROJECT_BORDER = 2;

/**
 * Calculate the height needed for a task container based on visible tasks
 */
export const calculateTaskContainerHeight = (visibleTasks: Task[]): number => {
  if (!visibleTasks || visibleTasks.length === 0) {
    return 0; // No task container needed - return 0!
  }
  
  const taskCount = visibleTasks.length;
  const totalTaskHeight = taskCount * TASK_BAR_HEIGHT;
  const totalSpacing = Math.max(0, taskCount - 1) * TASK_BAR_SPACING;
  const containerPadding = 4; // Minimal padding for task container
  
  return totalTaskHeight + totalSpacing + containerPadding;
};

/**
 * Calculate the total height of a project bar including all components
 * STRICTLY based on visible tasks only - no minimum height!
 */
export const calculateProjectBarHeight = (visibleTasks: Task[]): number => {
  const headerHeight = PROJECT_HEADER_HEIGHT;
  const taskContainerHeight = calculateTaskContainerHeight(visibleTasks);
  const padding = PROJECT_PADDING * 2; // Top and bottom padding
  const border = PROJECT_BORDER * 2; // Top and bottom border
  
  // NO MINIMUM HEIGHT - wrap exactly around content
  return headerHeight + taskContainerHeight + padding + border;
};

// Project stacking functions have been moved to projectStacking.ts
// This file now only contains basic height calculations for individual components


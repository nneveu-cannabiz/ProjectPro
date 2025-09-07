import { Task } from '../../../../../../../types';

/**
 * Check if a task is visible in the current week view
 * This includes handling of overdue tasks and date-less tasks
 */
export const isTaskVisibleInWeek = (
  task: Task,
  weekStart: Date,
  weekEnd: Date,
  projectStart: Date,
  projectEnd: Date
): boolean => {
  // Hide completed tasks from the flow chart display
  if (task.status === 'done') {
    return false;
  }
  
  const taskStartDate = task.startDate ? new Date(task.startDate) : projectStart;
  const originalTaskEndDate = task.endDate ? new Date(task.endDate) : projectEnd;
  const taskHasNoDates = !task.startDate && !task.endDate;
  
  // For tasks without dates, they should be visible throughout the entire project duration
  if (taskHasNoDates) {
    return true;
  }
  
  // Check if task is overdue
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue = task.endDate && 
    new Date(task.endDate).getTime() < todayNormalized.getTime();
  
  if (isOverdue) {
    // Show overdue task if today is within the current week OR if the original task overlaps
    // Normalize all dates to avoid timezone issues
    const weekStartNormalized = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const weekEndNormalized = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
    
    const todayInWeek = todayNormalized.getTime() >= weekStartNormalized.getTime() && 
                        todayNormalized.getTime() <= weekEndNormalized.getTime();
    const originalTaskOverlaps = !(originalTaskEndDate < weekStart || taskStartDate > weekEnd);
    
    return todayInWeek || originalTaskOverlaps;
  } else {
    // Regular visibility check for non-overdue tasks
    return !(originalTaskEndDate < weekStart || taskStartDate > weekEnd);
  }
};

/**
 * Filter tasks to only those visible in the current week
 */
export const getVisibleTasks = (
  tasks: Task[],
  weekStart: Date,
  weekEnd: Date,
  projectStart: Date,
  projectEnd: Date
): Task[] => {
  return tasks.filter(task => 
    isTaskVisibleInWeek(task, weekStart, weekEnd, projectStart, projectEnd)
  );
};

/**
 * Separate tasks into overdue and regular tasks
 */
export const separateOverdueTasks = (tasks: Task[]): { overdueTasks: Task[]; regularTasks: Task[] } => {
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const overdueTasks: Task[] = [];
  const regularTasks: Task[] = [];
  
  tasks.forEach(task => {
    if (task.status === 'done') {
      // Skip done tasks
      return;
    }
    
    const isOverdue = task.endDate && 
      new Date(task.endDate).getTime() < todayNormalized.getTime();
    
    if (isOverdue) {
      overdueTasks.push(task);
    } else {
      regularTasks.push(task);
    }
  });
  
  return { overdueTasks, regularTasks };
};


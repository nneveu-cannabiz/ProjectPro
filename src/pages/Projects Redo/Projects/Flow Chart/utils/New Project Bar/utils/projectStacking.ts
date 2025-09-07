import { Task } from '../../../../../../../types';

// Temporary inline constants and functions to avoid import issues
const TASK_BAR_HEIGHT = 32;
const TASK_BAR_SPACING = 2; // Reduced spacing between tasks
const PROJECT_HEADER_HEIGHT = 36;
const PROJECT_PADDING = 2; // Reduced padding around projects
const PROJECT_BORDER = 2;

const isTaskVisibleInWeek = (
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

const getVisibleTasks = (
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

const calculateTaskContainerHeight = (visibleTasks: Task[]): number => {
  if (!visibleTasks || visibleTasks.length === 0) {
    return 0; // No task container needed - return 0!
  }
  
  const taskCount = visibleTasks.length;
  const totalTaskHeight = taskCount * TASK_BAR_HEIGHT;
  const totalSpacing = Math.max(0, taskCount - 1) * TASK_BAR_SPACING;
  const containerPadding = 2; // Ultra minimal padding for task container
  
  return totalTaskHeight + totalSpacing + containerPadding;
};

const calculateProjectBarHeight = (visibleTasks: Task[]): number => {
  const headerHeight = PROJECT_HEADER_HEIGHT;
  const taskContainerHeight = calculateTaskContainerHeight(visibleTasks);
  const padding = PROJECT_PADDING * 2; // Top and bottom padding
  const border = PROJECT_BORDER * 2; // Top and bottom border
  
  // NO MINIMUM HEIGHT - wrap exactly around content
  return headerHeight + taskContainerHeight + padding + border;
};

const isProjectVisibleInWeek = (
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

export interface FlowProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  deadline?: Date;
  progress: number;
  assigneeId?: string;
  multiAssigneeIds?: string[];
  tasks: Task[];
}

export interface StackedProject {
  project: FlowProject;
  stackLevel: number;
  visibleTasks: Task[];
  calculatedHeight: number;
  topPosition: number;
}

export interface ProjectStackingResult {
  stackedProjects: StackedProject[];
  totalRowHeight: number;
}

/**
 * Calculate project stacking for a user row with precise positioning
 * Handles up to 10 projects per user
 * Projects and tasks are already filtered by user in getUserProjects()
 */
export const calculateProjectStacking = (
  projects: FlowProject[],
  weekStart: Date,
  weekEnd: Date,
  userRowStartPosition: number = 0 // Start position within UserRow (0 = top of row)
): ProjectStackingResult => {
  const MAX_PROJECTS_PER_USER = 10;
  const PROJECT_GAP = 1; // Ultra minimal gap between projects
  
  // Limit to 10 projects max
  const limitedProjects = projects.slice(0, MAX_PROJECTS_PER_USER);
  
  const stackedProjects: StackedProject[] = [];
  let currentTopPosition = userRowStartPosition; // Start immediately at the top of UserRow
  
  let stackLevel = 0;
  
  limitedProjects.forEach((project) => {
    // First check: Is the project itself visible in the current week?
    const hasNoEndDate = !project.endDate;
    const isProjectVisible = isProjectVisibleInWeek(
      project.startDate,
      project.endDate,
      weekStart,
      weekEnd,
      hasNoEndDate
    );
    
    if (!isProjectVisible) {
      console.log(`[ProjectStacking] Skipping "${project.name}" - project not visible in current week`);
      return; // Skip projects that don't overlap with the current week at all
    }
    
    // Second check: Calculate visible tasks for this project in the current week
    // (Tasks are already filtered by user in ProjectUserWeekChart.getUserProjects)
    const visibleTasks = getVisibleTasks(
      project.tasks,
      weekStart,
      weekEnd,
      project.startDate,
      project.endDate
    );
    
    // ULTRA STRICT: Only include projects that have visible tasks in this exact week
    // Both conditions must be met: project visible AND has visible tasks
    if (visibleTasks.length === 0) {
      console.log(`[ProjectStacking] Skipping "${project.name}" - no visible tasks (${project.tasks.length} total tasks)`);
      return; // Skip projects with no visible tasks - they get ZERO height
    }
    
    console.log(`[ProjectStacking] Including "${project.name}" - ${visibleTasks.length} visible tasks out of ${project.tasks.length} total`);
    
    // Calculate the exact height this project will need based on ONLY visible tasks
    const calculatedHeight = calculateProjectBarHeight(visibleTasks);
    
    // Create stacked project with precise positioning
    const stackedProject: StackedProject = {
      project: {
        ...project,
        tasks: visibleTasks // Replace with only visible tasks
      },
      stackLevel: stackLevel,
      visibleTasks,
      calculatedHeight,
      topPosition: currentTopPosition
    };
    
    stackedProjects.push(stackedProject);
    
    // Update position for next project
    currentTopPosition += calculatedHeight + PROJECT_GAP;
    stackLevel++;
  });
  
  // Calculate total row height
  // If no projects with visible tasks, use MINIMAL height
  const totalRowHeight = stackedProjects.length === 0 
    ? 4 // ULTRA MINIMAL: just 4px for empty row
    : currentTopPosition - PROJECT_GAP + 1; // Remove last gap, add tiny bottom margin
  
  return {
    stackedProjects,
    totalRowHeight
  };
};

// getProjectPositionsMap removed - positions are now directly available in StackedProject.topPosition

/**
 * Debug logging for project stacking
 */
export const debugProjectStacking = (result: ProjectStackingResult, originalProjectCount: number = 0): void => {
  console.log('=== PROJECT STACKING SUMMARY ===');
  console.log(`📊 Original projects: ${originalProjectCount}`);
  console.log(`✅ Included projects: ${result.stackedProjects.length}`);
  console.log(`❌ Filtered out: ${originalProjectCount - result.stackedProjects.length}`);
  console.log(`📏 Total row height: ${result.totalRowHeight}px`);
  
  if (result.stackedProjects.length > 0) {
    console.log('📋 Included projects:');
    result.stackedProjects.forEach(sp => {
      console.log(`  • "${sp.project.name}": ${sp.visibleTasks.length} tasks, ${sp.calculatedHeight}px height, top: ${sp.topPosition}px`);
    });
  } else {
    console.log('🚫 No projects included - filtered out due to:');
    console.log('   • Project not visible in current week, OR');
    console.log('   • Project has no visible tasks in current week');
  }
  console.log('================================');
};

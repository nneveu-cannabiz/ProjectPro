import { Task } from '../../../../../types';

// Calculate dynamic height for project bars based on task content
// Now accepts the actual visible tasks for accurate height calculation
export const calculateDynamicHeight = (visibleTasks: Task[], baseHeight: number = 65, projectAssigneeId?: string): number => {
  const projectNameHeight = 40; // Height for project name + progress (increased)
  const projectInternalPadding = 16; // ProjectBar internal padding: 8px top + 8px bottom
  const projectBorderPadding = 4; // Border width: 2px top + 2px bottom
  
  if (!visibleTasks || visibleTasks.length === 0) {
    // Compact layout for projects without visible tasks - dates are moved up to middle section
    const compactMiddleSectionHeight = 20; // Reduced height for compact date display
    const minContentHeight = projectNameHeight + compactMiddleSectionHeight + projectInternalPadding + projectBorderPadding;
    return Math.max(baseHeight, minContentHeight);
  }
  
  // Normal layout with tasks
  const taskCount = visibleTasks.length; // Only count visible tasks
  const taskBarHeight = 32; // Height of each task bar (updated to match taskbar.tsx)
  const taskBarMargin = 3; // Margin between task bars (updated to match taskbar.tsx)
  
  // Check if any tasks have different assignees (which adds extra height for user avatars)
  const tasksWithDifferentAssignees = visibleTasks.filter(task => 
    task.assigneeId && task.assigneeId !== projectAssigneeId
  );
  const hasTaskAssigneeIcons = tasksWithDifferentAssignees.length > 0;
  
  // Add extra height for task assignee icons (they add visual height to task bars)
  const taskAssigneeIconHeight = hasTaskAssigneeIcons ? 4 : 0; // Extra height per task with different assignee
  const totalTaskAssigneeHeight = tasksWithDifferentAssignees.length * taskAssigneeIconHeight;
  
  const taskSectionHeight = Math.max(60, taskCount * (taskBarHeight + taskBarMargin) + 12 + totalTaskAssigneeHeight); // Task area height + buffer + assignee icons
  const projectDatesHeight = 20; // Height for start/end dates section
  const taskIndicatorsHeight = 24; // Height for previous/upcoming task indicators (moved to bottom)
  const minContentHeight = projectNameHeight + taskSectionHeight + projectDatesHeight + taskIndicatorsHeight + projectInternalPadding + projectBorderPadding;
  
  return Math.max(baseHeight, minContentHeight);
};

// Helper function to check if a task is visible in current week (copied from ProjectBar)
// Now includes assignee filtering for overdue tasks
const isTaskVisibleInWeek = (task: any, weekStart: Date, weekEnd: Date, projectStart: Date, projectEnd: Date) => {
  // Hide Done tasks from the flow chart display - they should not be counted in height calculations
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
  const isOverdue = task.status !== 'done' && task.endDate && 
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

// Calculate the required height for a row based on stacked projects and their tasks
// Now properly handles filtered tasks per user AND week visibility AND overdue task assignee filtering
export const calculateRowHeight = (_projects: any[], weekStart: Date, weekEnd: Date, stackedProjects: any[], baseProjectHeight: number = 48, stackedTasks: any[] = []): number => {
  let maxHeight = 80; // Reduced base minimum height for tighter layout
  
  // Calculate height for stacked projects - use EXACT same logic as calculateProjectPositions
  if (stackedProjects.length > 0) {
    const topMargin = 4; // Minimal margin from top of row for new layout
    const projectGap = 20; // Minimum gap between projects
    
    // Sort by stack level to calculate cumulative heights
    const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
    let totalHeight = topMargin;
    
    sortedProjects.forEach((stackedProject, index) => {
      // Use the filtered tasks that are already assigned to this stacked project
      // But also filter them by week visibility (same logic as ProjectBar and calculateProjectPositions)
      const userFilteredTasks = stackedProject.project.tasks || [];
      const weekVisibleTasks = userFilteredTasks.filter((task: any) => 
        isTaskVisibleInWeek(task, weekStart, weekEnd, stackedProject.project.startDate, stackedProject.project.endDate)
      );
      
      const baseDynamicHeight = calculateDynamicHeight(weekVisibleTasks, baseProjectHeight, stackedProject.project.assigneeId);
      const projectHeight = Math.max(baseDynamicHeight, 65); // Reduced from 80 to 65 for tighter spacing
      
      // Add project height
      totalHeight += projectHeight;
      
      // Add gap after project (except for the last one) - SAME as calculateProjectPositions
      if (index < sortedProjects.length - 1) {
        totalHeight += projectGap;
      }
    });
    
    // Find the bottom of the last project to determine exact row height needed
    // Add a small buffer for the last project (but much smaller than before)
    totalHeight += 8; // Small buffer instead of large bottomMargin
    
    maxHeight = Math.max(maxHeight, totalHeight);
  }
  
  // Calculate height for standalone tasks (they stack AFTER projects)
  if (stackedTasks.length > 0) {
    const taskBarHeight = 48; // Height of each standalone task bar
    const taskBarSpacing = 4; // Space between task bars
    const taskGap = 20; // Gap between tasks and projects
    
    // Find the highest stack level among tasks
    const maxTaskStackLevel = Math.max(...stackedTasks.map(st => st.stackLevel));
    
    // Calculate total height needed for all stacked tasks
    const totalTaskHeight = (maxTaskStackLevel + 1) * (taskBarHeight + taskBarSpacing) + taskGap;
    
    // Add task height to the existing height (projects + tasks stack vertically)
    // Only add if we have projects, otherwise use the task height as base
    if (stackedProjects.length > 0) {
      maxHeight += totalTaskHeight;
    } else {
      maxHeight = Math.max(maxHeight, totalTaskHeight + 32); // 32px for top/bottom margins
    }
  }
  
  return maxHeight;
};

// Calculate the top positions for stacked projects to prevent overlaps
// Now uses filtered tasks for accurate positioning AND week visibility AND overdue assignee filtering
export const calculateProjectPositions = (stackedProjects: any[], weekStart: Date, weekEnd: Date, baseProjectHeight: number = 48): Map<number, number> => {
  const positions = new Map<number, number>();
  
  if (stackedProjects.length === 0) return positions;
  
  const topMargin = 4; // Minimal margin from top of row for new layout
  const projectGap = 20; // Minimum gap between projects
  
  // Sort by stack level to calculate positions sequentially
  const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
  let currentTop = topMargin;
  
  sortedProjects.forEach((stackedProject) => {
    // Use the filtered tasks that are already assigned to this stacked project
    // But also filter them by week visibility (same logic as ProjectBar)
    const userFilteredTasks = stackedProject.project.tasks || [];
    const weekVisibleTasks = userFilteredTasks.filter((task: any) => 
      isTaskVisibleInWeek(task, weekStart, weekEnd, stackedProject.project.startDate, stackedProject.project.endDate)
    );
    
    const baseDynamicHeight = calculateDynamicHeight(weekVisibleTasks, baseProjectHeight, stackedProject.project.assigneeId);
    const projectHeight = Math.max(baseDynamicHeight, 65); // Reduced from 80 to 65 for tighter spacing
    
    // Set position for this stack level
    positions.set(stackedProject.stackLevel, currentTop);
    
    // Update position for next project (add project height + gap)
    currentTop += projectHeight + projectGap;
  });
  
  return positions;
};

// Calculate the top positions for stacked standalone tasks (positioned after projects)
export const calculateTaskPositions = (stackedProjects: any[], stackedTasks: any[], weekStart: Date, weekEnd: Date, baseProjectHeight: number = 48): Map<number, number> => {
  const positions = new Map<number, number>();
  
  if (stackedTasks.length === 0) return positions;
  
  // Calculate where projects end
  let projectsEndHeight = 4; // Minimal top margin for new layout
  
  if (stackedProjects.length > 0) {
    const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
    sortedProjects.forEach((stackedProject, index) => {
      // Use the filtered tasks that are already assigned to this stacked project
      // But also filter them by week visibility AND overdue assignee filtering (same logic as ProjectBar)
      const userFilteredTasks = stackedProject.project.tasks || [];

      const weekVisibleTasks = userFilteredTasks.filter((task: any) => 
        isTaskVisibleInWeek(task, weekStart, weekEnd, stackedProject.project.startDate, stackedProject.project.endDate)
      );
      
      const baseDynamicHeight = calculateDynamicHeight(weekVisibleTasks, baseProjectHeight);
      const projectHeight = Math.max(baseDynamicHeight, 65); // Reduced from 80 to 65 for tighter spacing
      
      projectsEndHeight += projectHeight;
      
      // Add gap after project (except for the last one)
      if (index < sortedProjects.length - 1) {
        projectsEndHeight += 20; // Project gap
      }
    });
    
    // Add bottom margin after all projects
    projectsEndHeight += 16;
  }
  
  // Position tasks after projects with a gap
  const taskGap = 20;
  const taskBarHeight = 48;
  const taskBarSpacing = 4;
  let currentTaskTop = projectsEndHeight + taskGap;
  
  // Sort tasks by stack level
  const sortedTasks = [...stackedTasks].sort((a, b) => a.stackLevel - b.stackLevel);
  
  sortedTasks.forEach((stackedTask) => {
    positions.set(stackedTask.stackLevel, currentTaskTop);
    currentTaskTop += taskBarHeight + taskBarSpacing;
  });
  
  return positions;
};
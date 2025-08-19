import { Task } from '../../../../../types';

// Calculate dynamic height for project bars based on task content
export const calculateDynamicHeight = (tasks: Task[], baseHeight: number = 80): number => {
  if (!tasks || tasks.length === 0) {
    return baseHeight; // Minimum height with no tasks
  }
  
  // Calculate height based on TaskBar layout - show ALL tasks, not just 3
  const taskCount = tasks.length; // Show all tasks
  const taskBarHeight = 32; // Height of each task bar (updated to match taskbar.tsx)
  const taskBarMargin = 3; // Margin between task bars (updated to match taskbar.tsx)
  const taskSectionHeight = Math.max(60, taskCount * (taskBarHeight + taskBarMargin) + 12); // Task area height + buffer
  const projectNameHeight = 40; // Height for project name + progress (increased)
  const projectDatesHeight = 20; // Height for start/end dates section
  const projectPadding = 20; // Vertical padding for project content (increased)
  const minContentHeight = projectNameHeight + taskSectionHeight + projectDatesHeight + projectPadding;
  
  return Math.max(baseHeight, minContentHeight + 20); // Overall padding
};

// Calculate the required height for a row based on stacked projects and their tasks
export const calculateRowHeight = (_projects: any[], _weekStart: Date, _weekEnd: Date, stackedProjects: any[], baseProjectHeight: number = 48, stackedTasks: any[] = []): number => {
  let maxHeight = 96; // Base minimum height
  
  // Calculate height for stacked projects
  if (stackedProjects.length > 0) {
    const topMargin = 16; // Margin from top of row
    const projectGap = 20; // Minimum gap between projects
    
    // Sort by stack level to calculate cumulative heights
    const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
    let cumulativeHeight = topMargin;
    
    sortedProjects.forEach((stackedProject) => {
      const projectTasks = stackedProject.project.tasks || [];
      const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
      // Apply a higher minimum height to ensure proper spacing (matching ProjectBar's actual needs)
      const projectHeight = Math.max(baseDynamicHeight, 80);
      
      // For stack level 0, start at top margin
      // For higher levels, start after the previous project plus gap
      if (stackedProject.stackLevel > 0) {
        cumulativeHeight += projectGap;
      }
      
      const stackedHeight = cumulativeHeight + projectHeight;
      maxHeight = Math.max(maxHeight, stackedHeight);
      
      // Update cumulative height for next project
      cumulativeHeight += projectHeight;
    });
  }
  
  // Calculate height for standalone tasks
  if (stackedTasks.length > 0) {
    const taskBarHeight = 48; // Height of each standalone task bar
    const taskBarSpacing = 4; // Space between task bars
    stackedTasks.forEach((stackedTask) => {
      // Start with margin (8px) for first task, then task height + spacing for each stack level
      const taskStackedHeight = 8 + stackedTask.stackLevel * (taskBarHeight + taskBarSpacing) + taskBarHeight;
      maxHeight = Math.max(maxHeight, taskStackedHeight);
    });
  }
  
  return maxHeight;
};

// Calculate the top positions for stacked projects to prevent overlaps
export const calculateProjectPositions = (stackedProjects: any[], baseProjectHeight: number = 48): Map<number, number> => {
  const positions = new Map<number, number>();
  
  if (stackedProjects.length === 0) return positions;
  
  const topMargin = 16; // Margin from top of row
  const projectGap = 20; // Minimum gap between projects
  
  // Sort by stack level to calculate positions sequentially
  const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
  let cumulativeHeight = topMargin;
  
  sortedProjects.forEach((stackedProject) => {
    const projectTasks = stackedProject.project.tasks || [];
    const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
    const projectHeight = Math.max(baseDynamicHeight, 80);
    
    // Set position for this stack level
    positions.set(stackedProject.stackLevel, cumulativeHeight);
    
    // Update cumulative height for next project
    cumulativeHeight += projectHeight + projectGap;
  });
  
  return positions;
};
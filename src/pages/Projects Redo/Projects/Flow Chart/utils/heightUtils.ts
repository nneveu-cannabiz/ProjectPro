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
    const bottomMargin = 16; // Margin at bottom of row
    
    // Sort by stack level to calculate cumulative heights
    const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
    let totalHeight = topMargin;
    
    sortedProjects.forEach((stackedProject, index) => {
      const projectTasks = stackedProject.project.tasks || [];
      const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
      // Apply a higher minimum height to ensure proper spacing (matching ProjectBar's actual needs)
      const projectHeight = Math.max(baseDynamicHeight, 80);
      
      // Add project height
      totalHeight += projectHeight;
      
      // Add gap after project (except for the last one)
      if (index < sortedProjects.length - 1) {
        totalHeight += projectGap;
      }
    });
    
    // Add bottom margin
    totalHeight += bottomMargin;
    
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
export const calculateProjectPositions = (stackedProjects: any[], baseProjectHeight: number = 48): Map<number, number> => {
  const positions = new Map<number, number>();
  
  if (stackedProjects.length === 0) return positions;
  
  const topMargin = 16; // Margin from top of row
  const projectGap = 20; // Minimum gap between projects
  
  // Sort by stack level to calculate positions sequentially
  const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
  let currentTop = topMargin;
  
  sortedProjects.forEach((stackedProject) => {
    const projectTasks = stackedProject.project.tasks || [];
    const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
    const projectHeight = Math.max(baseDynamicHeight, 80);
    
    // Set position for this stack level
    positions.set(stackedProject.stackLevel, currentTop);
    
    // Update position for next project (add project height + gap)
    currentTop += projectHeight + projectGap;
  });
  
  return positions;
};

// Calculate the top positions for stacked standalone tasks (positioned after projects)
export const calculateTaskPositions = (stackedProjects: any[], stackedTasks: any[], baseProjectHeight: number = 48): Map<number, number> => {
  const positions = new Map<number, number>();
  
  if (stackedTasks.length === 0) return positions;
  
  // Calculate where projects end
  let projectsEndHeight = 16; // Top margin
  
  if (stackedProjects.length > 0) {
    const sortedProjects = [...stackedProjects].sort((a, b) => a.stackLevel - b.stackLevel);
    sortedProjects.forEach((stackedProject, index) => {
      const projectTasks = stackedProject.project.tasks || [];
      const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
      const projectHeight = Math.max(baseDynamicHeight, 80);
      
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
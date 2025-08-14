import { Task } from '../../../../../types';

// Calculate dynamic height for project bars based on task content
export const calculateDynamicHeight = (tasks: Task[], baseHeight: number = 80): number => {
  if (!tasks || tasks.length === 0) {
    return baseHeight; // Minimum height with no tasks
  }
  
  // Calculate height based on TaskBar layout
  const taskCount = Math.min(tasks.length, 3); // Max 3 task bars shown
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
export const calculateRowHeight = (projects: any[], weekStart: Date, weekEnd: Date, stackedProjects: any[]): number => {
  if (stackedProjects.length === 0) {
    return 96; // Minimum height when no projects
  }
  
  // Calculate the maximum height needed across all stacked projects
  let maxHeight = 96; // Base minimum height
  
  stackedProjects.forEach((stackedProject) => {
    const projectTasks = stackedProject.project.tasks || [];
    const projectHeight = calculateDynamicHeight(projectTasks, 80);
    const stackedHeight = 8 + stackedProject.stackLevel * (projectHeight + 8) + projectHeight;
    maxHeight = Math.max(maxHeight, stackedHeight);
  });
  
  return maxHeight;
};
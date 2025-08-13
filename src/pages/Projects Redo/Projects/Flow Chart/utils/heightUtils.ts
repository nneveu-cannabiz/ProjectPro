import { Task } from '../../../../../types';

// Calculate dynamic height for project bars based on task content
export const calculateDynamicHeight = (tasks: Task[], baseHeight: number = 80): number => {
  if (!tasks || tasks.length === 0) {
    return baseHeight; // Minimum height with no tasks
  }
  
  // Calculate height based on TaskBar layout
  const taskCount = Math.min(tasks.length, 3); // Max 3 task bars shown
  const taskBarHeight = 24; // Height of each task bar
  const taskBarMargin = 2; // Margin between task bars
  const taskSectionHeight = Math.max(60, taskCount * (taskBarHeight + taskBarMargin)); // Task area height
  const projectNameHeight = 30; // Height for project name + progress
  const projectPadding = 16; // Vertical padding for project content
  const minContentHeight = projectNameHeight + taskSectionHeight + projectPadding;
  
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
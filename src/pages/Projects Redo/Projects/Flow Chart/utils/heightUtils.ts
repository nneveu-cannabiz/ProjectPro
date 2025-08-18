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
export const calculateRowHeight = (_projects: any[], _weekStart: Date, _weekEnd: Date, stackedProjects: any[], baseProjectHeight: number = 48): number => {
  if (stackedProjects.length === 0) {
    return 96; // Minimum height when no projects
  }
  
  // Calculate the maximum height needed across all stacked projects
  let maxHeight = 96; // Base minimum height
  
  stackedProjects.forEach((stackedProject) => {
    const projectTasks = stackedProject.project.tasks || [];
    const baseDynamicHeight = calculateDynamicHeight(projectTasks, baseProjectHeight);
    // Apply minimum height to ensure proper spacing without excessive gaps
    const projectHeight = Math.max(baseDynamicHeight, 65);
    // Start with margin (16px) for first project, then 65px spacing between projects
    const stackedHeight = 16 + stackedProject.stackLevel * (projectHeight + 65) + projectHeight;

    maxHeight = Math.max(maxHeight, stackedHeight);
  });
  
  return maxHeight;
};
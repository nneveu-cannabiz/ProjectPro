// Main export file for the New Project Bar system
export { default as ProjectBar } from './ProjectBarContainer';
export { default as ProjectBarContainer } from './ProjectBarContainer';
export { default as ProjectBarHeader } from './ProjectBarHeader';
export { default as TaskContainer } from './Task Section/TaskContainer';
export { default as TaskBar } from './Task Section/TaskBar';

// Export utility functions
// Temporarily disabled due to import issues: export * from './utils/heightUtils';
// Temporarily disabled due to import issues: export * from './utils/visibleTasks';
// Temporarily disabled due to import issues: export * from './utils/visibleProjects';
// Temporarily disabled due to import issues: export * from './utils/columnUtils';
// Temporarily disabled due to import issues: export * from './utils/dateUtils';
export * from './utils/projectStacking';
export * from './utils/userProjectFiltering';

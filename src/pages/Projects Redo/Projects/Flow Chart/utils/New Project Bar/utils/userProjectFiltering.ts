import { User, Task } from '../../../../../../../types';
import { FlowProject } from './projectStacking';

// Re-export FlowProject for convenience
export type { FlowProject } from './projectStacking';

/**
 * Filter and organize projects by user with proper task assignment logic
 */
export const getUserProjects = (
  user: User,
  allProjects: any[],
  allTasks: Task[]
): FlowProject[] => {
  const userProjects = allProjects.filter(project => {
    // Show project if either the project is assigned to user OR any task in project is assigned to user
    const projectAssignedToUser = project.assigneeId === user.id;
    const hasTasksForUser = allTasks.some(task => 
      task.projectId === project.id && task.assigneeId === user.id
    );
    
    const shouldShow = projectAssignedToUser || hasTasksForUser;
    
    if (shouldShow) {
      console.log(`User ${user.firstName} ${user.lastName} - Project ${project.name}:`, {
        projectAssignedToUser,
        hasTasksForUser,
        projectAssigneeId: project.assigneeId,
        userId: user.id,
        projectTasks: allTasks.filter(task => task.projectId === project.id).length
      });
    }
    
    return shouldShow;
  }).map(project => {
    // Filter tasks based on user's relationship to the project
    const isMainAssignee = project.assigneeId === user.id;
    const isAdditionalAssignee = (project.multiAssigneeIds || []).includes(user.id);
    
    let filteredTasks = allTasks.filter(task => task.projectId === project.id);
    
    if (isMainAssignee) {
      // Main assignee sees ALL tasks in the project
      filteredTasks = allTasks.filter(task => task.projectId === project.id);
    } else if (isAdditionalAssignee) {
      // Additional assignee sees ONLY tasks assigned to them
      filteredTasks = allTasks.filter(task => 
        task.projectId === project.id && task.assigneeId === user.id
      );
    } else {
      // User has tasks in project but is not main or additional assignee
      // Show only their specific tasks
      filteredTasks = allTasks.filter(task => 
        task.projectId === project.id && task.assigneeId === user.id
      );
    }
    
    // Return project with filtered tasks for this user
    return {
      ...project,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      deadline: project.deadline ? new Date(project.deadline) : undefined,
      tasks: filteredTasks || []
    };
  });

  console.log(`getUserProjects for ${user.firstName} ${user.lastName}:`, {
    totalProjects: allProjects.length,
    userProjects: userProjects.length,
    userProjectNames: userProjects.map(p => p.name)
  });

  return userProjects;
};

/**
 * Debug logging for user project filtering
 */
export const debugUserProjects = (user: User, projects: FlowProject[]): void => {
  console.log(`User ${user.firstName} ${user.lastName} Projects:`, {
    totalProjects: projects.length,
    projectDetails: projects.map(p => ({
      name: p.name,
      taskCount: p.tasks.length,
      isMainAssignee: p.assigneeId === user.id,
      isAdditionalAssignee: (p.multiAssigneeIds || []).includes(user.id)
    }))
  });
};

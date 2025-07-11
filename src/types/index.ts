// Define types for our application
export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'todo' | 'in-progress' | 'done';
  projectType: 'Active' | 'Upcoming' | 'Future' | 'On Hold';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  taskType: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string; // Optional assignee for the task
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  name: string;
  description: string;
  taskType: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string; // Optional assignee for the subtask
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface TaskType {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileColor?: string;
}

export interface Update {
  id: string;
  message: string;
  userId: string;
  createdAt: string;
  entityType: 'project' | 'task' | 'subtask';
  entityId: string;
}
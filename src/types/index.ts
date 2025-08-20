// Define types for our application
export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'todo' | 'in-progress' | 'done';
  projectType: 'Active' | 'Upcoming' | 'Future' | 'On Hold';
  assigneeId?: string; // Optional assignee for the project
  multiAssigneeIds?: string[]; // Multiple assignees for the project
  flowChart?: string; // Flow chart department assignment
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  tags?: string[];
  progress?: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  taskType: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string; // Optional assignee for the task
  flowChart?: string; // Flow chart department assignment
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low';
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  tags?: string[];
  progress?: number;
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
  startDate?: string;
  endDate?: string;
  deadline?: string;
  tags?: string[];
  progress?: number;
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
  department?: string | null;
  flowChart?: string | null;
}

export interface Update {
  id: string;
  message: string;
  userId: string;
  createdAt: string;
  entityType: 'project' | 'task' | 'subtask';
  entityId: string;
  isReadBy?: string[]; // Array of user IDs who have read this update
  commentTo?: string; // ID of the update this is a comment/reply to
  taggedUserIds?: string[]; // Array of user IDs tagged in this update
  isRequest?: {
    requestedUserId: string;
    deadline?: string;
    notes?: string;
    respondedAt?: string;
    responseUpdateId?: string;
  }; // Request information if this update is a request
}
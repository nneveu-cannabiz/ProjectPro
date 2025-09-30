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
  documents?: Array<{
    document_name: string;
    document_link: string;
    document_description: string;
  }>; // Array of project documents/resources
  ranking?: Record<string, number>; // JSONB column for page-specific rankings
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

export interface Hour {
  id: string;
  userId: string;
  taskId: string;
  hours: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  is_planning_hours?: boolean;
}

export interface PMASpending {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  category: 'software' | 'hardware' | 'services' | 'other';
  purchase_type: 'one_time' | 'recurring';
  amount: number;
  currency: string;
  billing_frequency?: 'monthly' | 'quarterly' | 'yearly' | 'weekly';
  next_billing_date?: string;
  vendor?: string;
  vendor_contact?: string;
  project_id?: string;
  added_by?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  notes?: string;
  attachment_url?: string;
  tags?: string[];
  is_essential: boolean;
}
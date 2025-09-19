import { brandTheme } from '../../../../../styles/brandTheme';
import { Task } from './types';

export const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return '#FF0000'; // Bright Red
    case 'high':
      return '#DC2626'; // Red
    case 'medium':
      return '#EAB308'; // Yellow
    case 'low':
      return '#16A34A'; // Green
    default:
      return brandTheme.text.muted;
  }
};

export const getPriorityBgColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return '#FECACA'; // Light Red background for Bright Red text
    case 'high':
      return '#FEE2E2'; // Light Red background for Red text
    case 'medium':
      return '#FEF3C7'; // Light Yellow background for Yellow text
    case 'low':
      return '#DCFCE7'; // Light Green background for Green text
    default:
      return brandTheme.background.secondary;
  }
};

export const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
      return brandTheme.status.success;
    case 'in-progress':
      return brandTheme.status.inProgress;
    case 'todo':
      return brandTheme.text.muted;
    default:
      return brandTheme.text.muted;
  }
};

export const getStatusBgColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
      return brandTheme.status.successLight;
    case 'in-progress':
      return brandTheme.status.inProgressLight;
    case 'todo':
      return brandTheme.gray[100];
    default:
      return brandTheme.background.secondary;
  }
};

export const getStatusOrder = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'todo': return 1;
    case 'in-progress': return 2;
    case 'done': return 3;
    default: return 0; // No status goes to top
  }
};

export const sortTasks = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    const aOrder = getStatusOrder(a.status);
    const bOrder = getStatusOrder(b.status);
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    return a.name.localeCompare(b.name); // alphabetical by name within same status
  });
};

export const formatStatusDisplay = (status?: string) => {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'todo') return 'To Do';
  return status?.charAt(0).toUpperCase() + status?.slice(1);
};

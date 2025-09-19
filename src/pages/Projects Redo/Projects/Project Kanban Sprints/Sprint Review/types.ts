export interface Task {
  id: string;
  name: string;
  priority?: string;
  assignee_id?: string;
  project_id: string;
  status?: string;
  hoursSpent: number;
  hoursPlanned: number;
  assigneeName?: string;
  isSelected?: boolean;
}

export interface TaskHours {
  task_id: string;
  total_actual_hours: number;
  total_planned_hours: number;
}

export interface EditingCell {
  taskId: string;
  field: string;
}

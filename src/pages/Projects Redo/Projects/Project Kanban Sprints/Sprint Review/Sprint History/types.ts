export interface SprintGroup {
  id: string;
  name: string;
  sprint_type: string;
  created_at: string;
  sprint_id: string | null;
  start_date: string | null;
  end_date: string | null;
  selected_task_ids: string[];
  ranking?: {
    [key: string]: number; // e.g., "Sprint 000": 1, "Sprint 001": 2
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface HistoricalSprint {
  sprint_id: string;
  groups: SprintGroup[];
  start_date: string | null;
  end_date: string | null;
}

export interface TaskWithSprintInfo {
  id: string;
  name: string;
  status: string;
  description?: string;
  priority?: string;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  sprintGroupId: string;
}

export interface SprintProgress {
  daysCompleted: number;
  daysRemaining: number;
  totalDays: number;
}

export interface StoryPoints {
  total: number;
  completed: number;
}


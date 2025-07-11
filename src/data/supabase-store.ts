import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { Project, Task, SubTask, Category, TaskType, User, Update } from '../types';

// Helper function to handle Supabase errors with timeouts
const safeSupabaseCall = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  defaultValue: T
): Promise<T> => {
  try {
    // Set a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), 15000);
    });
    
    // Race the operation against the timeout
    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return defaultValue;
  }
};

// Project operations
export const fetchProjects = async (): Promise<Project[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*');
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category,
        status: p.status,
        projectType: p.project_type || 'Active',
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    },
    'Error fetching projects',
    []
  );
};

export const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('PMA_Projects')
    .insert({
      id,
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      project_type: project.projectType,
      created_at: timestamp,
      updated_at: timestamp
    });
  
  if (error) {
    console.error('Error adding project:', error);
    throw error;
  }
  
  return id;
};

export const updateProject = async (project: Project): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Projects')
    .update({
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      project_type: project.projectType,
      updated_at: timestamp
    })
    .eq('id', project.id);
  
  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  // Delete the project - all related tasks, subtasks, and updates will be deleted by cascade
  const { error } = await supabase
    .from('PMA_Projects')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Task operations
export const fetchTasks = async (): Promise<Task[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Tasks')
        .select('*');
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data.map(t => ({
        id: t.id,
        projectId: t.project_id,
        name: t.name,
        description: t.description || '',
        taskType: t.task_type,
        status: t.status,
        assigneeId: t.assignee_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));
    },
    'Error fetching tasks',
    []
  );
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('PMA_Tasks')
    .insert({
      id,
      project_id: task.projectId,
      name: task.name,
      description: task.description,
      task_type: task.taskType,
      status: task.status,
      assignee_id: task.assigneeId,
      created_at: timestamp,
      updated_at: timestamp
    });
  
  if (error) {
    console.error('Error adding task:', error);
    throw error;
  }
  
  return id;
};

export const updateTask = async (task: Task): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Tasks')
    .update({
      project_id: task.projectId,
      name: task.name,
      description: task.description,
      task_type: task.taskType,
      status: task.status,
      assignee_id: task.assigneeId,
      updated_at: timestamp
    })
    .eq('id', task.id);
  
  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  // Delete the task - subtasks and updates will be deleted by cascade
  const { error } = await supabase
    .from('PMA_Tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// SubTask operations
export const fetchSubTasks = async (): Promise<SubTask[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_SubTasks')
        .select('*');
      
      if (error) {
        console.error('Error fetching subtasks:', error);
        throw error;
      }
      
      return data.map(st => ({
        id: st.id,
        taskId: st.task_id,
        name: st.name,
        description: st.description || '',
        taskType: st.task_type,
        status: st.status,
        assigneeId: st.assignee_id,
        createdAt: st.created_at,
        updatedAt: st.updated_at
      }));
    },
    'Error fetching subtasks',
    []
  );
};

export const addSubTask = async (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('PMA_SubTasks')
    .insert({
      id,
      task_id: subTask.taskId,
      name: subTask.name,
      description: subTask.description,
      task_type: subTask.taskType,
      status: subTask.status,
      assignee_id: subTask.assigneeId,
      created_at: timestamp,
      updated_at: timestamp
    });
  
  if (error) {
    console.error('Error adding subtask:', error);
    throw error;
  }
  
  return id;
};

export const updateSubTask = async (subTask: SubTask): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_SubTasks')
    .update({
      task_id: subTask.taskId,
      name: subTask.name,
      description: subTask.description,
      task_type: subTask.taskType,
      status: subTask.status,
      assignee_id: subTask.assigneeId,
      updated_at: timestamp
    })
    .eq('id', subTask.id);
  
  if (error) {
    console.error('Error updating subtask:', error);
    throw error;
  }
};

export const deleteSubTask = async (id: string): Promise<void> => {
  // Delete the subtask - updates will be deleted by cascade
  const { error } = await supabase
    .from('PMA_SubTasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting subtask:', error);
    throw error;
  }
};

// Category operations
export const fetchCategories = async (): Promise<Category[]> => {
  return safeSupabaseCall(
    async () => {
      // This might be a custom table or view you would need to create
      // For now, we'll just return a default set
      return [];
    },
    'Error fetching categories',
    []
  );
};

export const addCategory = async (name: string): Promise<string> => {
  // This would need to be implemented if you have a categories table
  const id = uuidv4();
  return id;
};

export const updateCategory = async (category: Category): Promise<void> => {
  // This would need to be implemented if you have a categories table
};

export const deleteCategory = async (id: string): Promise<void> => {
  // This would need to be implemented if you have a categories table
};

// TaskType operations
export const fetchTaskTypes = async (): Promise<TaskType[]> => {
  return safeSupabaseCall(
    async () => {
      // This might be a custom table or view you would need to create
      // For now, we'll just return a default set
      return [];
    },
    'Error fetching task types',
    []
  );
};

export const addTaskType = async (name: string): Promise<string> => {
  // This would need to be implemented if you have a task types table
  const id = uuidv4();
  return id;
};

export const updateTaskType = async (taskType: TaskType): Promise<void> => {
  // This would need to be implemented if you have a task types table
};

export const deleteTaskType = async (id: string): Promise<void> => {
  // This would need to be implemented if you have a task types table
};

// Update operations
export const fetchUpdates = async (): Promise<Update[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Updates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching updates:', error);
        throw error;
      }
      
      return data.map(u => ({
        id: u.id,
        message: u.message,
        userId: u.user_id,
        entityType: u.entity_type,
        entityId: u.entity_id,
        createdAt: u.created_at
      }));
    },
    'Error fetching updates',
    []
  );
};

export const addUpdate = async (update: Omit<Update, 'id' | 'createdAt'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('PMA_Updates')
    .insert({
      id,
      message: update.message,
      user_id: update.userId,
      entity_type: update.entityType,
      entity_id: update.entityId,
      created_at: timestamp
    });
  
  if (error) {
    console.error('Error adding update:', error);
    throw error;
  }
  
  return id;
};

// User operations
export const fetchUsers = async (): Promise<User[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      return data.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        profileColor: u.profile_color || '#2563eb'
      }));
    },
    'Error fetching users',
    []
  );
};
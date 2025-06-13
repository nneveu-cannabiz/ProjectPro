import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { Project, Task, SubTask, Category, TaskType, User, Update, Role, ManagerEmployee } from '../types';

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
        priority: p.priority || 'Medium',
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
      priority: project.priority || 'Medium',
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
      priority: project.priority,
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
        .select(`
          id,
          first_name,
          last_name,
          email,
          profile_color,
          role_id,
          manager_id,
          created_at,
          updated_at,
          role:role_id(
            id,
            name,
            description,
            permissions,
            is_system_role,
            created_at,
            updated_at
          )
        `);
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      return data.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        profileColor: u.profile_color || '#2563eb',
        roleId: u.role_id,
        managerId: u.manager_id,
        role: u.role ? {
          id: u.role.id,
          name: u.role.name,
          description: u.role.description,
          permissions: u.role.permissions || {},
          isSystemRole: u.role.is_system_role,
          createdAt: u.role.created_at,
          updatedAt: u.role.updated_at
        } : undefined
      }));
    },
    'Error fetching users',
    []
  );
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const updateData: any = {
    updated_at: timestamp
  };
  
  if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
  if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
  if (userData.profileColor !== undefined) updateData.profile_color = userData.profileColor;
  if (userData.roleId !== undefined) updateData.role_id = userData.roleId;
  if (userData.managerId !== undefined) updateData.manager_id = userData.managerId;
  
  const { error } = await supabase
    .from('PMA_Users')
    .update(updateData)
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Role operations
export const fetchRoles = async (): Promise<Role[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Roles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }
      
      return data.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions || {},
        isSystemRole: r.is_system_role,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    },
    'Error fetching roles',
    []
  );
};

export const addRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('PMA_Roles')
    .insert({
      id,
      name: role.name,
      description: role.description,
      permissions: role.permissions || {},
      is_system_role: role.isSystemRole,
      created_at: timestamp,
      updated_at: timestamp
    });
  
  if (error) {
    console.error('Error adding role:', error);
    throw error;
  }
  
  return id;
};

export const updateRole = async (role: Role): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Roles')
    .update({
      name: role.name,
      description: role.description,
      permissions: role.permissions || {},
      is_system_role: role.isSystemRole,
      updated_at: timestamp
    })
    .eq('id', role.id);
  
  if (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

export const deleteRole = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('PMA_Roles')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

// Manager-Employee operations
export const fetchManagerEmployees = async (): Promise<ManagerEmployee[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('Manager_Employees')
        .select('*');
      
      if (error) {
        console.error('Error fetching manager-employee relationships:', error);
        throw error;
      }
      
      return data.map(me => ({
        id: me.id,
        managerId: me.manager_id,
        employeeId: me.employee_id,
        assignedDate: me.assigned_date,
        createdAt: me.created_at,
        updatedAt: me.updated_at
      }));
    },
    'Error fetching manager-employee relationships',
    []
  );
};

export const assignEmployeeToManager = async (managerId: string, employeeId: string): Promise<string> => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  
  const { error } = await supabase
    .from('Manager_Employees')
    .insert({
      id,
      manager_id: managerId,
      employee_id: employeeId,
      assigned_date: timestamp,
      created_at: timestamp,
      updated_at: timestamp
    });
  
  if (error) {
    console.error('Error assigning employee to manager:', error);
    throw error;
  }
  
  return id;
};

export const removeEmployeeFromManager = async (managerId: string, employeeId: string): Promise<void> => {
  const { error } = await supabase
    .from('Manager_Employees')
    .delete()
    .eq('manager_id', managerId)
    .eq('employee_id', employeeId);
  
  if (error) {
    console.error('Error removing employee from manager:', error);
    throw error;
  }
};
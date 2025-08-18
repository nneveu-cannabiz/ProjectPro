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
        assigneeId: p.assignee_id,
        flowChart: p.flow_chart,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        startDate: p.start_date,
        endDate: p.end_date,
        deadline: p.deadline,
        tags: p.tags,
        progress: p.progress
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
      assignee_id: project.assigneeId,
      flow_chart: project.flowChart,
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
      assignee_id: project.assigneeId,
      flow_chart: project.flowChart,
      start_date: project.startDate,
      end_date: project.endDate,
      deadline: project.deadline,
      tags: project.tags,
      progress: project.progress,
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
        updatedAt: t.updated_at,
        startDate: t.start_date,
        endDate: t.end_date,
        deadline: t.deadline,
        tags: t.tags,
        progress: t.progress
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
      start_date: task.startDate,
      end_date: task.endDate,
      deadline: task.deadline,
      tags: task.tags,
      progress: task.progress,
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
        createdAt: u.created_at,
        isReadBy: u.is_read_by || [],
        commentTo: u.comment_to,
        taggedUserIds: u.tagged_user_id || [],
        isRequest: u.is_request
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
      created_at: timestamp,
      is_read_by: update.isReadBy || [],
      comment_to: update.commentTo,
      tagged_user_id: update.taggedUserIds || [],
      is_request: update.isRequest
    });
  
  if (error) {
    console.error('Error adding update:', error);
    throw error;
  }
  
  return id;
};

export const markUpdateAsRead = async (updateId: string, userId: string): Promise<void> => {
  const { data: currentUpdate, error: fetchError } = await supabase
    .from('PMA_Updates')
    .select('is_read_by')
    .eq('id', updateId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching update for read status:', fetchError);
    throw fetchError;
  }
  
  const currentReadBy = currentUpdate.is_read_by || [];
  let newReadBy;
  
  if (currentReadBy.includes(userId)) {
    // Remove user from read list (mark as unread)
    newReadBy = currentReadBy.filter((id: string) => id !== userId);
  } else {
    // Add user to read list (mark as read)
    newReadBy = [...currentReadBy, userId];
  }
  
  const { error } = await supabase
    .from('PMA_Updates')
    .update({ is_read_by: newReadBy })
    .eq('id', updateId);
  
  if (error) {
    console.error('Error updating read status:', error);
    throw error;
  }
};

export const updateRequestStatus = async (updateId: string, responseUpdateId: string): Promise<void> => {
  const { data: currentUpdate, error: fetchError } = await supabase
    .from('PMA_Updates')
    .select('is_request')
    .eq('id', updateId)
    .single();

  if (fetchError) {
    console.error('Error fetching update for request status:', fetchError);
    throw fetchError;
  }

  if (!currentUpdate.is_request) {
    throw new Error('Update is not a request');
  }

  const updatedRequest = {
    ...currentUpdate.is_request,
    respondedAt: new Date().toISOString(),
    responseUpdateId: responseUpdateId,
  };

  const { error } = await supabase
    .from('PMA_Updates')
    .update({ is_request: updatedRequest })
    .eq('id', updateId);

  if (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

export const deleteUpdate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('PMA_Updates')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting update:', error);
    throw error;
  }
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
        profileColor: u.profile_color || '#2563eb',
        department: u.department || null,
        flowChart: u.flow_chart || null
      }));
    },
    'Error fetching users',
    []
  );
};

export const fetchUsersByDepartment = async (department: string): Promise<User[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Users')
        .select('*')
        .eq('department', department);
      
      if (error) {
        console.error('Error fetching users by department:', error);
        throw error;
      }
      
      return data.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        profileColor: u.profile_color || '#2563eb',
        department: u.department || null,
        flowChart: u.flow_chart || null
      }));
    },
    'Error fetching users by department',
    []
  );
};

export const updateUserDepartment = async (userId: string, department: string): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Users')
    .update({
      department: department,
      updated_at: timestamp
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user department:', error);
    throw error;
  }
};

export const fetchProjectsForFlowChart = async (): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*')
        .is('flow_chart', null);
      
      if (error) {
        console.error('Error fetching projects for flow chart:', error);
        throw error;
      }
      
      return data;
    },
    'Error fetching projects for flow chart',
    []
  );
};

export const updateProjectFlowChart = async (projectId: string, flowChart: string): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Projects')
    .update({
      flow_chart: flowChart,
      updated_at: timestamp
    })
    .eq('id', projectId);
  
  if (error) {
    console.error('Error updating project flow chart:', error);
    throw error;
  }
};

export const fetchFlowChartProjects = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*')
        .eq('flow_chart', flowChart);
      
      if (error) {
        console.error('Error fetching flow chart projects:', error);
        throw error;
      }
      
      return data;
    },
    'Error fetching flow chart projects',
    []
  );
};

export const fetchOKRProjects = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*')
        .eq('flow_chart', flowChart)
        .contains('tags', ['OKR']);
      
      if (error) {
        console.error('Error fetching OKR projects:', error);
        throw error;
      }
      
      return data;
    },
    'Error fetching OKR projects',
    []
  );
};

export const fetchIDSTasks = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      // Try multiple approaches to find IDS tasks, as JSONB queries can be finicky
      let finalData = null;
      let finalError = null;
      
      // Approach 1: contains with array (standard approach)
      try {
        const { data: result1, error: error1 } = await supabase
          .from('PMA_Tasks')
          .select(`
            *,
            project:PMA_Projects(
              id,
              name,
              flow_chart
            )
          `)
          .contains('tags', ['IDS']);
        
        if (!error1 && result1 && result1.length > 0) {
          finalData = result1;
        }
      } catch (e) {
        console.log('Approach 1 failed:', e);
      }
      
      // Approach 2: contains with string (if approach 1 didn't work)
      if (!finalData || finalData.length === 0) {
        try {
          const { data: result2, error: error2 } = await supabase
            .from('PMA_Tasks')
            .select(`
              *,
              project:PMA_Projects(
                id,
                name,
                flow_chart
              )
            `)
            .contains('tags', 'IDS');
          
          if (!error2 && result2 && result2.length > 0) {
            finalData = result2;
          }
        } catch (e) {
          console.log('Approach 2 failed:', e);
        }
      }
      
      // Approach 3: filter with cs (contains) if others failed
      if (!finalData || finalData.length === 0) {
        try {
          const { data: result3, error: error3 } = await supabase
            .from('PMA_Tasks')
            .select(`
              *,
              project:PMA_Projects(
                id,
                name,
                flow_chart
              )
            `)
            .filter('tags', 'cs', '["IDS"]');
          
          if (!error3 && result3 && result3.length > 0) {
            finalData = result3;
          }
        } catch (e) {
          console.log('Approach 3 failed:', e);
        }
      }
      
      // Approach 4: Two-step process (find tasks first, then join)
      if (!finalData || finalData.length === 0) {
        try {
          // First, find tasks with IDS tags
          const { data: tasksOnly, error: tasksError } = await supabase
            .from('PMA_Tasks')
            .select('*')
            .contains('tags', ['IDS']);
          
          if (!tasksError && tasksOnly && tasksOnly.length > 0) {
            // Then get the full data with project join
            const taskIds = tasksOnly.map(t => t.id);
            const { data: result4, error: error4 } = await supabase
              .from('PMA_Tasks')
              .select(`
                *,
                project:PMA_Projects(
                  id,
                  name,
                  flow_chart
                )
              `)
              .in('id', taskIds);
            
            if (!error4 && result4) {
              finalData = result4;
            }
          }
        } catch (e) {
          console.log('Approach 4 failed:', e);
        }
      }
      
      if (finalError) {
        console.error('Error fetching IDS tasks:', finalError);
        throw finalError;
      }
      
      return finalData || [];
    },
    'Error fetching IDS tasks',
    []
  );
};

// Function to remove IDS tag from a project
export const removeIDSTagFromProject = async (projectId: string): Promise<void> => {
  try {
    // First get the current project to see its existing tags
    const { data: currentProject, error: fetchError } = await supabase
      .from('PMA_Projects')
      .select('tags')
      .eq('id', projectId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current project:', fetchError);
      throw fetchError;
    }
    
    // Remove IDS from existing tags
    let newTags = [];
    if (currentProject.tags && Array.isArray(currentProject.tags)) {
      newTags = currentProject.tags.filter(tag => tag !== 'IDS');
    }
    
    // Update the project with new tags (or null if no tags left)
    const { error: updateError } = await supabase
      .from('PMA_Projects')
      .update({ 
        tags: newTags.length > 0 ? newTags : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    if (updateError) {
      console.error('Error updating project tags:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in removeIDSTagFromProject:', error);
    throw error;
  }
};

// Function to remove IDS tag from a task
export const removeIDSTagFromTask = async (taskId: string): Promise<void> => {
  try {
    // First get the current task to see its existing tags
    const { data: currentTask, error: fetchError } = await supabase
      .from('PMA_Tasks')
      .select('tags')
      .eq('id', taskId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current task:', fetchError);
      throw fetchError;
    }
    
    // Remove IDS from existing tags
    let newTags = [];
    if (currentTask.tags && Array.isArray(currentTask.tags)) {
      newTags = currentTask.tags.filter(tag => tag !== 'IDS');
    }
    
    // Update the task with new tags (or null if no tags left)
    const { error: updateError } = await supabase
      .from('PMA_Tasks')
      .update({ 
        tags: newTags.length > 0 ? newTags : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
    if (updateError) {
      console.error('Error updating task tags:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in removeIDSTagFromTask:', error);
    throw error;
  }
};

export const fetchIDSProjects = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*')
        .eq('flow_chart', flowChart)
        .contains('tags', ['IDS']);
      
      if (error) {
        console.error('Error fetching IDS projects:', error);
        throw error;
      }
      
      return data;
    },
    'Error fetching IDS projects',
    []
  );
};

export const updateProjectDates = async (projectId: string, startDate: string, endDate?: string): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const updateData: any = {
    start_date: startDate,
    updated_at: timestamp
  };
  
  // Only include end_date if it's provided
  if (endDate) {
    updateData.end_date = endDate;
  }
  
  const { error } = await supabase
    .from('PMA_Projects')
    .update(updateData)
    .eq('id', projectId);
  
  if (error) {
    console.error('Error updating project dates:', error);
    throw error;
  }
};

export const updateProjectAssignee = async (projectId: string, assigneeId: string | null): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabase
    .from('PMA_Projects')
    .update({
      assignee_id: assigneeId,
      updated_at: timestamp
    })
    .eq('id', projectId);
  
  if (error) {
    console.error('Error updating project assignee:', error);
    throw error;
  }
};
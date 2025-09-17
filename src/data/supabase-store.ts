import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { Project, Task, SubTask, Category, TaskType, User, Update, Hour } from '../types';

// Test function to diagnose connection issues
export const diagnoseSupabaseConnection = async () => {
  console.log('🔍 Starting Supabase connection diagnosis...');
  
  try {
    // Test 1: Check if supabase client is initialized
    console.log('✓ Supabase client initialized');
    
    // Test 2: Simple query without safeSupabaseCall
    console.log('🔌 Testing direct connection...');
    const { data, error } = await supabase
      .from('PMA_Projects')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Direct query failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Direct connection successful');
    
    // Test 3: Test with safeSupabaseCall
    console.log('🛡️ Testing with safeSupabaseCall...');
    const result = await safeSupabaseCall(
      async () => {
        const { data, error } = await supabase
          .from('PMA_Projects')
          .select('id')
          .limit(1);
        if (error) throw error;
        return data;
      },
      'Test query',
      []
    );
    
    console.log('✅ safeSupabaseCall test successful');
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Connection diagnosis failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to handle Supabase errors with timeouts
const safeSupabaseCall = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  defaultValue: T
): Promise<T> => {
  try {
    // Set a shorter timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out after 10 seconds')), 10000);
    });
    
    // Race the operation against the timeout
    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    // More detailed error logging
    console.error(`🚨 SUPABASE ERROR - ${errorMessage}:`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Check if it's a connection error specifically
    if (error instanceof Error && (
      error.message.includes('connection refused') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    )) {
      console.error('🔌 CONNECTION ISSUE DETECTED:', error.message);
      // You might want to show a user-friendly error message here
    }
    
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
        multiAssigneeIds: p.multi_assignee_id || [],
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

// Special project ID for standalone tasks
export const STANDALONE_TASKS_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

// Ensure the standalone tasks project exists
export const ensureStandaloneTasksProject = async (): Promise<void> => {
  try {
    // Check if the standalone project already exists
    const { data: existingProject, error: checkError } = await supabase
      .from('PMA_Projects')
      .select('id')
      .eq('id', STANDALONE_TASKS_PROJECT_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is expected if project doesn't exist
      console.error('Error checking for standalone project:', checkError);
      return;
    }

    if (!existingProject) {
      // Create the standalone tasks project
      const timestamp = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('PMA_Projects')
        .insert({
          id: STANDALONE_TASKS_PROJECT_ID,
          name: 'Standalone Tasks',
          description: 'Container project for standalone tasks in flow charts',
          category: 'System',
          status: 'in-progress',
          project_type: 'Active',
          flow_chart: 'Product Development',
          created_at: timestamp,
          updated_at: timestamp
        });

      if (insertError) {
        console.error('Error creating standalone project:', insertError);
      } else {
        console.log('Created standalone tasks project');
      }
    }
  } catch (error) {
    console.error('Error in ensureStandaloneTasksProject:', error);
  }
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
      multi_assignee_id: project.multiAssigneeIds || [],
      flow_chart: project.flowChart,
      start_date: project.startDate,
      end_date: project.endDate,
      deadline: project.deadline,
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
  
  console.log('🔄 supabase-store.updateProject called with:', {
    id: project.id,
    startDate: project.startDate,
    endDate: project.endDate,
    deadline: project.deadline,
    name: project.name
  });
  
  const updateData = {
    name: project.name,
    description: project.description,
    category: project.category,
    status: project.status,
    project_type: project.projectType,
    assignee_id: project.assigneeId,
    multi_assignee_id: project.multiAssigneeIds || [],
    flow_chart: project.flowChart,
    start_date: project.startDate === null ? null : project.startDate,
    end_date: project.endDate === null ? null : project.endDate,
    deadline: project.deadline === null ? null : project.deadline,
    tags: project.tags,
    progress: project.progress,
    updated_at: timestamp
  };
  
  console.log('📝 Supabase update data:', updateData);
  
  const { error } = await supabase
    .from('PMA_Projects')
    .update(updateData)
    .eq('id', project.id);
  
  if (error) {
    console.error('❌ Supabase error updating project:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  
  console.log('✅ Project updated successfully in Supabase');
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
        status: t.status as 'todo' | 'in-progress' | 'done', // Type assertion to fix linting
        assigneeId: t.assignee_id,
        flowChart: t.flow_chart,
        priority: t.priority,
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

// Alternative direct fetch function that bypasses safeSupabaseCall for debugging
export const fetchTasksDirect = async (): Promise<Task[]> => {
  try {
    console.log('🔍 Fetching tasks directly (bypassing safeSupabaseCall)...');
    
    const { data, error } = await supabase
      .from('PMA_Tasks')
      .select('*');
    
    if (error) {
      console.error('❌ Direct fetchTasks failed:', error);
      throw error;
    }
    
    console.log(`✅ Direct fetchTasks successful: ${data.length} tasks found`);
    
    return data.map(t => ({
      id: t.id,
      projectId: t.project_id,
      name: t.name,
      description: t.description || '',
      taskType: t.task_type,
      status: t.status as 'todo' | 'in-progress' | 'done',
      assigneeId: t.assignee_id,
      flowChart: t.flow_chart,
      priority: t.priority,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      startDate: t.start_date,
      endDate: t.end_date,
      deadline: t.deadline,
      tags: t.tags,
      progress: t.progress
    }));
  } catch (error) {
    console.error('❌ fetchTasksDirect failed with error:', error);
    throw error; // Re-throw to see the actual error
  }
};

// Fetch tasks by flow chart
export const fetchFlowChartTasks = async (flowChart: string): Promise<Task[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Tasks')
        .select('*')
        .eq('flow_chart', flowChart);
      
      if (error) {
        console.error('Error fetching flow chart tasks:', error);
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
        flowChart: t.flow_chart,
        priority: t.priority,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        startDate: t.start_date,
        endDate: t.end_date,
        deadline: t.deadline,
        tags: t.tags,
        progress: t.progress
      }));
    },
    'Error fetching flow chart tasks',
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
      flow_chart: task.flowChart,
      priority: task.priority,
      start_date: task.startDate,
      end_date: task.endDate,
      deadline: task.deadline,
      tags: task.tags,
      progress: task.progress,
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
      flow_chart: task.flowChart,
      priority: task.priority,
      start_date: task.startDate === null ? null : task.startDate,
      end_date: task.endDate === null ? null : task.endDate,
      deadline: task.deadline === null ? null : task.deadline,
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

// Fetch Product Development projects with their tasks
export const fetchProductDevProjects = async (): Promise<Project[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Projects')
        .select('*')
        .eq('flow_chart', 'Product Development')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching Product Development projects:', error);
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
        multiAssigneeIds: p.multi_assignee_id || [],
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
    'Error fetching Product Development projects',
    []
  );
};

// Fetch tasks for Product Development projects
export const fetchProductDevProjectTasks = async (projectIds: string[]): Promise<Task[]> => {
  return safeSupabaseCall(
    async () => {
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('PMA_Tasks')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching Product Development project tasks:', error);
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
        flowChart: t.flow_chart,
        priority: t.priority,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        startDate: t.start_date,
        endDate: t.end_date,
        deadline: t.deadline,
        tags: t.tags,
        progress: t.progress
      }));
    },
    'Error fetching Product Development project tasks',
    []
  );
};

export const fetchOKRProjects = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      // Try different approaches to handle JSONB tags query
      let data = null;
      let error = null;
      
      // Approach 1: contains with array
      try {
        const result = await supabase
          .from('PMA_Projects')
          .select('*')
          .eq('flow_chart', flowChart)
          .contains('tags', ['OKR']);
        
        if (!result.error && result.data) {
          data = result.data;
        } else {
          error = result.error;
        }
      } catch (e) {
        // Approach 2: contains with string
        try {
          const result = await supabase
            .from('PMA_Projects')
            .select('*')
            .eq('flow_chart', flowChart)
            .contains('tags', 'OKR');
          
          if (!result.error && result.data) {
            data = result.data;
          } else {
            error = result.error;
          }
        } catch (e2) {
          // Approach 3: Just return empty array if JSONB queries fail
          console.log('OKR projects query failed, returning empty array');
          return [];
        }
      }
      
      if (error) {
        console.error('Error fetching OKR projects:', error);
        return [];
      }
      
      return data || [];
    },
    'Error fetching OKR projects',
    []
  );
};

export const fetchIDSTasks = async (flowChart: string): Promise<any[]> => {
  return safeSupabaseCall(
    async () => {
      // Simplified approach - just return empty array if JSONB queries are problematic
      try {
        const { data, error } = await supabase
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
        
        if (error) {
          console.log('IDS tasks query failed, returning empty array:', error);
          return [];
        }
        
        return data || [];
      } catch (e) {
        console.log('IDS tasks query failed, returning empty array');
        return [];
      }
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
      // Simplified approach - just return empty array if JSONB queries are problematic
      try {
        const { data, error } = await supabase
          .from('PMA_Projects')
          .select('*')
          .eq('flow_chart', flowChart)
          .contains('tags', ['IDS']);
        
        if (error) {
          console.log('IDS projects query failed, returning empty array:', error);
          return [];
        }
        
        return data || [];
      } catch (e) {
        console.log('IDS projects query failed, returning empty array');
        return [];
      }
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

// Hour logging operations
export const fetchUserHours = async (userId: string): Promise<Hour[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Hours')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching user hours:', error);
        throw error;
      }
      
      return data.map(h => ({
        id: h.id,
        userId: h.user_id,
        taskId: h.task_id,
        hours: h.hours,
        date: h.date,
        createdAt: h.created_at,
        updatedAt: h.updated_at
      }));
    },
    'Failed to fetch user hours',
    []
  );
};

export const fetchTasksAssignedToUser = async (userId: string): Promise<Task[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Tasks')
        .select('*')
        .eq('assignee_id', userId)
        .in('status', ['todo', 'in-progress']);
      
      if (error) {
        console.error('Error fetching assigned tasks:', error);
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
        flowChart: t.flow_chart,
        priority: t.priority,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        startDate: t.start_date,
        endDate: t.end_date,
        deadline: t.deadline,
        tags: t.tags || [],
        progress: t.progress
      }));
    },
    'Failed to fetch assigned tasks',
    []
  );
};

export const logHours = async (userId: string, taskId: string, hours: number, date: string): Promise<void> => {
  return safeSupabaseCall(
    async () => {
      const { error } = await supabase
        .from('PMA_Hours')
        .insert({
          id: uuidv4(),
          user_id: userId,
          task_id: taskId,
          hours: hours,
          date: date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging hours:', error);
        throw error;
      }
    },
    'Failed to log hours',
    undefined
  );
};

export const fetchHoursWithTaskDetails = async (userId: string): Promise<(Hour & { task: Task; project: Project })[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Hours')
        .select(`
          *,
          PMA_Tasks!inner(
            *,
            PMA_Projects!inner(*)
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching hours with task details:', error);
        throw error;
      }
      
      return data.map(h => ({
        id: h.id,
        userId: h.user_id,
        taskId: h.task_id,
        hours: h.hours,
        date: h.date,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        task: {
          id: h.PMA_Tasks.id,
          projectId: h.PMA_Tasks.project_id,
          name: h.PMA_Tasks.name,
          description: h.PMA_Tasks.description || '',
          taskType: h.PMA_Tasks.task_type,
          status: h.PMA_Tasks.status,
          assigneeId: h.PMA_Tasks.assignee_id,
          flowChart: h.PMA_Tasks.flow_chart,
          priority: h.PMA_Tasks.priority,
          createdAt: h.PMA_Tasks.created_at,
          updatedAt: h.PMA_Tasks.updated_at,
          startDate: h.PMA_Tasks.start_date,
          endDate: h.PMA_Tasks.end_date,
          deadline: h.PMA_Tasks.deadline,
          tags: h.PMA_Tasks.tags || [],
          progress: h.PMA_Tasks.progress
        },
        project: {
          id: h.PMA_Tasks.PMA_Projects.id,
          name: h.PMA_Tasks.PMA_Projects.name,
          description: h.PMA_Tasks.PMA_Projects.description || '',
          category: h.PMA_Tasks.PMA_Projects.category,
          status: h.PMA_Tasks.PMA_Projects.status,
          projectType: h.PMA_Tasks.PMA_Projects.project_type || 'Active',
          assigneeId: h.PMA_Tasks.PMA_Projects.assignee_id,
          multiAssigneeIds: h.PMA_Tasks.PMA_Projects.multi_assignee_id || [],
          flowChart: h.PMA_Tasks.PMA_Projects.flow_chart,
          createdAt: h.PMA_Tasks.PMA_Projects.created_at,
          updatedAt: h.PMA_Tasks.PMA_Projects.updated_at,
          startDate: h.PMA_Tasks.PMA_Projects.start_date,
          endDate: h.PMA_Tasks.PMA_Projects.end_date,
          deadline: h.PMA_Tasks.PMA_Projects.deadline,
          tags: h.PMA_Tasks.PMA_Projects.tags || [],
          progress: h.PMA_Tasks.PMA_Projects.progress,
          documents: h.PMA_Tasks.PMA_Projects.documents || []
        }
      }));
    },
    'Failed to fetch hours with task details',
    []
  );
};

// Role and admin functions
export const fetchUserRole = async (userId: string): Promise<string | null> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Users')
        .select(`
          role_id,
          PMA_Roles!inner(name)
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.PMA_Roles?.name || null;
    },
    'Failed to fetch user role',
    null
  );
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const role = await fetchUserRole(userId);
  return role === 'Admin';
};

// Admin-only functions for Budget & Hours page
export const fetchAllUsersHours = async (): Promise<(Hour & { user: User; task: Task; project: Project })[]> => {
  return safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('PMA_Hours')
        .select(`
          *,
          PMA_Users!inner(*),
          PMA_Tasks!inner(
            *,
            PMA_Projects!inner(*)
          )
        `)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching all users hours:', error);
        throw error;
      }
      
      return data.map(h => ({
        id: h.id,
        userId: h.user_id,
        taskId: h.task_id,
        hours: h.hours,
        date: h.date,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        user: {
          id: h.PMA_Users.id,
          email: h.PMA_Users.email,
          firstName: h.PMA_Users.first_name || '',
          lastName: h.PMA_Users.last_name || '',
          profileColor: h.PMA_Users.profile_color,
          department: h.PMA_Users.department,
          flowChart: h.PMA_Users.flow_chart
        },
        task: {
          id: h.PMA_Tasks.id,
          projectId: h.PMA_Tasks.project_id,
          name: h.PMA_Tasks.name,
          description: h.PMA_Tasks.description || '',
          taskType: h.PMA_Tasks.task_type,
          status: h.PMA_Tasks.status,
          assigneeId: h.PMA_Tasks.assignee_id,
          flowChart: h.PMA_Tasks.flow_chart,
          priority: h.PMA_Tasks.priority,
          createdAt: h.PMA_Tasks.created_at,
          updatedAt: h.PMA_Tasks.updated_at,
          startDate: h.PMA_Tasks.start_date,
          endDate: h.PMA_Tasks.end_date,
          deadline: h.PMA_Tasks.deadline,
          tags: h.PMA_Tasks.tags || [],
          progress: h.PMA_Tasks.progress
        },
        project: {
          id: h.PMA_Tasks.PMA_Projects.id,
          name: h.PMA_Tasks.PMA_Projects.name,
          description: h.PMA_Tasks.PMA_Projects.description || '',
          category: h.PMA_Tasks.PMA_Projects.category,
          status: h.PMA_Tasks.PMA_Projects.status,
          projectType: h.PMA_Tasks.PMA_Projects.project_type || 'Active',
          assigneeId: h.PMA_Tasks.PMA_Projects.assignee_id,
          multiAssigneeIds: h.PMA_Tasks.PMA_Projects.multi_assignee_id || [],
          flowChart: h.PMA_Tasks.PMA_Projects.flow_chart,
          createdAt: h.PMA_Tasks.PMA_Projects.created_at,
          updatedAt: h.PMA_Tasks.PMA_Projects.updated_at,
          startDate: h.PMA_Tasks.PMA_Projects.start_date,
          endDate: h.PMA_Tasks.PMA_Projects.end_date,
          deadline: h.PMA_Tasks.PMA_Projects.deadline,
          tags: h.PMA_Tasks.PMA_Projects.tags || [],
          progress: h.PMA_Tasks.PMA_Projects.progress,
          documents: h.PMA_Tasks.PMA_Projects.documents || []
        }
      }));
    },
    'Failed to fetch all users hours',
    []
  );
};

export const updateHourEntry = async (hourId: string, hours: number, date: string): Promise<void> => {
  return safeSupabaseCall(
    async () => {
      const { error } = await supabase
        .from('PMA_Hours')
        .update({
          hours: hours,
          date: date,
          updated_at: new Date().toISOString()
        })
        .eq('id', hourId);
      
      if (error) {
        console.error('Error updating hour entry:', error);
        throw error;
      }
    },
    'Failed to update hour entry',
    undefined
  );
};

export const deleteHourEntry = async (hourId: string): Promise<void> => {
  return safeSupabaseCall(
    async () => {
      const { error } = await supabase
        .from('PMA_Hours')
        .delete()
        .eq('id', hourId);
      
      if (error) {
        console.error('Error deleting hour entry:', error);
        throw error;
      }
    },
    'Failed to delete hour entry',
    undefined
  );
};
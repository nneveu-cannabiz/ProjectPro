import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Task, SubTask, Category, TaskType, User, Update, Role, ManagerEmployee } from '../types';
import * as supabaseStore from '../data/supabase-store';
import { useAuth } from './AuthContext';

// Define the context type
interface AppContextType {
  projects: Project[];
  tasks: Task[];
  subTasks: SubTask[];
  categories: Category[];
  taskTypes: TaskType[];
  updates: Update[];
  roles: Role[];
  managerEmployees: ManagerEmployee[];
  getUsers: () => User[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addSubTask: (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSubTask: (subTask: SubTask) => Promise<void>;
  deleteSubTask: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<string>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTaskType: (name: string) => Promise<string>;
  updateTaskType: (taskType: TaskType) => Promise<void>;
  deleteTaskType: (id: string) => Promise<void>;
  addUpdate: (update: Omit<Update, 'id' | 'createdAt'>) => Promise<string>;
  getUpdatesForEntity: (entityType: 'project' | 'task' | 'subtask', entityId: string) => Update[];
  getRelatedUpdates: (entityType: 'project' | 'task', entityId: string) => Update[];
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  assignEmployeeToManager: (managerId: string, employeeId: string) => Promise<void>;
  removeEmployeeFromManager: (managerId: string, employeeId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Default data
const defaultCategories: Category[] = [
  { id: '1', name: 'Live Website' },
  { id: '2', name: 'Admin Portal' },
  { id: '3', name: 'State Licensing' },
  { id: '4', name: 'Backend Development' },
];

const defaultTaskTypes: TaskType[] = [
  { id: '1', name: 'Bug' },
  { id: '2', name: 'Feature' },
  { id: '3', name: 'Discovery' },
];

// Create the context with default values
const AppContext = createContext<AppContextType>({
  projects: [],
  tasks: [],
  subTasks: [],
  categories: defaultCategories,
  taskTypes: defaultTaskTypes,
  updates: [],
  roles: [],
  managerEmployees: [],
  getUsers: () => [],
  addProject: async () => '',
  updateProject: async () => {},
  deleteProject: async () => {},
  addTask: async () => '',
  updateTask: async () => {},
  deleteTask: async () => {},
  addSubTask: async () => '',
  updateSubTask: async () => {},
  deleteSubTask: async () => {},
  addCategory: async () => '',
  updateCategory: async () => {},
  deleteCategory: async () => {},
  addTaskType: async () => '',
  updateTaskType: async () => {},
  deleteTaskType: async () => {},
  addUpdate: async () => '',
  getUpdatesForEntity: () => [],
  getRelatedUpdates: () => [],
  updateUser: async () => {},
  addRole: async () => '',
  updateRole: async () => {},
  deleteRole: async () => {},
  assignEmployeeToManager: async () => {},
  removeEmployeeFromManager: async () => {},
  isLoading: false,
  error: null,
  refreshData: async () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(defaultTaskTypes);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managerEmployees, setManagerEmployees] = useState<ManagerEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Function to fetch data from Supabase
  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Set a timeout to prevent the loading state from getting stuck
    const timeoutId = setTimeout(() => {
      console.warn('Data fetching timeout exceeded.');
      setIsLoading(false);
      setError('Request timed out. Please try again later.');
    }, 20000); // 20 seconds timeout
    
    try {
      // Try to fetch data from Supabase
      const [projectsData, tasksData, subTasksData, updatesData, usersData, rolesData, managerEmployeesData] = await Promise.all([
        supabaseStore.fetchProjects(),
        supabaseStore.fetchTasks(),
        supabaseStore.fetchSubTasks(),
        supabaseStore.fetchUpdates(),
        supabaseStore.fetchUsers(),
        supabaseStore.fetchRoles(),
        supabaseStore.fetchManagerEmployees()
      ]);
      
      clearTimeout(timeoutId);
      
      setProjects(projectsData);
      setTasks(tasksData);
      setSubTasks(subTasksData);
      setUpdates(updatesData);
      setUsers(usersData);
      setRoles(rolesData);
      setManagerEmployees(managerEmployeesData);
      
      console.log('Data loaded from Supabase:', {
        projects: projectsData.length,
        tasks: tasksData.length,
        subtasks: subTasksData.length,
        updates: updatesData.length,
        users: usersData.length,
        roles: rolesData.length,
        managerEmployees: managerEmployeesData.length
      });
      
      // Fetch categories and task types if needed
      try {
        const categoriesData = await supabaseStore.fetchCategories();
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        
        const taskTypesData = await supabaseStore.fetchTaskTypes();
        if (taskTypesData.length > 0) {
          setTaskTypes(taskTypesData);
        }
      } catch (err) {
        console.error('Error loading categories or task types:', err);
        // Continue with default categories and task types
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error loading data from Supabase:', err);
      setError('Failed to load data from the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Expose the refresh function for manual refresh
  const refreshData = async () => {
    await fetchData();
  };
  
  // Load data when the component mounts and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, loading data...');
      fetchData();
    } else {
      // Reset to empty state when logged out
      console.log('User not authenticated, clearing data');
      setProjects([]);
      setTasks([]);
      setSubTasks([]);
      setUpdates([]);
      setUsers([]);
      setRoles([]);
      setManagerEmployees([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);
  
  // Project CRUD operations
  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addProject(project);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newProject: Project = {
        ...project,
        id: newId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      setProjects(prev => [...prev, newProject]);
      return newId;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (project: Project) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateProject(project);
      
      // Update local state
      setProjects(prev => 
        prev.map(p => 
          p.id === project.id 
            ? { ...project, updatedAt: new Date().toISOString() } 
            : p
        )
      );
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteProject(id);
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setSubTasks(prev => prev.filter(st => 
        !tasks.some(t => t.projectId === id && t.id === st.taskId)
      ));
      setUpdates(prev => prev.filter(u => 
        !(u.entityType === 'project' && u.entityId === id) &&
        !tasks.some(t => t.projectId === id && 
          (u.entityType === 'task' && u.entityId === t.id) ||
          subTasks.some(st => st.taskId === t.id && 
            u.entityType === 'subtask' && u.entityId === st.id
          )
        )
      ));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Task CRUD operations
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addTask(task);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newTask: Task = {
        ...task,
        id: newId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      setTasks(prev => [...prev, newTask]);
      return newId;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateTask(task);
      
      // Update local state
      setTasks(prev => 
        prev.map(t => 
          t.id === task.id 
            ? { ...task, updatedAt: new Date().toISOString() } 
            : t
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteTask(id);
      
      // Update local state
      setTasks(prev => prev.filter(t => t.id !== id));
      setSubTasks(prev => prev.filter(st => st.taskId !== id));
      setUpdates(prev => prev.filter(u => 
        !(u.entityType === 'task' && u.entityId === id) &&
        !(u.entityType === 'subtask' && 
          prev.some(st => st.taskId === id && st.id === u.entityId)
        )
      ));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // SubTask CRUD operations
  const addSubTask = async (subTask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addSubTask(subTask);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newSubTask: SubTask = {
        ...subTask,
        id: newId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      setSubTasks(prev => [...prev, newSubTask]);
      return newId;
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubTask = async (subTask: SubTask) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateSubTask(subTask);
      
      // Update local state
      setSubTasks(prev => 
        prev.map(st => 
          st.id === subTask.id 
            ? { ...subTask, updatedAt: new Date().toISOString() } 
            : st
        )
      );
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubTask = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteSubTask(id);
      
      // Update local state
      setSubTasks(prev => prev.filter(st => st.id !== id));
      setUpdates(prev => prev.filter(u => 
        !(u.entityType === 'subtask' && u.entityId === id)
      ));
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Category CRUD operations
  const addCategory = async (name: string) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addCategory(name);
      
      // Update local state
      const newCategory: Category = { id: newId, name };
      setCategories(prev => [...prev, newCategory]);
      
      return newId;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateCategory(category);
      
      // Update local state
      setCategories(prev => 
        prev.map(c => c.id === category.id ? category : c)
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteCategory(id);
      
      // Update local state
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // TaskType CRUD operations
  const addTaskType = async (name: string) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addTaskType(name);
      
      // Update local state
      const newTaskType: TaskType = { id: newId, name };
      setTaskTypes(prev => [...prev, newTaskType]);
      
      return newId;
    } catch (error) {
      console.error('Error adding task type:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskType = async (taskType: TaskType) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateTaskType(taskType);
      
      // Update local state
      setTaskTypes(prev => 
        prev.map(tt => tt.id === taskType.id ? taskType : tt)
      );
    } catch (error) {
      console.error('Error updating task type:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTaskType = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteTaskType(id);
      
      // Update local state
      setTaskTypes(prev => prev.filter(tt => tt.id !== id));
    } catch (error) {
      console.error('Error deleting task type:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update operations
  const addUpdate = async (update: Omit<Update, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addUpdate(update);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newUpdate: Update = {
        ...update,
        id: newId,
        createdAt: timestamp,
      };
      
      setUpdates(prev => [newUpdate, ...prev]);
      return newId;
    } catch (error) {
      console.error('Error adding update:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getUpdatesForEntity = (entityType: 'project' | 'task' | 'subtask', entityId: string) => {
    return updates
      .filter(update => update.entityType === entityType && update.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };
  
  const getRelatedUpdates = (entityType: 'project' | 'task', entityId: string) => {
    let relatedUpdates: Update[] = [];
    
    // Get direct updates for this entity
    relatedUpdates = relatedUpdates.concat(
      updates.filter(update => update.entityType === entityType && update.entityId === entityId)
    );
    
    if (entityType === 'project') {
      // Get task updates for this project
      const projectTasks = tasks.filter(task => task.projectId === entityId);
      projectTasks.forEach(task => {
        relatedUpdates = relatedUpdates.concat(
          updates.filter(update => update.entityType === 'task' && update.entityId === task.id)
        );
        
        // Get subtask updates for each task
        const taskSubTasks = subTasks.filter(subTask => subTask.taskId === task.id);
        taskSubTasks.forEach(subTask => {
          relatedUpdates = relatedUpdates.concat(
            updates.filter(update => update.entityType === 'subtask' && update.entityId === subTask.id)
          );
        });
      });
    } else if (entityType === 'task') {
      // Get subtask updates for this task
      const taskSubTasks = subTasks.filter(subTask => subTask.taskId === entityId);
      taskSubTasks.forEach(subTask => {
        relatedUpdates = relatedUpdates.concat(
          updates.filter(update => update.entityType === 'subtask' && update.entityId === subTask.id)
        );
      });
    }
    
    // Sort updates by date, most recent first
    return relatedUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };
  
  // User operations
  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateUser(userId, userData);
      
      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, ...userData } 
            : u
        )
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Role operations
  const addRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.addRole(role);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newRole: Role = {
        ...role,
        id: newId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      setRoles(prev => [...prev, newRole]);
      return newId;
    } catch (error) {
      console.error('Error adding role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (role: Role) => {
    try {
      setIsLoading(true);
      await supabaseStore.updateRole(role);
      
      // Update local state
      setRoles(prev => 
        prev.map(r => 
          r.id === role.id 
            ? { ...role, updatedAt: new Date().toISOString() } 
            : r
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRole = async (id: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.deleteRole(id);
      
      // Update local state
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Manager-Employee operations
  const assignEmployeeToManager = async (managerId: string, employeeId: string) => {
    try {
      setIsLoading(true);
      const newId = await supabaseStore.assignEmployeeToManager(managerId, employeeId);
      
      // Update local state
      const timestamp = new Date().toISOString();
      const newRelationship: ManagerEmployee = {
        id: newId,
        managerId,
        employeeId,
        assignedDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      setManagerEmployees(prev => [...prev, newRelationship]);
      
      // Also update the user's manager_id
      setUsers(prev => 
        prev.map(u => 
          u.id === employeeId 
            ? { ...u, managerId } 
            : u
        )
      );
    } catch (error) {
      console.error('Error assigning employee to manager:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeEmployeeFromManager = async (managerId: string, employeeId: string) => {
    try {
      setIsLoading(true);
      await supabaseStore.removeEmployeeFromManager(managerId, employeeId);
      
      // Update local state
      setManagerEmployees(prev => 
        prev.filter(me => !(me.managerId === managerId && me.employeeId === employeeId))
      );
      
      // Also clear the user's manager_id
      setUsers(prev => 
        prev.map(u => 
          u.id === employeeId 
            ? { ...u, managerId: undefined } 
            : u
        )
      );
    } catch (error) {
      console.error('Error removing employee from manager:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get users (without passwords)
  const getUsers = () => {
    return users;
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        tasks,
        subTasks,
        categories,
        taskTypes,
        updates,
        roles,
        managerEmployees,
        getUsers,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        addSubTask,
        updateSubTask,
        deleteSubTask,
        addCategory,
        updateCategory,
        deleteCategory,
        addTaskType,
        updateTaskType,
        deleteTaskType,
        addUpdate,
        getUpdatesForEntity,
        getRelatedUpdates,
        updateUser,
        addRole,
        updateRole,
        deleteRole,
        assignEmployeeToManager,
        removeEmployeeFromManager,
        isLoading,
        error,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
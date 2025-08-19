import React, { useEffect, useState, useRef } from 'react';
import { parseISO } from 'date-fns';
import { RefreshCw, Plus } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import { fetchUsersByDepartment, fetchFlowChartProjects, updateProjectAssignee, fetchTasks, fetchFlowChartTasks, addTask, ensureStandaloneTasksProject, STANDALONE_TASKS_PROJECT_ID } from '../../../../data/supabase-store';
import { User, Task } from '../../../../types';
import { useAppContext } from '../../../../context/AppContext';
import { useAuth } from '../../../../context/AuthContext';
import PageChange from './Filters/PageChange';
import ProjectBar from './utils/Project Bar/projectbar';
import StandaloneTaskBar from './utils/Project Bar/StandaloneTaskBar';
import ProjectDetailsModal from './utils/ProjectDetailsModal';
import TaskDetailsModal from './utils/TaskDetailsModal';
import UpdatesDetailsModal from './utils/UpdatesDetailsModal';
import Modal from '../../../../components/ui/Modal';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import UserSelect from '../../../../components/UserSelect';
import { calculateRowHeight, calculateProjectPositions } from './utils/heightUtils';
import { 
  generateWorkDates, 
  getCurrentDay, 
  getDateRangeLabel, 
  addWorkDays,
  formatDate,
  formatDayName,
  isToday,
  isWeekendDay
} from './utils/dateUtils';

interface FlowProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string | null;
  tasks?: Task[];
  progress?: number;
  deadline?: Date;
}

interface FlowTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string | null;
  progress?: number;
  deadline?: Date;
  projectId: string;
  taskType: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low';
}

interface StackedProject {
  project: FlowProject;
  stackLevel: number;
}

interface StackedTask {
  task: FlowTask;
  stackLevel: number;
}

// Helper function to check if two projects overlap in time
const projectsOverlap = (project1: FlowProject, project2: FlowProject): boolean => {
  // If either project has no real end date (start === end), consider them as ongoing and overlapping
  const project1HasNoEndDate = project1.startDate.getTime() === project1.endDate.getTime();
  const project2HasNoEndDate = project2.startDate.getTime() === project2.endDate.getTime();
  
  // If either project has no end date, they should always be considered overlapping
  // This ensures they stack vertically instead of overlapping horizontally
  if (project1HasNoEndDate || project2HasNoEndDate) {
    return true;
  }
  
  // Standard overlap check for projects with defined end dates
  return project1.startDate < project2.endDate && project2.startDate < project1.endDate;
};

// Calculate stacking positions for projects to avoid overlaps
// Projects with the same assignee will be stacked vertically regardless of time overlap
const calculateProjectStacking = (projects: FlowProject[], weekStart: Date, weekEnd: Date): StackedProject[] => {
  if (projects.length === 0) return [];
  
  // Filter projects that are visible in the current week
  const visibleProjects = projects.filter(project => {
    const hasNoEndDate = project.startDate.getTime() === project.endDate.getTime();
    // For projects with no end date, only check if they start before or during the week
    if (hasNoEndDate) {
      return project.startDate <= weekEnd;
    }
    // Standard visibility check for projects with defined end dates
    return project.endDate >= weekStart && project.startDate <= weekEnd;
  });
  
  // Sort projects by start date, then by end date
  const sortedProjects = [...visibleProjects].sort((a, b) => {
    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    return a.endDate.getTime() - b.endDate.getTime();
  });
  
  const stackedProjects: StackedProject[] = [];
  // Track the highest stack level used for each assignee
  const assigneeStackLevels: Map<string, number> = new Map();
  
  for (const project of sortedProjects) {
    let stackLevel = 0;
    let foundLevel = false;
    
    // If this project has an assignee, ensure it stacks below other projects with the same assignee
    if (project.assigneeId) {
      const lastAssigneeLevel = assigneeStackLevels.get(project.assigneeId);
      if (lastAssigneeLevel !== undefined) {
        // Start checking from the level after the last project with this assignee
        stackLevel = lastAssigneeLevel + 1;
      }
    }
    
    // Find the lowest stack level where this project doesn't overlap with others
    while (!foundLevel) {
      const projectsAtLevel = stackedProjects.filter(sp => sp.stackLevel === stackLevel);
      const hasOverlap = projectsAtLevel.some(sp => projectsOverlap(project, sp.project));
      
      if (!hasOverlap) {
        foundLevel = true;
      } else {
        stackLevel++;
      }
    }
    
    // Update the highest stack level for this assignee
    if (project.assigneeId) {
      assigneeStackLevels.set(project.assigneeId, stackLevel);
    }
    
    stackedProjects.push({ project, stackLevel });
  }
  
  return stackedProjects;
};

// Helper function to check if two tasks overlap in time
const tasksOverlap = (task1: FlowTask, task2: FlowTask): boolean => {
  // If either task has no real end date (start === end), consider them as ongoing and overlapping
  const task1HasNoEndDate = task1.startDate.getTime() === task1.endDate.getTime();
  const task2HasNoEndDate = task2.startDate.getTime() === task2.endDate.getTime();
  
  // If either task has no end date, they should always be considered overlapping
  // This ensures they stack vertically instead of overlapping horizontally
  if (task1HasNoEndDate || task2HasNoEndDate) {
    return true;
  }
  
  // Standard overlap check for tasks with defined end dates
  return task1.startDate < task2.endDate && task2.startDate < task1.endDate;
};

// Calculate stacking positions for tasks to avoid overlaps
// Tasks with the same assignee will be stacked vertically regardless of time overlap
const calculateTaskStacking = (tasks: FlowTask[], weekStart: Date, weekEnd: Date): StackedTask[] => {
  if (tasks.length === 0) return [];
  
  // Filter tasks that are visible in the current week
  const visibleTasks = tasks.filter(task => {
    const hasNoEndDate = task.startDate.getTime() === task.endDate.getTime();
    // For tasks with no end date, show them if they start on or before the week end
    // This ensures tasks created today or in the past are visible
    if (hasNoEndDate) {
      return task.startDate <= weekEnd;
    }
    // Standard visibility check for tasks with defined end dates
    return task.endDate >= weekStart && task.startDate <= weekEnd;
  });
  
  console.log(`calculateTaskStacking - Input tasks: ${tasks.length}, Visible tasks: ${visibleTasks.length}`, {
    weekStart: weekStart.toDateString(),
    weekEnd: weekEnd.toDateString(),
    tasks: tasks.map(t => ({ 
      name: t.name, 
      startDate: t.startDate.toDateString(), 
      endDate: t.endDate.toDateString(),
      hasNoEndDate: t.startDate.getTime() === t.endDate.getTime()
    })),
    visibleTasks: visibleTasks.map(t => ({ 
      name: t.name, 
      startDate: t.startDate.toDateString(), 
      endDate: t.endDate.toDateString() 
    }))
  });
  
  // Sort tasks by start date, then by end date
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    return a.endDate.getTime() - b.endDate.getTime();
  });
  
  const stackedTasks: StackedTask[] = [];
  // Track the highest stack level used for each assignee
  const assigneeStackLevels: Map<string, number> = new Map();
  
  for (const task of sortedTasks) {
    let stackLevel = 0;
    let foundLevel = false;
    
    // If this task has an assignee, ensure it stacks below other tasks with the same assignee
    if (task.assigneeId) {
      const lastAssigneeLevel = assigneeStackLevels.get(task.assigneeId);
      if (lastAssigneeLevel !== undefined) {
        // Start checking from the level after the last task with this assignee
        stackLevel = lastAssigneeLevel + 1;
      }
    }
    
    // Find the lowest stack level where this task doesn't overlap with others
    while (!foundLevel) {
      const tasksAtLevel = stackedTasks.filter(st => st.stackLevel === stackLevel);
      const hasOverlap = tasksAtLevel.some(st => tasksOverlap(task, st.task));
      
      if (!hasOverlap) {
        foundLevel = true;
      } else {
        stackLevel++;
      }
    }
    
    // Update the highest stack level for this assignee
    if (task.assigneeId) {
      assigneeStackLevels.set(task.assigneeId, stackLevel);
    }
    
    stackedTasks.push({ task, stackLevel });
  }
  
  return stackedTasks;
};



const FlowChartContainer: React.FC = () => {
  const { getUpdatesForEntity, categories, addProject, addCategory, getProductDevUsers, projects: allProjects, taskTypes } = useAppContext();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDates, setCurrentDates] = useState<Date[]>([]);
  const [currentStartDate, setCurrentStartDate] = useState<Date>(getCurrentDay());
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<FlowTask[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null);
  const [assigningProject, setAssigningProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [selectedUpdatesProjectId, setSelectedUpdatesProjectId] = useState<string | null>(null);
  const [showTaskUpdatesModal, setShowTaskUpdatesModal] = useState(false);
  const [selectedUpdatesTaskId, setSelectedUpdatesTaskId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  // New project form state
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    category: '',
    status: 'todo' as const,
    projectType: 'Active' as const,
    assigneeId: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '',
    deadline: ''
  });
  const [newProjectErrors, setNewProjectErrors] = useState<Record<string, string>>({});
  const [isSubmittingNewProject, setIsSubmittingNewProject] = useState(false);
  
  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    description: '',
    taskType: '',
    status: 'todo' as const,
    priority: 'Medium' as const,
    assigneeId: '',
    projectId: '', // Will be empty for standalone tasks
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '',
    deadline: ''
  });
  const [newTaskErrors, setNewTaskErrors] = useState<Record<string, string>>({});
  const [isSubmittingNewTask, setIsSubmittingNewTask] = useState(false);
  
  // Custom category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Refs for scroll synchronization
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Ensure the standalone tasks project exists
      await ensureStandaloneTasksProject();
      
      const departmentUsers = await fetchUsersByDepartment('Product Development');
      setUsers(departmentUsers);

      // Load projects that are in the Product Development flow chart
      const flowChartProjects = await fetchFlowChartProjects('Product Development');
      
      // Load all tasks
      const allTasks = await fetchTasks();
      
      // Load standalone tasks that are in the Product Development flow chart
      const flowChartTasks = await fetchFlowChartTasks('Product Development');
      
      const parsedProjects: FlowProject[] = (flowChartProjects || [])
        .filter((p: any) => p.start_date) // Include all projects with start_date (end_date is optional)
        .map((p: any) => {
          // Get tasks for this project (excluding standalone tasks)
          const projectTasks = allTasks.filter(task => 
            task.projectId === p.id && task.projectId !== STANDALONE_TASKS_PROJECT_ID
          );
          
          return {
            id: p.id,
            name: p.name,
            startDate: parseISO(p.start_date),
            endDate: p.end_date ? parseISO(p.end_date) : parseISO(p.start_date), // Use start_date as end_date if no end_date provided
            assigneeId: p.assignee_id || null,
            tasks: projectTasks,
            progress: p.progress || 0,
            deadline: p.deadline ? parseISO(p.deadline) : undefined,
          };
        });
      setProjects(parsedProjects);

      // Parse standalone tasks (tasks with flow_chart set and using the special standalone project ID)
      console.log('All flow chart tasks:', flowChartTasks);
      console.log('Filtering for standalone project ID:', STANDALONE_TASKS_PROJECT_ID);
      
      const filteredStandaloneTasks = (flowChartTasks || [])
        .filter((t: any) => {
          console.log('Task:', t.id, 'project_id:', t.project_id, 'matches:', t.project_id === STANDALONE_TASKS_PROJECT_ID);
          return t.start_date && t.project_id === STANDALONE_TASKS_PROJECT_ID;
        });
      
      console.log('Filtered standalone tasks:', filteredStandaloneTasks);
      
      const parsedStandaloneTasks: FlowTask[] = filteredStandaloneTasks
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          startDate: parseISO(t.start_date),
          endDate: t.end_date ? parseISO(t.end_date) : parseISO(t.start_date), // Use start_date as end_date if no end_date provided
          assigneeId: t.assignee_id || null,
          progress: t.progress || 0,
          deadline: t.deadline ? parseISO(t.deadline) : undefined,
          projectId: t.project_id,
          taskType: t.task_type,
          status: t.status,
          priority: t.priority,
        }));
      
      console.log('Parsed standalone tasks:', parsedStandaloneTasks);
      setStandaloneTasks(parsedStandaloneTasks);
    } catch (error) {
      console.error('Error loading flow chart data:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Generate work dates based on current start date
    const workDates = generateWorkDates(currentStartDate);
    setCurrentDates(workDates);
  }, [currentStartDate]);

  const handlePreviousDay = () => {
    const previousDay = addWorkDays(currentStartDate, -1);
    setCurrentStartDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = addWorkDays(currentStartDate, 1);
    setCurrentStartDate(nextDay);
  };

  const isCurrentDay = () => {
    const today = getCurrentDay();
    return currentStartDate.toDateString() === today.toDateString();
  };

  const handleJumpToCurrentDay = () => {
    const today = getCurrentDay();
    setCurrentStartDate(today);
  };

  // Scroll synchronization functions

  const handleDateScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollLeft = scrollLeft;
    }
  };



  const handleRefresh = async () => {
    await loadData(true);
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const handleProjectClick = (project: FlowProject) => {
    setSelectedProject(project);
    setShowAssignModal(true);
  };

  const handleProjectNameClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectDetailsModal(true);
  };

  const handleCloseProjectDetailsModal = () => {
    setShowProjectDetailsModal(false);
    setSelectedProjectId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailsModal(true);
  };

  const handleCloseTaskDetailsModal = () => {
    setShowTaskDetailsModal(false);
    setSelectedTaskId(null);
  };

  const handleAssignProject = async (userId: string) => {
    if (!selectedProject) return;

    setAssigningProject(true);
    try {
      await updateProjectAssignee(selectedProject.id, userId);
      
      // Refresh data to reflect the assignment
      await loadData(true);
      
      setShowAssignModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error assigning project:', error);
    } finally {
      setAssigningProject(false);
    }
  };

  const handleUpdatesClick = (projectId: string) => {
    setSelectedUpdatesProjectId(projectId);
    setShowUpdatesModal(true);
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
    setSelectedUpdatesProjectId(null);
  };

  const handleTaskUpdatesClick = (taskId: string) => {
    setSelectedUpdatesTaskId(taskId);
    setShowTaskUpdatesModal(true);
  };

  const handleCloseTaskUpdatesModal = () => {
    setShowTaskUpdatesModal(false);
    setSelectedUpdatesTaskId(null);
  };

  const handleNewProjectClick = () => {
    setShowNewProjectModal(true);
  };

  const handleNewTaskClick = () => {
    setShowNewTaskModal(true);
  };

  const handleCloseNewProjectModal = () => {
    setShowNewProjectModal(false);
    // Reset form
    setNewProjectForm({
      name: '',
      description: '',
      category: '',
      status: 'todo',
      projectType: 'Active',
      assigneeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      deadline: ''
    });
    setNewProjectErrors({});
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  // Get unique categories from existing projects plus database categories
  const getAvailableCategories = () => {
    const projectCategories = new Set(allProjects.map(p => p.category).filter(Boolean));
    const dbCategories = new Set(categories.map(c => c.name));
    
    // Also include the currently selected category if it exists
    if (newProjectForm.category) {
      projectCategories.add(newProjectForm.category);
    }
    
    // Combine and deduplicate
    const allCategories = Array.from(new Set([...dbCategories, ...projectCategories]));
    return allCategories.sort();
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'ADD_NEW_CATEGORY') {
      setShowAddCategory(true);
    } else {
      setNewProjectForm(prev => ({ ...prev, category: value }));
      setShowAddCategory(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsAddingCategory(true);
      const categoryName = newCategoryName.trim();
      
      await addCategory(categoryName);
      
      // Set the new category as selected and hide the add form
      setShowAddCategory(false);
      setNewCategoryName('');
      
      // Use setTimeout to ensure the context has updated before setting the category
      setTimeout(() => {
        setNewProjectForm(prev => ({ ...prev, category: categoryName }));
      }, 0);
      
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  const handleCloseNewTaskModal = () => {
    setShowNewTaskModal(false);
    // Reset form
    setNewTaskForm({
      name: '',
      description: '',
      taskType: '',
      status: 'todo',
      priority: 'Medium',
      assigneeId: '',
      projectId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      deadline: ''
    });
    setNewTaskErrors({});
  };

  const validateNewProjectForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newProjectForm.name.trim()) {
      errors.name = 'Project name is required';
    }
    
    if (!newProjectForm.category) {
      errors.category = 'Category is required';
    }
    
    setNewProjectErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNewProjectForm()) return;
    
    setIsSubmittingNewProject(true);
    
    try {
      await addProject({
        name: newProjectForm.name,
        description: newProjectForm.description,
        category: newProjectForm.category,
        status: newProjectForm.status,
        projectType: newProjectForm.projectType,
        assigneeId: newProjectForm.assigneeId || undefined,
        flowChart: 'Product Development', // Set flow chart to Product Development
        startDate: newProjectForm.startDate, // Always include start date (defaults to today)
        endDate: newProjectForm.endDate || undefined,
        deadline: newProjectForm.deadline || undefined,
      });
      
      // Refresh data to show the new project
      await loadData(true);
      handleCloseNewProjectModal();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmittingNewProject(false);
    }
  };

  const handleNewProjectFormChange = (field: string, value: string) => {
    setNewProjectForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (newProjectErrors[field]) {
      setNewProjectErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateNewTaskForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newTaskForm.name.trim()) {
      errors.name = 'Task name is required';
    }
    
    if (!newTaskForm.taskType) {
      errors.taskType = 'Task type is required';
    }
    
    setNewTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNewTaskForm()) return;
    
    setIsSubmittingNewTask(true);
    
    try {
      await addTask({
        projectId: STANDALONE_TASKS_PROJECT_ID, // Use special project ID for standalone tasks
        name: newTaskForm.name,
        description: newTaskForm.description,
        taskType: newTaskForm.taskType,
        status: newTaskForm.status,
        priority: newTaskForm.priority,
        assigneeId: newTaskForm.assigneeId || undefined,
        flowChart: 'Product Development', // Set flow chart to Product Development
        startDate: newTaskForm.startDate, // Always include start date (defaults to today)
        endDate: newTaskForm.endDate || undefined,
        deadline: newTaskForm.deadline || undefined,
      });
      
      // Refresh data to show the new task
      await loadData(true);
      handleCloseNewTaskModal();
    } catch (error) {
      console.error('Error creating task:', error);
      // You could add a toast notification or error state here
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSubmittingNewTask(false);
    }
  };

  const handleNewTaskFormChange = (field: string, value: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (newTaskErrors[field]) {
      setNewTaskErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Helper function to get updates counts for a project
  const getUpdatesCountsForProject = (projectId: string) => {
    const updates = getUpdatesForEntity('project', projectId);
    const totalCount = updates.length;
    const unreadCount = currentUser ? 
      updates.filter(update => !update.isReadBy?.includes(currentUser.id)).length : 0;
    
    return { totalCount, unreadCount };
  };

  // Helper function to get updates counts for a task
  const getUpdatesCountsForTask = (taskId: string) => {
    const updates = getUpdatesForEntity('task', taskId);
    const totalCount = updates.length;
    const unreadCount = currentUser ? 
      updates.filter(update => !update.isReadBy?.includes(currentUser.id)).length : 0;
    
    return { totalCount, unreadCount };
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading flow chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
             {/* Header */}
       <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
         <div className="flex items-center justify-between">
           <div>
             <h2 
               className="text-2xl font-bold"
               style={{ color: brandTheme.primary.navy }}
             >
               Product Development Flow Chart
             </h2>
             <p style={{ color: brandTheme.text.muted }}>
               Team workload and project timeline view
             </p>
           </div>
           
                                          <div className="flex items-center space-x-4">
           {/* Add New Project Button */}
           <button
             onClick={handleNewProjectClick}
             className="flex items-center px-4 py-2 rounded-lg border transition-colors hover:bg-blue-50"
             style={{
               borderColor: brandTheme.primary.navy,
               color: brandTheme.primary.navy,
               backgroundColor: brandTheme.background.primary
             }}
             title="Add new project"
           >
             <Plus size={18} className="mr-2" />
             New Project
           </button>
           
           {/* Add New Task Button */}
           <button
             onClick={handleNewTaskClick}
             className="flex items-center px-4 py-2 rounded-lg border transition-colors hover:bg-green-50"
             style={{
               borderColor: brandTheme.status.success,
               color: brandTheme.status.success,
               backgroundColor: brandTheme.background.primary
             }}
             title="Add new standalone task"
           >
             <Plus size={18} className="mr-2" />
             New Task
           </button>
            

             
             {/* Refresh Button */}
             <button
               onClick={handleRefresh}
               disabled={refreshing || loading}
               className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
                 refreshing ? 'cursor-not-allowed' : 'hover:bg-gray-50'
               }`}
               style={{
                 borderColor: brandTheme.border.light,
                 color: brandTheme.text.primary,
                 backgroundColor: brandTheme.background.primary
               }}
               title="Refresh data"
             >
               <RefreshCw 
                 size={18} 
                 className={refreshing ? 'animate-spin' : ''}
                 style={{ color: brandTheme.text.primary }}
               />
             </button>
             
                         {/* Page Change Navigation */}
            <PageChange
             onPreviousWeek={handlePreviousDay}
             onNextWeek={handleNextDay}
             onJumpToCurrentWeek={handleJumpToCurrentDay}
             currentWeekLabel={getDateRangeLabel(currentStartDate)}
             canGoPrevious={true}
             canGoNext={true}
             isCurrentWeek={isCurrentDay()}
           />
           </div>
         </div>
       </div>

      {/* Flow Chart Container */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Date Headers Row */}
        <div className="flex border-b" style={{ borderColor: brandTheme.border.light }}>
                     {/* User Names Column Header */}
           <div 
             className="w-40 p-4 border-r flex-shrink-0"
             style={{ 
               backgroundColor: brandTheme.background.primary,
               borderColor: brandTheme.border.light
             }}
           >
             <h3 
               className="font-semibold text-base text-center"
               style={{ color: brandTheme.text.primary }}
             >
               Team Members
             </h3>
           </div>

                     {/* Scrollable Date Headers */}
           <div 
             ref={dateScrollRef}
             className="flex-1 overflow-x-auto" 
             id="date-scroll-container"
             onScroll={handleDateScroll}
           >
             <div className="flex" style={{ minWidth: 'max-content' }}>
               {currentDates.map((date, index) => {
                 const isWeekend = isWeekendDay(date);
                 return (
                   <div
                     key={index}
                     className={`p-4 border-r flex-shrink-0 text-center ${
                       isWeekend ? 'w-12' : 'flex-1'
                     }`}
                                         style={{
                      backgroundColor: isToday(date) 
                        ? brandTheme.primary.paleBlue 
                        : isWeekend 
                        ? '#f3f4f6'
                        : brandTheme.background.primary,
                      borderColor: brandTheme.border.light,
                      minWidth: isWeekend ? '48px' : '120px'
                    }}
                   >
                     <div 
                       className="font-semibold text-base"
                       style={{ color: isWeekend ? brandTheme.text.muted : brandTheme.text.primary }}
                     >
                       {isWeekend ? 'S' : formatDayName(date)}
                     </div>
                     {!isWeekend && (
                       <div 
                         className="text-sm mt-1"
                         style={{ color: brandTheme.text.muted }}
                       >
                         {formatDate(date)}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        </div>

        {/* User Rows */}
        <div className="flex flex-1 min-h-0">
          {/* User Names Column */}
          <div 
            className="w-40 border-r flex-shrink-0"
            style={{ 
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.light
            }}
          >
            {users.length === 0 ? (
              <div className="p-4 text-center">
                <p style={{ color: brandTheme.text.muted }}>
                  No users assigned to Product Development
                </p>
              </div>
            ) : (
              users.map((user) => {
                const userProjects = projects.filter(project => project.assigneeId === user.id);
                const userTasks = standaloneTasks.filter(task => task.assigneeId === user.id);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                const stackedTasks = calculateTaskStacking(userTasks, dateRangeStart, dateRangeEnd);
                const baseRowHeight = calculateRowHeight(userProjects, dateRangeStart, dateRangeEnd, stackedProjects, 48, stackedTasks);
                const rowHeight = baseRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                <div
                  key={user.id}
                  className="border-b flex flex-col items-center justify-center p-3"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    height: `${rowHeight}px`,
                    minHeight: '96px',
                    width: '160px' // Match w-40 (160px)
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mb-2"
                    style={{ backgroundColor: user.profileColor || brandTheme.primary.navy }}
                  >
                    {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <div 
                      className="font-medium text-sm leading-tight"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {getUserDisplayName(user)}
                    </div>
                  </div>
                </div>
                );
              })
            )}
            
            {/* Unassigned Projects and Tasks Row - includes projects and tasks with start date only */}
            {(() => {
              const unassignedProjects = projects.filter(project => !project.assigneeId);
              const unassignedTasks = standaloneTasks.filter(task => !task.assigneeId);
              const dateRangeStart = currentDates[0];
              const dateRangeEnd = currentDates[currentDates.length - 1];
              const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
              const stackedUnassignedTasks = calculateTaskStacking(unassignedTasks, dateRangeStart, dateRangeEnd);
              const baseUnassignedRowHeight = calculateRowHeight(unassignedProjects, dateRangeStart, dateRangeEnd, stackedUnassignedProjects, 48, stackedUnassignedTasks);
              const unassignedRowHeight = baseUnassignedRowHeight + 16; // Add 8px buffer on top and bottom
              
              return (
                <div
                  className="border-b flex flex-col items-center justify-center p-3"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    height: `${unassignedRowHeight}px`,
                    minHeight: '96px',
                    width: '160px' // Match w-40 (160px)
                  }}
                >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mb-2"
                style={{ backgroundColor: brandTheme.secondary.slate }}
              >
                U
              </div>
              <div className="text-center">
                <div 
                  className="font-medium text-sm leading-tight"
                  style={{ color: brandTheme.text.primary }}
                >
                  Unassigned Projects
                </div>
              </div>
            </div>
            );
            })()}
          </div>

          {/* Scrollable Content Area */}
          <div 
            ref={contentScrollRef}
            className="flex-1 overflow-x-auto overflow-y-auto" 
            id="content-scroll-container"
            onScroll={handleContentScroll}
          >
            <div style={{ minWidth: 'max-content', height: 'max-content' }}>
              {/* User Rows */}
              {users.map((user) => {
                const userProjects = projects.filter(project => project.assigneeId === user.id);
                const userTasks = standaloneTasks.filter(task => task.assigneeId === user.id);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                const stackedTasks = calculateTaskStacking(userTasks, dateRangeStart, dateRangeEnd);
                const baseRowHeight = calculateRowHeight(userProjects, dateRangeStart, dateRangeEnd, stackedProjects, 48, stackedTasks);
                const rowHeight = baseRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                <div 
                  key={user.id} 
                  className="relative border-b"
                  style={{ 
                    borderColor: brandTheme.border.light, 
                    overflow: 'visible',
                    height: `${rowHeight}px`,
                    minHeight: '96px'
                  }}
                >
                  {/* Background day columns */}
                  <div className="absolute inset-0 flex">
                    {currentDates.map((date, idx) => {
                      const isWeekend = isWeekendDay(date);
                      return (
                        <div
                          key={idx}
                          className={`border-r ${isWeekend ? 'w-12' : 'flex-1'}`}
                          style={{
                            backgroundColor: isToday(date) 
                              ? brandTheme.primary.paleBlue 
                              : isWeekend 
                              ? '#f3f4f6'
                              : brandTheme.background.secondary,
                            borderColor: brandTheme.border.light,
                            minWidth: isWeekend ? '48px' : '120px'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Project bars for this user - positioned over the entire row */}
                  <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                    {(() => {
                      const dateRangeStart = currentDates[0];
                      const dateRangeEnd = currentDates[currentDates.length - 1];
                      const today = new Date();
                      
                      // Filter projects assigned to this user
                      const userProjects = projects.filter(project => project.assigneeId === user.id);
                      
                      // Calculate stacking positions to avoid overlaps
                      const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                      
                      // Calculate precise positions for each project
                      const projectPositions = calculateProjectPositions(stackedProjects, 48);
                      
                      return stackedProjects.map((stackedProject) => {
                        const { totalCount, unreadCount } = getUpdatesCountsForProject(stackedProject.project.id);
                        
                        return (
                          <ProjectBar
                            key={stackedProject.project.id}
                            projectId={stackedProject.project.id}
                            projectName={stackedProject.project.name}
                            weekStart={dateRangeStart}
                            weekEnd={dateRangeEnd}
                            projectStart={stackedProject.project.startDate}
                            projectEnd={stackedProject.project.endDate}
                            projectDeadline={stackedProject.project.deadline}
                            projectProgress={stackedProject.project.progress}
                            projectTasks={stackedProject.project.tasks}
                            today={today}
                            barHeightPx={48} // Smaller height to allow more stacking
                            stackLevel={stackedProject.stackLevel}
                            topPosition={projectPositions.get(stackedProject.stackLevel)}
                            onProjectNameClick={handleProjectNameClick}
                            onTaskClick={handleTaskClick}
                            onUpdatesClick={handleUpdatesClick}
                            onTaskUpdatesClick={handleTaskUpdatesClick}
                            getTaskUpdatesCount={getUpdatesCountsForTask}
                            unreadUpdatesCount={unreadCount}
                            totalUpdatesCount={totalCount}
                          />
                        );
                      });
                    })()}

                    {/* Standalone task bars for this user */}
                    {(() => {
                      const dateRangeStart = currentDates[0];
                      const dateRangeEnd = currentDates[currentDates.length - 1];
                      const today = new Date();
                      console.log('Current date range:', {
                        start: dateRangeStart?.toDateString(),
                        end: dateRangeEnd?.toDateString(),
                        today: today.toDateString()
                      });
                      
                      // Filter standalone tasks assigned to this user
                      const userTasks = standaloneTasks.filter(task => task.assigneeId === user.id);
                      console.log(`User ${user.firstName} ${user.lastName} tasks:`, userTasks);
                      
                      // Calculate stacking positions to avoid overlaps
                      const stackedTasks = calculateTaskStacking(userTasks, dateRangeStart, dateRangeEnd);
                      console.log(`User ${user.firstName} ${user.lastName} stacked tasks:`, stackedTasks);
                      
                      return stackedTasks.map((stackedTask) => {
                        const { totalCount, unreadCount } = getUpdatesCountsForTask(stackedTask.task.id);
                        
                        return (
                          <StandaloneTaskBar
                            key={stackedTask.task.id}
                            taskId={stackedTask.task.id}
                            taskName={stackedTask.task.name}
                            taskType={stackedTask.task.taskType}
                            status={stackedTask.task.status}
                            weekStart={dateRangeStart}
                            weekEnd={dateRangeEnd}
                            taskStart={stackedTask.task.startDate}
                            taskEnd={stackedTask.task.endDate}
                            taskDeadline={stackedTask.task.deadline}
                            taskProgress={stackedTask.task.progress}
                            today={today}
                            barHeightPx={48}
                            stackLevel={stackedTask.stackLevel}
                            onTaskClick={handleTaskClick}
                            onUpdatesClick={handleTaskUpdatesClick}
                            unreadUpdatesCount={unreadCount}
                            totalUpdatesCount={totalCount}
                          />
                        );
                      });
                    })()}
                  </div>
                </div>
                );
              })}
              
              {/* Unassigned Projects and Tasks Row */}
              {(() => {
                const unassignedProjects = projects.filter(project => !project.assigneeId);
                const unassignedTasks = standaloneTasks.filter(task => !task.assigneeId);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
                const stackedUnassignedTasks = calculateTaskStacking(unassignedTasks, dateRangeStart, dateRangeEnd);
                const baseUnassignedRowHeight = calculateRowHeight(unassignedProjects, dateRangeStart, dateRangeEnd, stackedUnassignedProjects, 48, stackedUnassignedTasks);
                const unassignedRowHeight = baseUnassignedRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                  <div 
                    className="relative border-b"
                    style={{ 
                      borderColor: brandTheme.border.light, 
                      overflow: 'visible',
                      height: `${unassignedRowHeight}px`,
                      minHeight: '96px'
                    }}
                  >
                {/* Background day columns */}
                <div className="absolute inset-0 flex">
                  {currentDates.map((date, idx) => {
                    const isWeekend = isWeekendDay(date);
                    return (
                      <div
                        key={idx}
                        className={`border-r ${isWeekend ? 'w-12' : 'flex-1'}`}
                        style={{
                          backgroundColor: isToday(date) 
                            ? brandTheme.primary.paleBlue 
                            : isWeekend 
                            ? '#f3f4f6'
                            : brandTheme.background.secondary,
                          borderColor: brandTheme.border.light,
                          minWidth: isWeekend ? '48px' : '120px'
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Project bars for unassigned projects - positioned over the entire row */}
                <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                  {(() => {
                    const dateRangeStart = currentDates[0];
                    const dateRangeEnd = currentDates[currentDates.length - 1];
                    const today = new Date();
                    
                    // Show all projects without an assignee (includes projects with start date only)
                    const unassignedProjects = projects.filter(project => !project.assigneeId);
                    const unassignedTasks = standaloneTasks.filter(task => !task.assigneeId);
                    
                    // Calculate stacking positions to avoid overlaps
                    const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
                    const stackedUnassignedTasks = calculateTaskStacking(unassignedTasks, dateRangeStart, dateRangeEnd);
                    
                    // Calculate precise positions for each project
                    const unassignedProjectPositions = calculateProjectPositions(stackedUnassignedProjects, 48);
                    
                    const projectBars = stackedUnassignedProjects.map((stackedProject) => {
                      const { totalCount, unreadCount } = getUpdatesCountsForProject(stackedProject.project.id);
                      
                      return (
                        <ProjectBar
                          key={stackedProject.project.id}
                          projectId={stackedProject.project.id}
                          projectName={stackedProject.project.name}
                          weekStart={dateRangeStart}
                          weekEnd={dateRangeEnd}
                          projectStart={stackedProject.project.startDate}
                          projectEnd={stackedProject.project.endDate}
                          projectDeadline={stackedProject.project.deadline}
                          projectProgress={stackedProject.project.progress}
                          projectTasks={stackedProject.project.tasks}
                          today={today}
                          barHeightPx={48} // Smaller height to allow more stacking
                          stackLevel={stackedProject.stackLevel}
                          topPosition={unassignedProjectPositions.get(stackedProject.stackLevel)}
                          isClickable={true}
                          onClick={() => handleProjectClick(stackedProject.project)}
                          onProjectNameClick={handleProjectNameClick}
                          onTaskClick={handleTaskClick}
                          onUpdatesClick={handleUpdatesClick}
                          onTaskUpdatesClick={handleTaskUpdatesClick}
                          getTaskUpdatesCount={getUpdatesCountsForTask}
                          unreadUpdatesCount={unreadCount}
                          totalUpdatesCount={totalCount}
                        />
                      );
                    });
                    
                    const taskBars = stackedUnassignedTasks.map((stackedTask) => {
                      const { totalCount, unreadCount } = getUpdatesCountsForTask(stackedTask.task.id);
                      
                      return (
                        <StandaloneTaskBar
                          key={stackedTask.task.id}
                          taskId={stackedTask.task.id}
                          taskName={stackedTask.task.name}
                          taskType={stackedTask.task.taskType}
                          status={stackedTask.task.status}
                          weekStart={dateRangeStart}
                          weekEnd={dateRangeEnd}
                          taskStart={stackedTask.task.startDate}
                          taskEnd={stackedTask.task.endDate}
                          taskDeadline={stackedTask.task.deadline}
                          taskProgress={stackedTask.task.progress}
                          today={today}
                          barHeightPx={48}
                          stackLevel={stackedTask.stackLevel}
                          isClickable={true}
                          onClick={() => console.log('Clicked unassigned task:', stackedTask.task.name)}
                          onTaskClick={handleTaskClick}
                          onUpdatesClick={handleTaskUpdatesClick}
                          unreadUpdatesCount={unreadCount}
                          totalUpdatesCount={totalCount}
                        />
                      );
                    });
                    
                    return [...projectBars, ...taskBars];
                  })()}
                </div>
              </div>
              );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: brandTheme.text.primary }}
            >
              Assign Project: {selectedProject.name}
            </h3>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {users.length === 0 ? (
                <p style={{ color: brandTheme.text.muted }}>
                  No users available for assignment.
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssignProject(user.id)}
                    disabled={assigningProject}
                    className="w-full p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                        style={{ backgroundColor: user.profileColor || brandTheme.primary.navy }}
                      >
                        {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{getUserDisplayName(user)}</div>
                        <div 
                          className="text-sm"
                          style={{ color: brandTheme.text.muted }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProject(null);
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                style={{
                  borderColor: brandTheme.border.light,
                  color: brandTheme.text.primary
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProjectId && (
        <ProjectDetailsModal
          isOpen={showProjectDetailsModal}
          onClose={handleCloseProjectDetailsModal}
          projectId={selectedProjectId}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTaskId && (
        <TaskDetailsModal
          isOpen={showTaskDetailsModal}
          onClose={handleCloseTaskDetailsModal}
          taskId={selectedTaskId}
        />
      )}

      {/* Updates Details Modal */}
      {showUpdatesModal && selectedUpdatesProjectId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType="project"
          entityId={selectedUpdatesProjectId}
          entityName={projects.find(p => p.id === selectedUpdatesProjectId)?.name || 'Unknown Project'}
        />
      )}

      {/* Task Updates Details Modal */}
      {showTaskUpdatesModal && selectedUpdatesTaskId && (
        <UpdatesDetailsModal
          isOpen={showTaskUpdatesModal}
          onClose={handleCloseTaskUpdatesModal}
          entityType="task"
          entityId={selectedUpdatesTaskId}
          entityName={(() => {
            // Find the task name from all projects
            for (const project of projects) {
              const task = project.tasks?.find(t => t.id === selectedUpdatesTaskId);
              if (task) return task.name;
            }
            return 'Unknown Task';
          })()}
        />
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={showNewTaskModal}
        onClose={handleCloseNewTaskModal}
        title="Create New Standalone Task"
      >
        <form onSubmit={handleNewTaskSubmit} className="space-y-4">
          <Input
            label="Task Name"
            value={newTaskForm.name}
            onChange={(e) => handleNewTaskFormChange('name', e.target.value)}
            error={newTaskErrors.name}
            placeholder="Enter task name"
            required
          />
          
          <Textarea
            label="Description (optional)"
            value={newTaskForm.description}
            onChange={(e) => handleNewTaskFormChange('description', e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
          
          <Select
            label="Task Type"
            options={taskTypes.map((type) => ({
              value: type.name,
              label: type.name,
            }))}
            value={newTaskForm.taskType}
            onChange={(value) => handleNewTaskFormChange('taskType', value)}
            error={newTaskErrors.taskType}
            required
          />
          
          <Select
            label="Status"
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
            value={newTaskForm.status}
            onChange={(value) => handleNewTaskFormChange('status', value)}
          />
          
          <Select
            label="Priority"
            options={[
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
              { value: 'Very Low', label: 'Very Low' },
            ]}
            value={newTaskForm.priority}
            onChange={(value) => handleNewTaskFormChange('priority', value)}
          />
          
          <UserSelect
            label="Task Assignee (optional)"
            selectedUserId={newTaskForm.assigneeId}
            onChange={(value) => handleNewTaskFormChange('assigneeId', value)}
            users={getProductDevUsers()}
            placeholder="Unassigned"
          />
          
          <Input
            type="date"
            label="Start Date"
            value={newTaskForm.startDate}
            onChange={(e) => handleNewTaskFormChange('startDate', e.target.value)}
          />
          
          <Input
            type="date"
            label="End Date (optional)"
            value={newTaskForm.endDate}
            onChange={(e) => handleNewTaskFormChange('endDate', e.target.value)}
          />
          
          <Input
            type="date"
            label="Deadline (optional)"
            value={newTaskForm.deadline}
            onChange={(e) => handleNewTaskFormChange('deadline', e.target.value)}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseNewTaskModal}
              disabled={isSubmittingNewTask}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmittingNewTask}
            >
              {isSubmittingNewTask ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={handleCloseNewProjectModal}
        title="Create New Project"
      >
        <form onSubmit={handleNewProjectSubmit} className="space-y-4">
          <Input
            label="Project Name"
            value={newProjectForm.name}
            onChange={(e) => handleNewProjectFormChange('name', e.target.value)}
            error={newProjectErrors.name}
            placeholder="Enter project name"
            required
          />
          
          <Textarea
            label="Description (optional)"
            value={newProjectForm.description}
            onChange={(e) => handleNewProjectFormChange('description', e.target.value)}
            placeholder="Enter project description"
            rows={3}
          />
          
          {!showAddCategory ? (
            <Select
              label="Category"
              options={[
                ...getAvailableCategories().map((catName) => ({
                  value: catName,
                  label: catName,
                })),
                { value: 'ADD_NEW_CATEGORY', label: '+ Add New Category' }
              ]}
              value={newProjectForm.category}
              onChange={(value) => handleCategoryChange(value)}
              error={newProjectErrors.category}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                Add New Category
              </label>
              <div className="flex space-x-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCategory();
                    }
                  }}
                />
                <Button
                  onClick={handleAddNewCategory}
                  disabled={!newCategoryName.trim() || isAddingCategory}
                  className="whitespace-nowrap"
                >
                  {isAddingCategory ? 'Adding...' : 'Add'}
                </Button>
                <Button
                  onClick={handleCancelAddCategory}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <Select
            label="Status"
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
            value={newProjectForm.status}
            onChange={(value) => handleNewProjectFormChange('status', value)}
          />
          
          <Select
            label="Project Type"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Upcoming', label: 'Upcoming' },
              { value: 'Future', label: 'Future' },
              { value: 'On Hold', label: 'On Hold' },
            ]}
            value={newProjectForm.projectType}
            onChange={(value) => handleNewProjectFormChange('projectType', value)}
          />
          
          <UserSelect
            label="Project Assignee (optional)"
            selectedUserId={newProjectForm.assigneeId}
            onChange={(value) => handleNewProjectFormChange('assigneeId', value)}
            users={getProductDevUsers()}
            placeholder="Unassigned"
          />
          
          <Input
            type="date"
            label="Start Date"
            value={newProjectForm.startDate}
            onChange={(e) => handleNewProjectFormChange('startDate', e.target.value)}
          />
          
          <Input
            type="date"
            label="End Date (optional)"
            value={newProjectForm.endDate}
            onChange={(e) => handleNewProjectFormChange('endDate', e.target.value)}
          />
          
          <Input
            type="date"
            label="Deadline (optional)"
            value={newProjectForm.deadline}
            onChange={(e) => handleNewProjectFormChange('deadline', e.target.value)}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseNewProjectModal}
              disabled={isSubmittingNewProject}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmittingNewProject}
            >
              {isSubmittingNewProject ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FlowChartContainer;

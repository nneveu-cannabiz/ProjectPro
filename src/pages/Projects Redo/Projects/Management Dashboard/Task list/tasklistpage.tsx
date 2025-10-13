import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ListTodo, Search, Clock } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { Task, Project, User } from '../../../../../types';
import UserAvatar from '../../../../../components/UserAvatar';
import Input from '../../../../../components/ui/Input';
import TaskDetailsModal from '../../Flow Chart/utils/Profiles/TaskDetailsModal';
import SprintEpics from './sprintepics';
import SprintSummary from './sprintsummary';
import SprintUpdatesSection from './sprintupdatessection';
import HoursByDay from './hoursbyday';

interface TaskWithSprintInfo extends Task {
  project: Project;
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
  hoursSpent?: number;
  totalSubtasks?: number;
  completedSubtasks?: number;
  isSubtask?: boolean;
  parentTaskName?: string;
  parentTaskId?: string;
}

interface SprintGroupInfo {
  id: string;
  start_date: string | null;
  end_date: string | null;
  sprint_id: string | null;
}

const SprintsTaskListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithSprintInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [activeSprintGroups, setActiveSprintGroups] = useState<SprintGroupInfo[]>([]);
  
  // Column widths state
  const [todoColumnWidths, setTodoColumnWidths] = useState({
    taskName: 300,
    assignee: 60,
    subtasks: 120,
    priority: 90,
    sprint: 200,
  });
  const [inProgressColumnWidths, setInProgressColumnWidths] = useState({
    taskName: 300,
    assignee: 60,
    hoursSpent: 100,
    progress: 90,
    subtasks: 120,
    priority: 90,
    sprint: 200,
  });

  // Resize state
  const [resizing, setResizing] = useState<{ table: 'todo' | 'inprogress'; column: string; startX: number; startWidth: number } | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<{ table: 'todo' | 'inprogress'; column: string } | null>(null);

  interface UserTaskBreakdown {
    user: User;
    todo: number;
    inProgress: number;
    done: number;
    total: number;
  }

  const userBreakdowns = useMemo((): UserTaskBreakdown[] => {
    const breakdownMap = new Map<string, UserTaskBreakdown>();

    // Include unassigned tasks
    const unassignedUser: User = {
      id: 'unassigned',
      email: 'Unassigned',
      firstName: 'Unassigned',
      lastName: '',
      profileColor: '#6B7280',
      department: '',
      flowChart: '',
    };

    tasks.forEach((task) => {
      const user = task.assignee || unassignedUser;
      const userId = user.id;

      if (!breakdownMap.has(userId)) {
        breakdownMap.set(userId, {
          user,
          todo: 0,
          inProgress: 0,
          done: 0,
          total: 0,
        });
      }

      const breakdown = breakdownMap.get(userId)!;
      breakdown.total++;

      if (task.status === 'todo') breakdown.todo++;
      else if (task.status === 'in-progress') breakdown.inProgress++;
      else if (task.status === 'done') breakdown.done++;
    });

    // Convert to array and sort by total tasks (descending)
    return Array.from(breakdownMap.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const assigneesMap = new Map<string, User>();
    
    tasks.forEach((task) => {
      if (task.assignee && !assigneesMap.has(task.assignee.id)) {
        assigneesMap.set(task.assignee.id, task.assignee);
      }
    });
    
    return Array.from(assigneesMap.values()).sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );
  }, [tasks]);

  useEffect(() => {
    loadData();
  }, []);

  // Handle column resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + delta);

      if (resizing.table === 'todo') {
        setTodoColumnWidths(prev => ({
          ...prev,
          [resizing.column]: newWidth,
        }));
      } else {
        setInProgressColumnWidths(prev => ({
          ...prev,
          [resizing.column]: newWidth,
        }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing]);

  const startResize = (table: 'todo' | 'inprogress', column: string, startX: number, startWidth: number) => {
    setResizing({ table, column, startX, startWidth });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await loadSprintGroupTasks();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSprintGroupTasks = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Fetch all active sprint groups with date info
      const { data: allSprintGroups, error: sprintError } = await (supabase as any)
        .from('PMA_Sprints')
        .select(
          `
          id,
          project_id,
          selected_task_ids,
          sprint_type,
          status,
          name,
          ranking,
          start_date,
          end_date,
          sprint_id,
          PMA_Projects!inner (
            id,
            name,
            description,
            category,
            status,
            flow_chart
          )
        `
        )
        .eq('status', 'active')
        .not('selected_task_ids', 'is', null);

      if (sprintError) {
        console.error('Error fetching sprint groups:', sprintError);
        return;
      }

      if (!allSprintGroups || allSprintGroups.length === 0) {
        setTasks([]);
        setActiveSprintGroups([]);
        return;
      }

      // Filter sprint groups where current date is between start_date and end_date
      // Only include groups that have a sprint_id AND dates set
      const sprintGroups = allSprintGroups.filter((group: any) => {
        if (!group.sprint_id || !group.start_date || !group.end_date) {
          return false; // Exclude groups without sprint_id or dates
        }
        
        const startDate = new Date(group.start_date).toISOString().split('T')[0];
        const endDate = new Date(group.end_date).toISOString().split('T')[0];
        
        return currentDate >= startDate && currentDate <= endDate;
      });

      // Store active sprint groups info for SprintEpics
      setActiveSprintGroups(
        sprintGroups.map((group: any) => ({
          id: group.id,
          start_date: group.start_date,
          end_date: group.end_date,
          sprint_id: group.sprint_id,
        }))
      );

      if (sprintGroups.length === 0) {
        setTasks([]);
        return;
      }

      // Collect all task IDs from all sprint groups
      const allTaskIds: string[] = [];
      const taskToSprintMap: Record<string, { groupId: string; groupName: string; ranking?: Record<string, any>; sprintType?: string }> = {};

      sprintGroups.forEach((group: any) => {
        if (group.selected_task_ids && Array.isArray(group.selected_task_ids)) {
          group.selected_task_ids.forEach((taskId: string) => {
            if (!allTaskIds.includes(taskId)) {
              allTaskIds.push(taskId);
            }
            taskToSprintMap[taskId] = {
              groupId: group.id,
              groupName: group.name,
              ranking: group.ranking,
              sprintType: group.sprint_type,
            };
          });
        }
      });

      if (allTaskIds.length === 0) {
        setTasks([]);
        return;
      }

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('PMA_Tasks')
        .select(
          `
          *,
          PMA_Projects!inner(*)
        `
        )
        .in('id', allTaskIds);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return;
      }

      // Fetch all users for assignees
      const { data: usersData } = await supabase.from('PMA_Users').select('*');

      const usersMap: Record<string, User> = {};
      if (usersData) {
        usersData.forEach((u: any) => {
          usersMap[u.id] = {
            id: u.id,
            email: u.email,
            firstName: u.first_name || '',
            lastName: u.last_name || '',
            profileColor: u.profile_color || '#2563eb',
            department: u.department,
            flowChart: u.flow_chart,
          };
        });
      }

      // Fetch hours data for all tasks
      const { data: hoursData } = await (supabase as any)
        .from('PMA_Hours')
        .select('task_id, hours, is_planning_hours')
        .in('task_id', allTaskIds);

      // Calculate hours spent per task (excluding planning hours)
      const hoursMap: Record<string, number> = {};
      if (hoursData) {
        hoursData.forEach((hour: any) => {
          if (!hour.is_planning_hours) {
            if (!hoursMap[hour.task_id]) {
              hoursMap[hour.task_id] = 0;
            }
            hoursMap[hour.task_id] += hour.hours || 0;
          }
        });
      }

      // Fetch subtasks for all tasks with full details
      const { data: subtasksData } = await supabase
        .from('PMA_SubTasks')
        .select('*')
        .in('task_id', allTaskIds);

      // Calculate subtasks per task
      const subtasksMap: Record<string, { total: number; completed: number }> = {};
      if (subtasksData) {
        subtasksData.forEach((subtask: any) => {
          if (!subtasksMap[subtask.task_id]) {
            subtasksMap[subtask.task_id] = { total: 0, completed: 0 };
          }
          subtasksMap[subtask.task_id].total++;
          if (subtask.status === 'done') {
            subtasksMap[subtask.task_id].completed++;
          }
        });
      }

      // Map tasks with sprint info and ranking
      const enrichedTasks: TaskWithSprintInfo[] = (tasksData || []).map((task: any) => {
        const sprintInfo = taskToSprintMap[task.id];
        
        // Look for ranking with pattern "Sprint: [Sprint Name]"
        let sprintGroupRanking: number | undefined = undefined;
        if (sprintInfo?.ranking) {
          // Find the key that starts with "Sprint: "
          const sprintKey = Object.keys(sprintInfo.ranking).find(key => key.startsWith('Sprint: '));
          if (sprintKey) {
            sprintGroupRanking = sprintInfo.ranking[sprintKey];
          }
        }

        return {
          id: task.id,
          projectId: task.project_id,
          name: task.name,
          description: task.description || '',
          taskType: task.task_type,
          status: task.status,
          assigneeId: task.assignee_id,
          flowChart: task.flow_chart,
          priority: task.priority,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          startDate: task.start_date,
          endDate: task.end_date,
          deadline: task.deadline,
          tags: task.tags || [],
          progress: task.progress,
          project: {
            id: task.PMA_Projects.id,
            name: task.PMA_Projects.name,
            description: task.PMA_Projects.description || '',
            category: task.PMA_Projects.category,
            status: task.PMA_Projects.status,
            projectType: task.PMA_Projects.project_type || 'Active',
            assigneeId: task.PMA_Projects.assignee_id,
            flowChart: task.PMA_Projects.flow_chart,
            createdAt: task.PMA_Projects.created_at,
            updatedAt: task.PMA_Projects.updated_at,
          },
          assignee: task.assignee_id ? usersMap[task.assignee_id] : undefined,
          sprintGroupName: sprintInfo?.groupName || 'Unknown',
          sprintGroupId: sprintInfo?.groupId || '',
          sprintRank: sprintGroupRanking,
          sprintType: sprintInfo?.sprintType,
          hoursSpent: hoursMap[task.id] || 0,
          totalSubtasks: subtasksMap[task.id]?.total || 0,
          completedSubtasks: subtasksMap[task.id]?.completed || 0,
        };
      });

      // Create a map of task IDs to tasks for quick lookup
      const tasksMap = new Map<string, TaskWithSprintInfo>();
      enrichedTasks.forEach(task => tasksMap.set(task.id, task));

      // Add subtasks as individual entries (only if assignee differs from parent task)
      const subtaskEntries: TaskWithSprintInfo[] = [];
      if (subtasksData) {
        subtasksData.forEach((subtask: any) => {
          const parentTask = tasksMap.get(subtask.task_id);
          // Only add subtask if it has a different assignee than the parent task
          if (parentTask && subtask.assignee_id !== parentTask.assigneeId) {
            subtaskEntries.push({
              id: subtask.id,
              projectId: parentTask.projectId,
              name: subtask.name,
              description: subtask.description || '',
              taskType: 'subtask',
              status: subtask.status,
              assigneeId: subtask.assignee_id,
              flowChart: parentTask.flowChart,
              priority: parentTask.priority, // Inherit parent priority
              createdAt: subtask.created_at,
              updatedAt: subtask.updated_at,
              startDate: undefined,
              endDate: undefined,
              deadline: undefined,
              tags: [],
              progress: 0,
              project: parentTask.project,
              assignee: subtask.assignee_id ? usersMap[subtask.assignee_id] : undefined,
              sprintGroupName: parentTask.sprintGroupName,
              sprintGroupId: parentTask.sprintGroupId,
              sprintRank: parentTask.sprintRank,
              sprintType: parentTask.sprintType,
              hoursSpent: 0,
              totalSubtasks: 0,
              completedSubtasks: 0,
              isSubtask: true,
              parentTaskName: parentTask.name,
              parentTaskId: parentTask.id,
            });
          }
        });
      }

      // Combine tasks and subtasks
      const allItems = [...enrichedTasks, ...subtaskEntries];

      // Sort all items by sprint rank (lower rank number comes first)
      allItems.sort((a, b) => {
        const aRank = a.sprintRank;
        const bRank = b.sprintRank;

        if (aRank !== undefined && bRank !== undefined) {
          return aRank - bRank;
        }
        if (aRank !== undefined) return -1;
        if (bRank !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      setTasks(allItems);
    } catch (error) {
      console.error('Error loading sprint group tasks:', error);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.project.name.toLowerCase().includes(query) ||
          task.sprintGroupName.toLowerCase().includes(query) ||
          task.assignee?.firstName.toLowerCase().includes(query) ||
          task.assignee?.lastName.toLowerCase().includes(query)
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    // Filter by assignee
    if (filterAssignee) {
      filtered = filtered.filter((task) => task.assignee?.id === filterAssignee);
    }

    return filtered;
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  const getPriorityColor = (priority?: string): { bg: string; text: string } => {
    switch (priority) {
      case 'Critical':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'High':
        return { bg: '#fef3c7', text: '#f59e0b' };
      case 'Medium':
        return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy };
      case 'Low':
        return { bg: brandTheme.gray[200], text: brandTheme.text.muted };
      default:
        return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy };
    }
  };

  const handleTaskClick = (task: TaskWithSprintInfo) => {
    // If it's a subtask, open the parent task's modal instead
    const taskIdToOpen = task.isSubtask && task.parentTaskId ? task.parentTaskId : task.id;
    setSelectedTaskId(taskIdToOpen);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
    loadData(); // Refresh data after modal closes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4" style={{ color: brandTheme.text.muted }}>
            Loading Sprint Tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: brandTheme.background.primary }}>
      <div className="max-w-[95%] mx-auto p-6">
        {/* Header */}
        <div
          className="rounded-lg shadow-sm p-6 mb-6"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Current Sprint Tasks</h1>
              <p className="text-white opacity-90">
                View all tasks across active sprint groups
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ListTodo className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Sprint Groups Overview */}
        <SprintEpics tasks={tasks} sprintGroupsInfo={activeSprintGroups} />

        {/* Hours by Day - Show hours timeline for active sprint date range */}
        {activeSprintGroups.length > 0 && (() => {
          // Parse ISO date string as local date to avoid timezone offset issues
          const parseISODate = (dateString: string): Date => {
            const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
            return new Date(year, month - 1, day);
          };
          
          // Calculate the overall date range from all active sprint groups
          const startDates = activeSprintGroups
            .filter(g => g.start_date)
            .map(g => parseISODate(g.start_date!));
          const endDates = activeSprintGroups
            .filter(g => g.end_date)
            .map(g => parseISODate(g.end_date!));
          
          if (startDates.length > 0 && endDates.length > 0) {
            const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
            const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
            
            return (
              <HoursByDay
                startDate={earliestStart}
                endDate={latestEnd}
              />
            );
          }
          return null;
        })()}

        {/* Stats Overview */}
        <SprintSummary tasks={tasks} userBreakdowns={userBreakdowns} />

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: brandTheme.text.muted }}
              />
              <Input
                type="text"
                placeholder="Search tasks, projects, or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{
              borderColor: brandTheme.border.light,
              color: brandTheme.text.primary,
            }}
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        {uniqueAssignees.length > 0 && (
          <div
            className="mb-4 p-2 rounded-lg"
            style={{ backgroundColor: brandTheme.background.secondary }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
                Filter:
              </span>
              
              {/* All button */}
              <button
                onClick={() => setFilterAssignee(null)}
                className="px-2 py-1 rounded text-xs font-medium transition-all"
                style={{
                  backgroundColor: filterAssignee === null ? brandTheme.primary.navy : brandTheme.background.primary,
                  color: filterAssignee === null ? '#FFFFFF' : brandTheme.text.primary,
                  borderColor: filterAssignee === null ? brandTheme.primary.lightBlue : brandTheme.border.medium,
                  border: filterAssignee === null ? `2px solid ${brandTheme.primary.lightBlue}` : '1px solid',
                }}
              >
                All
              </button>

              {/* Assignee avatars */}
              {uniqueAssignees.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setFilterAssignee(user.id)}
                  className="transition-all rounded-full"
                  style={{
                    opacity: filterAssignee === user.id ? 1 : 0.7,
                    outline: filterAssignee === user.id ? `2px solid ${brandTheme.primary.lightBlue}` : 'none',
                    outlineOffset: '1px',
                  }}
                  title={`${user.firstName} ${user.lastName}`}
                >
                  <UserAvatar user={user} size="sm" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout - To Do and In Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* To Do Section */}
          <div
            className="rounded-lg shadow-sm overflow-hidden"
            style={{ backgroundColor: brandTheme.background.secondary }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: brandTheme.gray[400] }}
            >
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">To Do</h2>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                }}
              >
                {filteredTasks.filter((t) => t.status === 'todo').length}
              </span>
            </div>
            <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
              {filteredTasks.filter((t) => t.status === 'todo').length === 0 ? (
                <div className="text-center py-12">
                  <ListTodo
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: brandTheme.text.muted }}
                  />
                  <p style={{ color: brandTheme.text.muted }}>No To Do tasks</p>
                </div>
              ) : (
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <thead className="sticky top-0" style={{ backgroundColor: brandTheme.gray[100] }}>
                    <tr className="border-b" style={{ borderColor: brandTheme.border.light }}>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${todoColumnWidths.taskName}px`,
                          backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Task Name
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('todo', 'taskName', e.clientX, todoColumnWidths.taskName)}
                          onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'taskName' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'taskName')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${todoColumnWidths.assignee}px`,
                          backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Assignee
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('todo', 'assignee', e.clientX, todoColumnWidths.assignee)}
                          onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'assignee' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'assignee')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${todoColumnWidths.subtasks}px`,
                          backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Subtasks
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('todo', 'subtasks', e.clientX, todoColumnWidths.subtasks)}
                          onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'subtasks' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'subtasks')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${todoColumnWidths.priority}px`,
                          backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Priority
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('todo', 'priority', e.clientX, todoColumnWidths.priority)}
                          onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'priority' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'priority') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'priority')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${todoColumnWidths.sprint}px`,
                          backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Sprint
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('todo', 'sprint', e.clientX, todoColumnWidths.sprint)}
                          onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'sprint' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'sprint')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks
                      .filter((t) => t.status === 'todo')
                      .map((task) => {
                        const priorityColors = getPriorityColor(task.priority);
                        return (
                          <tr
                            key={task.id}
                            className="border-b cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                              borderColor: brandTheme.border.light,
                              borderLeftWidth: '3px',
                              borderLeftStyle: 'solid',
                              borderLeftColor: priorityColors.text,
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                            {/* Task Name */}
                            <td 
                              className="px-3 py-2 relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {task.isSubtask && (
                                  <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                                    ↳
                                  </span>
                                )}
                                <span
                                  className="font-medium hover:underline text-sm line-clamp-1"
                                  style={{ color: task.isSubtask ? brandTheme.text.secondary : brandTheme.primary.navy }}
                                  title={task.isSubtask ? `Subtask of: ${task.parentTaskName}` : task.name}
                                >
                                  {task.name}
                                </span>
                              </div>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('todo', 'taskName', e.clientX, todoColumnWidths.taskName);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'taskName' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'taskName')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Assignee */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              {task.assignee ? (
                                <div className="flex items-center justify-center">
                                  <UserAvatar user={task.assignee} size="sm" />
                                </div>
                              ) : (
                                <span style={{ color: brandTheme.text.muted, fontSize: '0.65rem' }}>
                                  -
                                </span>
                              )}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('todo', 'assignee', e.clientX, todoColumnWidths.assignee);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'assignee' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'assignee')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Subtasks */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              {!task.isSubtask && task.totalSubtasks ? (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: brandTheme.text.primary }}
                                >
                                  {task.completedSubtasks}/{task.totalSubtasks}
                                </span>
                              ) : (
                                <span
                                  className="text-xs"
                                  style={{ color: brandTheme.text.muted }}
                                >
                                  -
                                </span>
                              )}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('todo', 'subtasks', e.clientX, todoColumnWidths.subtasks);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'subtasks' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'subtasks')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Priority */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: priorityColors.bg,
                                  color: priorityColors.text,
                                }}
                              >
                                {task.priority || 'Medium'}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('todo', 'priority', e.clientX, todoColumnWidths.priority);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'priority' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'priority') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'priority')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Sprint */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: brandTheme.primary.paleBlue,
                                  color: brandTheme.primary.navy,
                                }}
                              >
                                {task.sprintGroupName}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('todo', 'sprint', e.clientX, todoColumnWidths.sprint);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'todo', column: 'sprint' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'todo' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'todo' && hoveredColumn?.column === 'sprint')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* In Progress Section */}
          <div
            className="rounded-lg shadow-sm overflow-hidden"
            style={{ backgroundColor: brandTheme.background.secondary }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: brandTheme.primary.lightBlue }}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">In Progress</h2>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                }}
              >
                {filteredTasks.filter((t) => t.status === 'in-progress').length}
              </span>
            </div>
            <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
              {filteredTasks.filter((t) => t.status === 'in-progress').length === 0 ? (
                <div className="text-center py-12">
                  <Clock
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: brandTheme.text.muted }}
                  />
                  <p style={{ color: brandTheme.text.muted }}>No In Progress tasks</p>
                </div>
              ) : (
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <thead className="sticky top-0" style={{ backgroundColor: brandTheme.gray[100] }}>
                    <tr className="border-b" style={{ borderColor: brandTheme.border.light }}>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.taskName}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Task Name
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'taskName', e.clientX, inProgressColumnWidths.taskName)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'taskName' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'taskName')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.assignee}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Assignee
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'assignee', e.clientX, inProgressColumnWidths.assignee)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'assignee' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'assignee')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.hoursSpent}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Hours Spent
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'hoursSpent', e.clientX, inProgressColumnWidths.hoursSpent)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'hoursSpent' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'hoursSpent')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.progress}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'progress' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Progress
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'progress', e.clientX, inProgressColumnWidths.progress)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'progress' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'progress') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'progress')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.subtasks}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Subtasks
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'subtasks', e.clientX, inProgressColumnWidths.subtasks)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'subtasks' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'subtasks')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.priority}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Priority
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'priority', e.clientX, inProgressColumnWidths.priority)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'priority' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'priority') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'priority')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                        style={{ 
                          color: brandTheme.text.secondary, 
                          width: `${inProgressColumnWidths.sprint}px`,
                          backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        Sprint
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => startResize('inprogress', 'sprint', e.clientX, inProgressColumnWidths.sprint)}
                          onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'sprint' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'sprint')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks
                      .filter((t) => t.status === 'in-progress')
                      .map((task) => {
                        const priorityColors = getPriorityColor(task.priority);
                        return (
                          <tr
                            key={task.id}
                            className="border-b cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                              borderColor: brandTheme.border.light,
                              borderLeftWidth: '3px',
                              borderLeftStyle: 'solid',
                              borderLeftColor: priorityColors.text,
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                            {/* Task Name */}
                            <td 
                              className="px-3 py-2 relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {task.isSubtask && (
                                  <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                                    ↳
                                  </span>
                                )}
                                <span
                                  className="font-medium hover:underline text-sm line-clamp-1"
                                  style={{ color: task.isSubtask ? brandTheme.text.secondary : brandTheme.primary.navy }}
                                  title={task.isSubtask ? `Subtask of: ${task.parentTaskName}` : task.name}
                                >
                                  {task.name}
                                </span>
                              </div>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'taskName', e.clientX, inProgressColumnWidths.taskName);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'taskName' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'taskName')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Assignee */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              {task.assignee ? (
                                <div className="flex items-center justify-center">
                                  <UserAvatar user={task.assignee} size="sm" />
                                </div>
                              ) : (
                                <span style={{ color: brandTheme.text.muted, fontSize: '0.65rem' }}>
                                  -
                                </span>
                              )}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'assignee', e.clientX, inProgressColumnWidths.assignee);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'assignee' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'assignee')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Hours Spent */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="text-xs font-semibold"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {task.hoursSpent ? `${task.hoursSpent.toFixed(1)}h` : '0h'}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'hoursSpent', e.clientX, inProgressColumnWidths.hoursSpent);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'hoursSpent' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'hoursSpent')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Progress */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'progress' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="text-xs font-semibold"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {task.progress !== undefined && task.progress !== null ? `${task.progress}%` : '0%'}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'progress', e.clientX, inProgressColumnWidths.progress);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'progress' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'progress') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'progress')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Subtasks */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              {task.totalSubtasks ? (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: brandTheme.text.primary }}
                                >
                                  {task.completedSubtasks}/{task.totalSubtasks}
                                </span>
                              ) : (
                                <span
                                  className="text-xs"
                                  style={{ color: brandTheme.text.muted }}
                                >
                                  -
                                </span>
                              )}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'subtasks', e.clientX, inProgressColumnWidths.subtasks);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'subtasks' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'subtasks')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Priority */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: priorityColors.bg,
                                  color: priorityColors.text,
                                }}
                              >
                                {task.priority || 'Medium'}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'priority', e.clientX, inProgressColumnWidths.priority);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'priority' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'priority') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'priority')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>

                            {/* Sprint */}
                            <td 
                              className="px-3 py-2 whitespace-nowrap relative"
                              style={{
                                backgroundColor: hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                              }}
                            >
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: brandTheme.primary.paleBlue,
                                  color: brandTheme.primary.navy,
                                }}
                              >
                                {task.sprintGroupName}
                              </span>
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  startResize('inprogress', 'sprint', e.clientX, inProgressColumnWidths.sprint);
                                }}
                                onMouseEnter={() => setHoveredColumn({ table: 'inprogress', column: 'sprint' })}
                                onMouseLeave={() => setHoveredColumn(null)}
                                style={{ 
                                  backgroundColor: (resizing?.table === 'inprogress' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'inprogress' && hoveredColumn?.column === 'sprint')
                                    ? brandTheme.primary.lightBlue 
                                    : 'transparent' 
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sprint Updates Section */}
        <SprintUpdatesSection tasks={tasks} />
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={true}
          taskId={selectedTaskId}
          onClose={handleCloseTaskModal}
        />
      )}
    </div>
  );
};

export default SprintsTaskListPage;


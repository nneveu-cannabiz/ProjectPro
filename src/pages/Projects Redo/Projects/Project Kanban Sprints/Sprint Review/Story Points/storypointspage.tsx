import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { GripVertical, Award, Search, Hash } from 'lucide-react';
import { supabase } from '../../../../../../lib/supabase';
import { Task, Project, User } from '../../../../../../types';
import UserAvatar from '../../../../../../components/UserAvatar';
import Badge from '../../../../../../components/ui/Badge';
import Input from '../../../../../../components/ui/Input';
import TaskDetailsModal from '../../../Flow Chart/utils/Profiles/TaskDetailsModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskWithSprintInfo extends Task {
  project: Project;
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  taskRank?: number;
}

interface SortableTaskRowProps {
  task: TaskWithSprintInfo;
  index: number;
  onTaskClick: (taskId: string) => void;
  getStatusColor: (status: string) => { bg: string; text: string };
  getStatusText: (status: string) => string;
  getPriorityColor: (priority?: string) => { bg: string; text: string };
  formatDate: (dateString?: string) => string;
}

const SortableTaskRow: React.FC<SortableTaskRowProps> = ({
  task,
  index,
  onTaskClick,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  formatDate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColors = getStatusColor(task.status);
  const priorityColors = getPriorityColor(task.priority);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50 transition-colors border-b"
      onDoubleClick={() => onTaskClick(task.id)}
    >
      {/* Rank & Drag Handle */}
      <td className="px-4 py-3 w-20">
        <div className="flex items-center space-x-2">
          <span
            className="flex items-center justify-center font-bold text-xs rounded-md px-2 py-1 min-w-[40px]"
            style={{
              backgroundColor: brandTheme.primary.navy,
              color: '#FFFFFF',
            }}
          >
            #{index + 1}
          </span>
          <div
            ref={setActivatorNodeRef}
            className="p-1 rounded hover:bg-blue-100 transition-colors cursor-grab active:cursor-grabbing"
            style={{
              color: brandTheme.text.secondary,
              touchAction: 'none',
              userSelect: 'none',
            }}
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
        </div>
      </td>

      {/* Task Name */}
      <td className="px-4 py-3">
        <button
          onClick={() => onTaskClick(task.id)}
          className="text-left hover:underline font-medium transition-all"
          style={{ color: brandTheme.primary.navy }}
        >
          {task.name}
        </button>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}
        >
          {getStatusText(task.status)}
        </span>
      </td>

      {/* Assignee */}
      <td className="px-4 py-3">
        {task.assignee ? (
          <div className="flex items-center space-x-2">
            <UserAvatar user={task.assignee} size="sm" />
            <span className="text-sm" style={{ color: brandTheme.text.primary }}>
              {task.assignee.firstName} {task.assignee.lastName}
            </span>
          </div>
        ) : (
          <span className="text-sm" style={{ color: brandTheme.text.muted }}>
            Unassigned
          </span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
          {formatDate(task.deadline || task.endDate)}
        </span>
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: priorityColors.bg,
            color: priorityColors.text,
          }}
        >
          {task.priority || 'Medium'}
        </span>
      </td>

      {/* Project Name */}
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: brandTheme.text.primary }}>
          {task.project.name}
        </span>
      </td>

      {/* Sprint Group Name */}
      <td className="px-4 py-3">
        <Badge variant="default">{task.sprintGroupName}</Badge>
      </td>
    </tr>
  );
};

const StoryPointsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithSprintInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

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
      // Fetch all active sprint groups
      const { data: sprintGroups, error: sprintError } = await (supabase as any)
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

      if (!sprintGroups || sprintGroups.length === 0) {
        setTasks([]);
        return;
      }

      // Collect all task IDs from all sprint groups
      const allTaskIds: string[] = [];
      const taskToSprintMap: Record<string, { groupId: string; groupName: string; ranking?: Record<string, any> }> = {};

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

      // Map tasks with sprint info and ranking
      const enrichedTasks: TaskWithSprintInfo[] = (tasksData || []).map((task: any) => {
        const sprintInfo = taskToSprintMap[task.id];
        const taskRanking = sprintInfo?.ranking?.['Story Points'] || {};
        const taskRank = taskRanking[task.id];

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
          taskRank: taskRank,
        };
      });

      // Sort tasks by rank (ranked first, then unranked alphabetically)
      enrichedTasks.sort((a, b) => {
        const aRank = a.taskRank;
        const bRank = b.taskRank;

        if (aRank !== undefined && bRank !== undefined) {
          return aRank - bRank;
        }
        if (aRank !== undefined) return -1;
        if (bRank !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error loading sprint group tasks:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder tasks locally
    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reorderedTasks);

    // Update rankings in the database
    await updateTaskRankings(reorderedTasks);
  };

  const updateTaskRankings = async (reorderedTasks: TaskWithSprintInfo[]) => {
    try {
      // Group tasks by sprint group ID
      const tasksBySprintGroup: Record<string, TaskWithSprintInfo[]> = {};
      reorderedTasks.forEach((task) => {
        if (!tasksBySprintGroup[task.sprintGroupId]) {
          tasksBySprintGroup[task.sprintGroupId] = [];
        }
        tasksBySprintGroup[task.sprintGroupId].push(task);
      });

      // Update each sprint group's ranking
      await Promise.all(
        Object.entries(tasksBySprintGroup).map(async ([sprintGroupId, groupTasks]) => {
          // Fetch current sprint group data
          const { data: sprintGroup, error: fetchError } = await (supabase as any)
            .from('PMA_Sprints')
            .select('ranking')
            .eq('id', sprintGroupId)
            .single();

          if (fetchError) {
            console.error('Error fetching sprint group:', fetchError);
            return;
          }

          const currentRanking = ((sprintGroup as any)?.ranking as Record<string, any>) || {};
          const storyPointsRanking: Record<string, number> = currentRanking['Story Points'] || {};

          // Update rankings for tasks in this group
          groupTasks.forEach((task, index) => {
            storyPointsRanking[task.id] = index + 1;
          });

          const updatedRanking = {
            ...currentRanking,
            'Story Points': storyPointsRanking,
          };

          // Update the sprint group
          const { error: updateError } = await (supabase as any)
            .from('PMA_Sprints')
            .update({ ranking: updatedRanking })
            .eq('id', sprintGroupId);

          if (updateError) {
            console.error('Error updating sprint group ranking:', updateError);
          }
        })
      );

      console.log('Task rankings updated successfully');
    } catch (error) {
      console.error('Error updating task rankings:', error);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        task.project.name.toLowerCase().includes(query) ||
        task.sprintGroupName.toLowerCase().includes(query) ||
        task.assignee?.firstName.toLowerCase().includes(query) ||
        task.assignee?.lastName.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const getStatusColor = (status: string): { bg: string; text: string } => {
    switch (status) {
      case 'done':
        return { bg: brandTheme.status.success + '20', text: brandTheme.status.success };
      case 'in-progress':
        return { bg: brandTheme.primary.lightBlue + '20', text: brandTheme.primary.navy };
      case 'todo':
        return { bg: brandTheme.gray[200], text: brandTheme.text.secondary };
      default:
        return { bg: brandTheme.gray[200], text: brandTheme.text.secondary };
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'done':
        return 'Done';
      case 'in-progress':
        return 'In Progress';
      case 'todo':
        return 'To Do';
      default:
        return status;
    }
  };

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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
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
            Loading Story Points...
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
              <h1 className="text-3xl font-bold text-white mb-2">Story Points Tracker</h1>
              <p className="text-white opacity-90">
                Track and rank tasks across all sprint groups
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.primary.navy}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Total Tasks
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.text.primary }}>
                  {tasks.length}
                </p>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: brandTheme.primary.paleBlue }}
              >
                <Hash className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.status.success}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Completed Tasks
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.text.primary }}>
                  {tasks.filter((t) => t.status === 'done').length}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: '#dcfce7' }}>
                <Award className="w-6 h-6" style={{ color: brandTheme.status.success }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.primary.lightBlue}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  In Progress
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.text.primary }}>
                  {tasks.filter((t) => t.status === 'in-progress').length}
                </p>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: brandTheme.primary.paleBlue }}
              >
                <Hash className="w-6 h-6" style={{ color: brandTheme.primary.lightBlue }} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
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

        {/* Tasks Table */}
        <div
          className="rounded-lg shadow-sm overflow-hidden"
          style={{ backgroundColor: brandTheme.background.secondary }}
        >
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Award
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: brandTheme.text.muted }}
              />
              <h2 className="text-2xl font-semibold mb-2" style={{ color: brandTheme.text.primary }}>
                No Tasks Found
              </h2>
              <p className="text-lg" style={{ color: brandTheme.text.muted }}>
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'No tasks are currently in any sprint groups'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b-2"
                    style={{
                      backgroundColor: brandTheme.primary.navy,
                      borderColor: brandTheme.border.brand,
                    }}
                  >
                    <th className="px-4 py-3 text-left text-sm font-bold text-white w-20">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">Task Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">Assignee</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">Due Date</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">
                      Project Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white">
                      Sprint Group (Epic)
                    </th>
                  </tr>
                </thead>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {filteredTasks.map((task, index) => (
                        <SortableTaskRow
                          key={task.id}
                          task={task}
                          index={index}
                          onTaskClick={handleTaskClick}
                          getStatusColor={getStatusColor}
                          getStatusText={getStatusText}
                          getPriorityColor={getPriorityColor}
                          formatDate={formatDate}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </DndContext>
              </table>
            </div>
          )}
        </div>
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

export default StoryPointsPage;

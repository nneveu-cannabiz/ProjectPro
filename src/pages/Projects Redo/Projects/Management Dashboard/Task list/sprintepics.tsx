import React, { useMemo, useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ListTodo, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, User } from '../../../../../types';
import { supabase } from '../../../../../lib/supabase';
import InSprintReviewModal from '../../Project Kanban Sprints/Sprint Review/InSprintReviewModal';

interface TaskWithSprintInfo extends Task {
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
}

interface SprintGroupInfo {
  id: string;
  start_date: string | null;
  end_date: string | null;
  sprint_id: string | null;
}

interface SprintEpicsProps {
  tasks: TaskWithSprintInfo[];
  sprintGroupsInfo: SprintGroupInfo[];
}

interface SprintGroup {
  name: string;
  id: string;
  taskCount: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  lowestRank: number;
  sprintType?: string;
  startDate: string | null;
  endDate: string | null;
  sprintId: string | null;
}

interface ModalSprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  status: string;
  name: string;
  description?: string;
  project: {
    id: string;
    name: string;
    description?: string;
    priority?: string;
    assignee_id?: string;
    status?: string;
  };
}

const SprintEpics: React.FC<SprintEpicsProps> = ({ tasks, sprintGroupsInfo }) => {
  const [selectedSprintGroup, setSelectedSprintGroup] = useState<ModalSprintGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [subtasksMap, setSubtasksMap] = useState<Map<string, any[]>>(new Map());

  // Fetch subtasks for all tasks
  useEffect(() => {
    const fetchSubtasks = async () => {
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) return;

      const { data: subtasksData, error } = await supabase
        .from('PMA_SubTasks')
        .select(`
          *,
          assignee:assignee_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('task_id', taskIds);

      if (error) {
        console.error('Error fetching subtasks:', error);
        return;
      }

      // Group subtasks by task_id
      const newSubtasksMap = new Map<string, any[]>();
      subtasksData?.forEach((subtask: any) => {
        const taskId = subtask.task_id;
        if (!newSubtasksMap.has(taskId)) {
          newSubtasksMap.set(taskId, []);
        }
        newSubtasksMap.get(taskId)!.push(subtask);
      });

      setSubtasksMap(newSubtasksMap);
    };

    fetchSubtasks();
  }, [tasks]);

  const sprintGroups = useMemo(() => {
    const groupsMap = new Map<string, SprintGroup>();

    // Create a map of sprint group info for quick lookup
    const sprintInfoMap = new Map(
      sprintGroupsInfo.map(info => [info.id, info])
    );

    tasks.forEach((task) => {
      const groupId = task.sprintGroupId;
      const taskRank = typeof task.sprintRank === 'number' ? task.sprintRank : Infinity;
      const groupInfo = sprintInfoMap.get(groupId);
      
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          name: task.sprintGroupName,
          id: groupId,
          taskCount: 0,
          todoCount: 0,
          inProgressCount: 0,
          doneCount: 0,
          lowestRank: taskRank,
          sprintType: task.sprintType,
          startDate: groupInfo?.start_date || null,
          endDate: groupInfo?.end_date || null,
          sprintId: groupInfo?.sprint_id || null,
        });
      }

      const group = groupsMap.get(groupId)!;
      group.taskCount++;
      
      // Count by status
      if (task.status === 'todo') {
        group.todoCount++;
      } else if (task.status === 'in-progress') {
        group.inProgressCount++;
      } else if (task.status === 'done') {
        group.doneCount++;
      }
      
      // Keep track of the lowest rank number (which appears first)
      if (typeof task.sprintRank === 'number' && task.sprintRank < group.lowestRank) {
        group.lowestRank = task.sprintRank;
      }
    });

    // Convert to array and sort by rank (lowest rank number first)
    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.lowestRank === Infinity && b.lowestRank === Infinity) {
        return a.name.localeCompare(b.name);
      }
      if (a.lowestRank === Infinity) return 1;
      if (b.lowestRank === Infinity) return -1;
      return a.lowestRank - b.lowestRank;
    });
  }, [tasks, sprintGroupsInfo]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    // Parse ISO date string to avoid timezone shift
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSprintTypeColor = (sprintType?: string) => {
    switch (sprintType) {
      case 'sprint-1':
        return { bg: '#dbeafe', text: brandTheme.primary.lightBlue, border: brandTheme.primary.lightBlue };
      case 'sprint-2':
        return { bg: '#fef3c7', text: '#f59e0b', border: '#f59e0b' };
      default:
        return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy, border: brandTheme.primary.navy };
    }
  };

  if (sprintGroups.length === 0) {
    return null;
  }

  // Get dates from first group (all groups have same dates since they're filtered by same sprint_id)
  const firstGroup = sprintGroups[0];
  const sprintId = firstGroup?.sprintId;
  const startDate = firstGroup?.startDate;
  const endDate = firstGroup?.endDate;

  // Calculate sprint progress
  const calculateSprintProgress = () => {
    if (!startDate || !endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [startYear, startMonth, startDay] = startDate.split('T')[0].split('-');
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    
    const [endYear, endMonth, endDay] = endDate.split('T')[0].split('-');
    const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInto = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      daysInto: Math.max(1, daysInto),
      daysRemaining: Math.max(0, daysRemaining),
      totalDays
    };
  };

  const sprintProgress = calculateSprintProgress();

  const handleSprintClick = async (sprintGroupId: string) => {
    try {
      // Fetch the sprint group with project details
      const { data: sprintGroupData, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select(`
          id,
          project_id,
          selected_task_ids,
          sprint_type,
          status,
          name,
          description,
          PMA_Projects!inner (
            id,
            name,
            description,
            priority,
            assignee_id,
            status
          )
        `)
        .eq('id', sprintGroupId)
        .single();

      if (error) {
        console.error('Error fetching sprint group:', error);
        return;
      }

      if (sprintGroupData) {
        // Transform the data to match the modal's expected format
        const modalData: ModalSprintGroup = {
          id: sprintGroupData.id,
          project_id: sprintGroupData.project_id,
          selected_task_ids: sprintGroupData.selected_task_ids || [],
          sprint_type: sprintGroupData.sprint_type,
          status: sprintGroupData.status,
          name: sprintGroupData.name,
          description: sprintGroupData.description,
          project: {
            id: sprintGroupData.PMA_Projects.id,
            name: sprintGroupData.PMA_Projects.name,
            description: sprintGroupData.PMA_Projects.description,
            priority: sprintGroupData.PMA_Projects.priority,
            assignee_id: sprintGroupData.PMA_Projects.assignee_id,
            status: sprintGroupData.PMA_Projects.status,
          },
        };

        setSelectedSprintGroup(modalData);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error opening sprint modal:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSprintGroup(null);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getGroupTasks = (groupId: string) => {
    return tasks.filter(task => task.sprintGroupId === groupId);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Sprint Dates Section */}
      {sprintId && (startDate || endDate) && sprintProgress && (
        <div
          className="rounded-lg shadow-sm p-4"
          style={{ backgroundColor: brandTheme.background.secondary }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                Day {sprintProgress.daysInto} of {sprintProgress.totalDays}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
              <span className="text-base font-bold" style={{ color: brandTheme.text.primary }}>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                {sprintProgress.daysRemaining} {sprintProgress.daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Sprint Groups */}
      <div
        className="rounded-lg shadow-sm p-5"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
          <h2 className="text-lg font-bold" style={{ color: brandTheme.text.primary }}>
            Active Sprint Groups
          </h2>
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: brandTheme.primary.paleBlue,
              color: brandTheme.primary.navy,
            }}
          >
            {sprintGroups.length}
          </span>
        </div>

      <div className="space-y-2">
        {sprintGroups.map((group) => {
          const colors = getSprintTypeColor(group.sprintType);
          const isExpanded = expandedGroups.has(group.id);
          const groupTasks = getGroupTasks(group.id);
          
          return (
            <div
              key={group.id}
              className="rounded-lg border-l-4 transition-all"
              style={{
                backgroundColor: colors.bg,
                borderLeftColor: colors.border,
              }}
            >
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-3 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors flex-shrink-0"
                    style={{ color: colors.text }}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {group.lowestRank !== Infinity && (
                    <div
                      className="px-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        color: colors.text,
                      }}
                    >
                      #{group.lowestRank}
                    </div>
                  )}
                  <h3
                    className="font-semibold text-sm flex-1 truncate cursor-pointer hover:underline transition-all"
                    style={{ color: colors.text }}
                    onClick={() => handleSprintClick(group.id)}
                    title="Click to view sprint details"
                  >
                    {group.name}
                  </h3>
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="relative rounded-full overflow-hidden"
                      style={{
                        width: '60px',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 h-full transition-all"
                        style={{
                          width: `${Math.round(((group.doneCount * 100) + (group.inProgressCount * 50)) / (group.taskCount || 1))}%`,
                          backgroundColor: colors.text,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold whitespace-nowrap"
                      style={{ color: colors.text, minWidth: '32px' }}
                    >
                      {Math.round(((group.doneCount * 100) + (group.inProgressCount * 50)) / (group.taskCount || 1))}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <ListTodo className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.7 }} />
                    <span
                      className="text-xs font-bold whitespace-nowrap"
                      style={{ color: colors.text }}
                    >
                      {group.taskCount}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: colors.text, opacity: 0.5 }}>|</span>
                  <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: colors.text, opacity: 0.7 }}
                  >
                    To Do: {group.todoCount}
                  </span>
                  <span className="text-xs" style={{ color: colors.text, opacity: 0.5 }}>•</span>
                  <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: colors.text, opacity: 0.7 }}
                  >
                    In Progress: {group.inProgressCount}
                  </span>
                  <span className="text-xs" style={{ color: colors.text, opacity: 0.5 }}>•</span>
                  <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: colors.text, opacity: 0.7 }}
                  >
                    Done: {group.doneCount}
                  </span>
                </div>
              </div>

              {/* Expanded Content - Three Columns */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {/* To Do Column */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      <h4
                        className="text-xs font-bold mb-2 uppercase"
                        style={{ color: colors.text }}
                      >
                        To Do ({groupTasks.filter(t => t.status === 'todo').length})
                      </h4>
                      <div className="space-y-2">
                        {groupTasks
                          .filter(task => task.status === 'todo')
                          .map(task => (
                            <div key={task.id}>
                              <div
                                className="p-2 rounded text-xs"
                                style={{
                                  backgroundColor: brandTheme.background.primary,
                                  border: `1px solid ${brandTheme.border.light}`,
                                }}
                              >
                                <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                  {task.name}
                                </div>
                                {task.assignee && (
                                  <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                    {task.assignee.firstName} {task.assignee.lastName}
                                  </div>
                                )}
                              </div>
                              {/* Subtasks */}
                              {subtasksMap.get(task.id)?.filter(st => st.status === 'todo').map(subtask => (
                                <div
                                  key={subtask.id}
                                  className="ml-4 mt-1 p-2 rounded text-xs"
                                  style={{
                                    backgroundColor: brandTheme.primary.paleBlue + '40',
                                    border: `1px solid ${brandTheme.border.light}`,
                                  }}
                                >
                                  <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                    ↳ {subtask.name}
                                  </div>
                                  {subtask.assignee && (
                                    <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                      {subtask.assignee.first_name} {subtask.assignee.last_name}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* In Progress Column */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      <h4
                        className="text-xs font-bold mb-2 uppercase"
                        style={{ color: colors.text }}
                      >
                        In Progress ({groupTasks.filter(t => t.status === 'in-progress').length})
                      </h4>
                      <div className="space-y-2">
                        {groupTasks
                          .filter(task => task.status === 'in-progress')
                          .map(task => (
                            <div key={task.id}>
                              <div
                                className="p-2 rounded text-xs"
                                style={{
                                  backgroundColor: brandTheme.background.primary,
                                  border: `1px solid ${brandTheme.border.light}`,
                                }}
                              >
                                <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                  {task.name}
                                </div>
                                {task.assignee && (
                                  <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                    {task.assignee.firstName} {task.assignee.lastName}
                                  </div>
                                )}
                              </div>
                              {/* Subtasks */}
                              {subtasksMap.get(task.id)?.filter(st => st.status === 'in-progress').map(subtask => (
                                <div
                                  key={subtask.id}
                                  className="ml-4 mt-1 p-2 rounded text-xs"
                                  style={{
                                    backgroundColor: brandTheme.primary.paleBlue + '40',
                                    border: `1px solid ${brandTheme.border.light}`,
                                  }}
                                >
                                  <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                    ↳ {subtask.name}
                                  </div>
                                  {subtask.assignee && (
                                    <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                      {subtask.assignee.first_name} {subtask.assignee.last_name}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Done Column */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      <h4
                        className="text-xs font-bold mb-2 uppercase"
                        style={{ color: colors.text }}
                      >
                        Done ({groupTasks.filter(t => t.status === 'done').length})
                      </h4>
                      <div className="space-y-2">
                        {groupTasks
                          .filter(task => task.status === 'done')
                          .map(task => (
                            <div key={task.id}>
                              <div
                                className="p-2 rounded text-xs"
                                style={{
                                  backgroundColor: brandTheme.background.primary,
                                  border: `1px solid ${brandTheme.border.light}`,
                                }}
                              >
                                <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                  {task.name}
                                </div>
                                {task.assignee && (
                                  <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                    {task.assignee.firstName} {task.assignee.lastName}
                                  </div>
                                )}
                              </div>
                              {/* Subtasks */}
                              {subtasksMap.get(task.id)?.filter(st => st.status === 'done').map(subtask => (
                                <div
                                  key={subtask.id}
                                  className="ml-4 mt-1 p-2 rounded text-xs"
                                  style={{
                                    backgroundColor: brandTheme.primary.paleBlue + '40',
                                    border: `1px solid ${brandTheme.border.light}`,
                                  }}
                                >
                                  <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                                    ↳ {subtask.name}
                                  </div>
                                  {subtask.assignee && (
                                    <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                                      {subtask.assignee.first_name} {subtask.assignee.last_name}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* Sprint Review Modal */}
      <InSprintReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sprintGroup={selectedSprintGroup}
      />
    </div>
  );
};

export default SprintEpics;


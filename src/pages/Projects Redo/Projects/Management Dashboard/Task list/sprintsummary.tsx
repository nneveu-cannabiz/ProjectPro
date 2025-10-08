import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ListTodo, Hash, CheckCircle, Clock, X } from 'lucide-react';
import { Task, User } from '../../../../../types';
import UserAvatar from '../../../../../components/UserAvatar';
import { supabase } from '../../../../../lib/supabase';

interface TaskWithSprintInfo extends Task {
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
  hoursSpent?: number;
}

interface UserTaskBreakdown {
  user: User;
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

interface SprintSummaryProps {
  tasks: TaskWithSprintInfo[];
  userBreakdowns: UserTaskBreakdown[];
}

const SprintSummary: React.FC<SprintSummaryProps> = ({ tasks, userBreakdowns }) => {
  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [tasksWithHours, setTasksWithHours] = useState<TaskWithSprintInfo[]>(tasks);
  
  const doneTasks = tasksWithHours.filter((t) => t.status === 'done');

  // Fetch subtasks and hours for all tasks
  useEffect(() => {
    const fetchData = async () => {
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) {
        setSubtasks([]);
        setTasksWithHours(tasks);
        return;
      }

      // Fetch subtasks
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('PMA_SubTasks')
        .select('*')
        .in('task_id', taskIds);

      if (subtasksError) {
        console.error('Error fetching subtasks:', subtasksError);
      } else {
        setSubtasks(subtasksData || []);
      }

      // Fetch hours data
      const { data: hoursData } = await (supabase as any)
        .from('PMA_Hours')
        .select('task_id, hours, is_planning_hours')
        .in('task_id', taskIds);

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

      // Enrich tasks with hours spent
      const enrichedTasks = tasks.map(task => ({
        ...task,
        hoursSpent: hoursMap[task.id] || 0,
      }));

      setTasksWithHours(enrichedTasks);
    };

    fetchData();
  }, [tasks]);

  // Calculate subtask counts
  const inProgressTaskIds = tasksWithHours
    .filter(t => t.status === 'in-progress')
    .map(t => t.id);
  
  const inProgressSubtasks = subtasks.filter(st => inProgressTaskIds.includes(st.task_id));
  const inProgressSubtasksCompleted = inProgressSubtasks.filter(st => st.status === 'done').length;
  
  const subtaskCounts = {
    total: subtasks.length,
    todo: subtasks.filter(st => st.status === 'todo').length,
    inProgress: inProgressSubtasks.length,
    inProgressCompleted: inProgressSubtasksCompleted,
    done: subtasks.filter(st => st.status === 'done').length,
  };
  
  const handleDoneCardClick = () => {
    setIsDoneModalOpen(true);
  };

  const handleCloseDoneModal = () => {
    setIsDoneModalOpen(false);
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Tasks Card */}
      <div
        className="rounded-lg shadow-sm p-4"
        style={{
          backgroundColor: brandTheme.background.secondary,
          borderLeft: `4px solid ${brandTheme.primary.navy}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-medium" style={{ color: brandTheme.text.muted }}>
              Total Tasks
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: brandTheme.text.primary }}>
              {tasksWithHours.length}
            </p>
            <p className="text-xs italic mt-1" style={{ color: '#9CA3AF' }}>
              {subtaskCounts.total} subtasks
            </p>
          </div>
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: brandTheme.primary.paleBlue }}
          >
            <Hash className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
          </div>
        </div>
        {/* User Breakdown */}
        <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: brandTheme.border.light }}>
          {userBreakdowns.slice(0, 5).map((breakdown) => (
            <div key={breakdown.user.id} className="flex items-center justify-between text-xs">
              <span className="truncate" style={{ color: brandTheme.text.secondary }}>
                {breakdown.user.id === 'unassigned' 
                  ? 'Unassigned' 
                  : `${breakdown.user.firstName} ${breakdown.user.lastName}`.trim()}
              </span>
              <span className="font-semibold ml-2" style={{ color: brandTheme.text.primary }}>
                {breakdown.total}
              </span>
            </div>
          ))}
          {userBreakdowns.length > 5 && (
            <div className="text-xs pt-0.5" style={{ color: brandTheme.text.muted }}>
              +{userBreakdowns.length - 5} more users
            </div>
          )}
        </div>
      </div>

      {/* To Do Card */}
      <div
        className="rounded-lg shadow-sm p-4"
        style={{
          backgroundColor: brandTheme.background.secondary,
          borderLeft: `4px solid ${brandTheme.gray[400]}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-medium" style={{ color: brandTheme.text.muted }}>
              To Do
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: brandTheme.text.primary }}>
              {tasksWithHours.filter((t) => t.status === 'todo').length}
            </p>
            <p className="text-xs italic mt-1" style={{ color: '#9CA3AF' }}>
              {subtaskCounts.todo} subtasks
            </p>
          </div>
          <div className="p-2 rounded-full" style={{ backgroundColor: brandTheme.gray[200] }}>
            <ListTodo className="w-5 h-5" style={{ color: brandTheme.text.secondary }} />
          </div>
        </div>
        {/* User Breakdown */}
        <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: brandTheme.border.light }}>
          {userBreakdowns
            .filter((breakdown) => breakdown.todo > 0)
            .slice(0, 5)
            .map((breakdown) => (
              <div key={breakdown.user.id} className="flex items-center justify-between text-xs">
                <span className="truncate" style={{ color: brandTheme.text.secondary }}>
                  {breakdown.user.id === 'unassigned' 
                    ? 'Unassigned' 
                    : `${breakdown.user.firstName} ${breakdown.user.lastName}`.trim()}
                </span>
                <span className="font-semibold ml-2" style={{ color: brandTheme.text.primary }}>
                  {breakdown.todo}
                </span>
              </div>
            ))}
          {userBreakdowns.filter((b) => b.todo > 0).length === 0 && (
            <div className="text-xs" style={{ color: brandTheme.text.muted }}>
              No tasks
            </div>
          )}
        </div>
      </div>

      {/* In Progress Card */}
      <div
        className="rounded-lg shadow-sm p-4"
        style={{
          backgroundColor: brandTheme.background.secondary,
          borderLeft: `4px solid ${brandTheme.primary.lightBlue}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-medium" style={{ color: brandTheme.text.muted }}>
              In Progress
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: brandTheme.text.primary }}>
              {tasksWithHours.filter((t) => t.status === 'in-progress').length}
            </p>
            <p className="text-xs italic mt-1" style={{ color: '#9CA3AF' }}>
              {subtaskCounts.inProgress} subtasks ({subtaskCounts.inProgressCompleted} done)
            </p>
          </div>
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: brandTheme.primary.paleBlue }}
          >
            <Clock className="w-5 h-5" style={{ color: brandTheme.primary.lightBlue }} />
          </div>
        </div>
        {/* User Breakdown */}
        <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: brandTheme.border.light }}>
          {userBreakdowns
            .filter((breakdown) => breakdown.inProgress > 0)
            .slice(0, 5)
            .map((breakdown) => (
              <div key={breakdown.user.id} className="flex items-center justify-between text-xs">
                <span className="truncate" style={{ color: brandTheme.text.secondary }}>
                  {breakdown.user.id === 'unassigned' 
                    ? 'Unassigned' 
                    : `${breakdown.user.firstName} ${breakdown.user.lastName}`.trim()}
                </span>
                <span className="font-semibold ml-2" style={{ color: brandTheme.text.primary }}>
                  {breakdown.inProgress}
                </span>
              </div>
            ))}
          {userBreakdowns.filter((b) => b.inProgress > 0).length === 0 && (
            <div className="text-xs" style={{ color: brandTheme.text.muted }}>
              No tasks
            </div>
          )}
        </div>
      </div>

      {/* Completed Card */}
      <div
        className="rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
        style={{
          backgroundColor: brandTheme.background.secondary,
          borderLeft: `4px solid ${brandTheme.status.success}`,
        }}
        onClick={handleDoneCardClick}
        title="Click to view completed tasks"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-medium" style={{ color: brandTheme.text.muted }}>
              Completed
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: brandTheme.text.primary }}>
              {tasksWithHours.filter((t) => t.status === 'done').length}
            </p>
            <p className="text-xs italic mt-1" style={{ color: '#9CA3AF' }}>
              {subtaskCounts.done} subtasks
            </p>
          </div>
          <div className="p-2 rounded-full" style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle className="w-5 h-5" style={{ color: brandTheme.status.success }} />
          </div>
        </div>
        {/* User Breakdown */}
        <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: brandTheme.border.light }}>
          {userBreakdowns
            .filter((breakdown) => breakdown.done > 0)
            .slice(0, 5)
            .map((breakdown) => (
              <div key={breakdown.user.id} className="flex items-center justify-between text-xs">
                <span className="truncate" style={{ color: brandTheme.text.secondary }}>
                  {breakdown.user.id === 'unassigned' 
                    ? 'Unassigned' 
                    : `${breakdown.user.firstName} ${breakdown.user.lastName}`.trim()}
                </span>
                <span className="font-semibold ml-2" style={{ color: brandTheme.text.primary }}>
                  {breakdown.done}
                </span>
              </div>
            ))}
          {userBreakdowns.filter((b) => b.done > 0).length === 0 && (
            <div className="text-xs" style={{ color: brandTheme.text.muted }}>
              No tasks
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Done Tasks Modal */}
    {isDoneModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden w-full max-w-4xl"
          style={{ backgroundColor: brandTheme.background.primary }}
        >
          {/* Modal Header */}
          <div 
            className="p-6 border-b flex items-center justify-between"
            style={{ 
              backgroundColor: brandTheme.status.success,
              borderColor: brandTheme.border.light 
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Completed Tasks
              </h2>
              <span 
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                }}
              >
                {doneTasks.length}
              </span>
            </div>
            
            <button
              onClick={handleCloseDoneModal}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            {doneTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle
                  className="w-16 h-16 mx-auto mb-4 opacity-30"
                  style={{ color: brandTheme.status.success }}
                />
                <p className="text-lg font-medium" style={{ color: brandTheme.text.muted }}>
                  No completed tasks yet
                </p>
              </div>
            ) : (
              <div className="p-6">
                {/* Task List */}
                <div className="space-y-3">
                  {doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border transition-all hover:shadow-md"
                      style={{
                        backgroundColor: brandTheme.background.secondary,
                        borderColor: brandTheme.border.light,
                        borderLeftWidth: '4px',
                        borderLeftColor: brandTheme.status.success,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Task Name */}
                          <h3 
                            className="font-semibold text-base mb-2"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {task.name}
                          </h3>
                          
                          {/* Task Details */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {/* Sprint Group */}
                            <div className="flex items-center gap-2">
                              <ListTodo className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
                              <span style={{ color: brandTheme.text.secondary }}>
                                {task.sprintGroupName}
                              </span>
                            </div>

                            {/* Priority */}
                            {task.priority && (
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: 
                                    task.priority === 'Critical' ? '#fee2e2' :
                                    task.priority === 'High' ? '#fef3c7' :
                                    task.priority === 'Medium' ? brandTheme.primary.paleBlue :
                                    brandTheme.gray[200],
                                  color:
                                    task.priority === 'Critical' ? '#dc2626' :
                                    task.priority === 'High' ? '#f59e0b' :
                                    task.priority === 'Medium' ? brandTheme.primary.navy :
                                    brandTheme.text.muted,
                                }}
                              >
                                {task.priority}
                              </span>
                            )}

                            {/* Hours Spent */}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
                              <span 
                                className="font-semibold"
                                style={{ color: brandTheme.text.secondary }}
                              >
                                {task.hoursSpent ? `${task.hoursSpent.toFixed(1)}h` : '0h'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex-shrink-0">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={task.assignee} size="sm" />
                              <span 
                                className="text-sm font-medium"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {task.assignee.firstName} {task.assignee.lastName}
                              </span>
                            </div>
                          ) : (
                            <span 
                              className="text-sm"
                              style={{ color: brandTheme.text.muted }}
                            >
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div 
            className="p-4 border-t flex justify-end"
            style={{ borderColor: brandTheme.border.light }}
          >
            <button
              onClick={handleCloseDoneModal}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: brandTheme.primary.navy,
                color: '#FFFFFF',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default SprintSummary;


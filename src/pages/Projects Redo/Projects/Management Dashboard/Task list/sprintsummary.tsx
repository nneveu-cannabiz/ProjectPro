import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ListTodo, Hash, CheckCircle, Clock } from 'lucide-react';
import { Task, User } from '../../../../../types';

interface TaskWithSprintInfo extends Task {
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
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
  return (
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
              {tasks.length}
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
              {tasks.filter((t) => t.status === 'todo').length}
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
              {tasks.filter((t) => t.status === 'in-progress').length}
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
        className="rounded-lg shadow-sm p-4"
        style={{
          backgroundColor: brandTheme.background.secondary,
          borderLeft: `4px solid ${brandTheme.status.success}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-medium" style={{ color: brandTheme.text.muted }}>
              Completed
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: brandTheme.text.primary }}>
              {tasks.filter((t) => t.status === 'done').length}
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
  );
};

export default SprintSummary;


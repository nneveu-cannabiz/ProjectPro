import React, { useState } from 'react';
import { Clock, Target, Users, ChevronDown, User, Plus } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Task } from './types';

interface SprintSummaryProps {
  tasks: Task[];
  isSelectionMode?: boolean;
  selectedTaskCount?: number;
  onCreateSprintGroup?: () => void;
  onAddToSprintGroup?: () => void;
}

const SprintSummary: React.FC<SprintSummaryProps> = ({ 
  tasks, 
  isSelectionMode = false, 
  selectedTaskCount = 0, 
  onCreateSprintGroup,
  onAddToSprintGroup
}) => {
  const [showTeamBreakdown, setShowTeamBreakdown] = useState(false);
  
  // Filter out completed tasks and apply selection mode filtering
  const activeTasks = tasks.filter(task => task.status?.toLowerCase() !== 'done');
  const relevantTasks = isSelectionMode ? activeTasks.filter(task => task.isSelected) : activeTasks;
  const totalHoursSpent = relevantTasks.reduce((sum, task) => sum + task.hoursSpent, 0);
  const totalHoursPlanned = relevantTasks.reduce((sum, task) => sum + task.hoursPlanned, 0);

  // Calculate task counts by status (using all tasks, not just active)
  const todoCount = tasks.filter(task => {
    const status = task.status?.toLowerCase();
    return status === 'to do' || status === 'todo' || status === 'to-do';
  }).length;
  const inProgressCount = tasks.filter(task => {
    const status = task.status?.toLowerCase();
    return status === 'in-progress' || status === 'in progress' || status === 'inprogress';
  }).length;
  const doneCount = tasks.filter(task => task.status?.toLowerCase() === 'done').length;

  // Group tasks by assignee for team breakdown
  const tasksByAssignee = relevantTasks.reduce((acc, task) => {
    const assigneeKey = task.assignee_id || 'unassigned';
    const assigneeName = task.assigneeName || 'Unassigned';
    
    if (!acc[assigneeKey]) {
      acc[assigneeKey] = {
        assigneeId: task.assignee_id,
        assigneeName: assigneeName,
        tasks: [],
        totalHoursSpent: 0,
        totalHoursPlanned: 0
      };
    }
    
    acc[assigneeKey].tasks.push(task);
    acc[assigneeKey].totalHoursSpent += task.hoursSpent;
    acc[assigneeKey].totalHoursPlanned += task.hoursPlanned;
    
    return acc;
  }, {} as Record<string, {
    assigneeId?: string;
    assigneeName: string;
    tasks: Task[];
    totalHoursSpent: number;
    totalHoursPlanned: number;
  }>);

  const assigneeBreakdowns = Object.values(tasksByAssignee).sort((a, b) => 
    a.assigneeName.localeCompare(b.assigneeName)
  );

  return (
    <div 
      className="px-6 py-3 mb-4 rounded"
      style={{ backgroundColor: brandTheme.primary.navy }}
    >
      {/* Single Line Layout */}
      <div className="flex items-center justify-between">
        {/* Left Side: Title and Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h3 className="text-white text-base font-semibold">Epic Summary</h3>
            <p className="text-white text-xs opacity-75">Active tasks only</p>
          </div>
          
          {/* Hours Spent */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-7 h-7 bg-white bg-opacity-20 rounded-full">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-medium opacity-90">Hours Spent</p>
              <p className="text-white text-base font-bold">{totalHoursSpent.toFixed(1)}</p>
            </div>
          </div>

          {/* Story Points */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-7 h-7 bg-white bg-opacity-20 rounded-full">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-medium opacity-90">Story Points</p>
              <p className="text-white text-base font-bold">{totalHoursPlanned.toFixed(1)}</p>
            </div>
          </div>

          {/* Task Status Counts */}
          <div className="flex items-center space-x-4 pl-4 border-l border-white border-opacity-20">
            {/* To Do */}
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandTheme.gray[400] }} />
              <div>
                <p className="text-white text-xs opacity-75">To Do</p>
                <p className="text-white text-sm font-semibold">{todoCount}</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandTheme.status.inProgress }} />
              <div>
                <p className="text-white text-xs opacity-75">In Progress</p>
                <p className="text-white text-sm font-semibold">{inProgressCount}</p>
              </div>
            </div>

            {/* Done */}
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandTheme.status.success }} />
              <div>
                <p className="text-white text-xs opacity-75">Done</p>
                <p className="text-white text-sm font-semibold">{doneCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Buttons */}
        <div className="flex items-center space-x-3">
          {/* Create Epic Button */}
          {selectedTaskCount > 0 && onCreateSprintGroup && (
            <button
              onClick={onCreateSprintGroup}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-colors text-xs font-semibold shadow-sm"
              style={{ color: brandTheme.primary.navy }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Epic ({selectedTaskCount})</span>
            </button>
          )}
          
          {/* Add to Epic Button */}
          {selectedTaskCount > 0 && onAddToSprintGroup && (
            <button
              onClick={onAddToSprintGroup}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-80 hover:bg-opacity-90 rounded-lg transition-colors text-xs font-medium shadow-sm"
              style={{ color: brandTheme.primary.navy }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Epic ({selectedTaskCount})</span>
            </button>
          )}
          
          {/* Team Breakdown Toggle */}
          <button
            onClick={() => setShowTeamBreakdown(!showTeamBreakdown)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white text-xs font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Breakdown</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTeamBreakdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>


      {/* Team Breakdown */}
      {showTeamBreakdown && assigneeBreakdowns.length > 0 && (
        <div className="border-t border-white border-opacity-20 pt-3 mt-3">
          <div className="space-y-3">
            {assigneeBreakdowns.map((assignee) => (
              <div 
                key={assignee.assigneeId || 'unassigned'}
                className="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{assignee.assigneeName}</p>
                    <p className="text-white opacity-75 text-xs">
                      {assignee.tasks.length} task{assignee.tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-right">
                  <div>
                    <p className="text-white text-xs opacity-75">Spent</p>
                    <p className="text-white font-bold text-sm">{assignee.totalHoursSpent.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-white text-xs opacity-75">Points</p>
                    <p className="text-white font-bold text-sm">{assignee.totalHoursPlanned.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Team Breakdown */}
      {showTeamBreakdown && assigneeBreakdowns.length === 0 && (
        <div className="border-t border-white border-opacity-20 pt-3 mt-3">
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-white opacity-50 mx-auto mb-2" />
            <p className="text-white opacity-75 text-sm">No team members assigned to tasks</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintSummary;

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
      className="px-6 py-4 mb-6 rounded"
      style={{ backgroundColor: brandTheme.primary.navy }}
    >
      {/* Header with Team Breakdown Toggle and Create Sprint Group */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold">Sprint Summary</h3>
          <p className="text-white text-xs opacity-75 mt-1">Active tasks only (excludes completed tasks)</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Create Epic Button */}
          {selectedTaskCount > 0 && onCreateSprintGroup && (
            <button
              onClick={onCreateSprintGroup}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-colors text-sm font-semibold shadow-sm"
              style={{ color: brandTheme.primary.navy }}
            >
              <Plus className="w-4 h-4" />
              <span>Create Epic ({selectedTaskCount})</span>
            </button>
          )}
          
          {/* Add to Epic Button */}
          {selectedTaskCount > 0 && onAddToSprintGroup && (
            <button
              onClick={onAddToSprintGroup}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-90 rounded-lg transition-colors text-sm font-medium shadow-sm"
              style={{ color: brandTheme.primary.navy }}
            >
              <Plus className="w-4 h-4" />
              <span>Add to Epic ({selectedTaskCount})</span>
            </button>
          )}
          
          {/* Team Breakdown Toggle */}
          <button
            onClick={() => setShowTeamBreakdown(!showTeamBreakdown)}
            className="flex items-center space-x-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            <span>Team Breakdown</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTeamBreakdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Hours Spent */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium opacity-90">Hours Spent</p>
            <p className="text-white text-2xl font-bold">{totalHoursSpent.toFixed(1)}</p>
          </div>
        </div>

        {/* Story Points */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium opacity-90">Story Points</p>
            <p className="text-white text-2xl font-bold">{totalHoursPlanned.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Team Breakdown */}
      {showTeamBreakdown && assigneeBreakdowns.length > 0 && (
        <div className="border-t border-white border-opacity-20 pt-4">
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
        <div className="border-t border-white border-opacity-20 pt-4">
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

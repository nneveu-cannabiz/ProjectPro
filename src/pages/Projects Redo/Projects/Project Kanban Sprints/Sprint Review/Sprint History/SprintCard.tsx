import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar, Save, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import Input from '../../../../../../components/ui/Input';
import { HistoricalSprint, TaskWithSprintInfo, SprintProgress, StoryPoints } from './types';
import { getSprintStatus, getSprintTypeColor, formatDate, formatDateForInput } from './sprintHelpers';
import DraggableEpicGroup from './DraggableEpicGroup';
import SprintGroupExpandedContent from './SprintGroupExpandedContent';

// Sprint Card component props interface
export interface SprintCardProps {
  sprint: HistoricalSprint;
  progress: SprintProgress | null;
  storyPoints: StoryPoints;
  allTasks: TaskWithSprintInfo[];
  subtasksMap: Map<string, any[]>;
  storyPointsMap: Map<string, number>;
  expandedSprints: Set<string>;
  onToggleExpansion: (sprintId: string, groupId: string) => void;
  onEditSprint: (sprint: HistoricalSprint) => void;
  editingSprintId: string | null;
  editStartDate: string;
  editEndDate: string;
  setEditStartDate: (date: string) => void;
  setEditEndDate: (date: string) => void;
  onSaveSprintDates: (sprintId: string) => void;
  onCancelEdit: () => void;
  saving: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSprintGroupClick: (group: any) => void;
  enableDragDrop?: boolean;
  overId?: string | null;
}

const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  progress,
  storyPoints,
  allTasks,
  subtasksMap,
  storyPointsMap,
  expandedSprints,
  onToggleExpansion,
  onEditSprint,
  editingSprintId,
  editStartDate,
  editEndDate,
  setEditStartDate,
  setEditEndDate,
  onSaveSprintDates,
  onCancelEdit,
  saving,
  isCollapsed,
  onToggleCollapse,
  onSprintGroupClick,
  enableDragDrop = false,
  overId = null,
}) => {
  const status = getSprintStatus(sprint.start_date, sprint.end_date);
  const isEditing = editingSprintId === sprint.sprint_id;
  
  // Make the sprint card a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: sprint.sprint_id,
    data: {
      type: 'sprint',
      sprint,
    },
  });

  const getGroupTasks = (groupId: string) => {
    return allTasks.filter(task => task.sprintGroupId === groupId);
  };

  const getTaskCounts = (groupId: string) => {
    const tasks = getGroupTasks(groupId);
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  };

  const getSubtaskCount = (groupId: string) => {
    const tasks = getGroupTasks(groupId);
    let subtaskCount = 0;
    tasks.forEach(task => {
      const subtasks = subtasksMap.get(task.id);
      if (subtasks) {
        subtaskCount += subtasks.length;
      }
    });
    return subtaskCount;
  };

  const getGroupStoryPoints = (groupId: string) => {
    const tasks = getGroupTasks(groupId);
    const total = tasks.reduce((sum, task) => {
      // Get story points from storyPointsMap (planning hours from PMA_Hours table)
      const points = storyPointsMap.get(task.id);
      // Handle null, undefined, or non-numeric values
      if (points === null || points === undefined || typeof points !== 'number') {
        return sum;
      }
      return sum + points;
    }, 0);
    return total;
  };

  const getSprintTotals = () => {
    let totalTasks = 0;
    let totalSubtasks = 0;
    
    sprint.groups.forEach((group) => {
      const tasks = getGroupTasks(group.id);
      totalTasks += tasks.length;
      
      tasks.forEach(task => {
        const subtasks = subtasksMap.get(task.id);
        if (subtasks) {
          totalSubtasks += subtasks.length;
        }
      });
    });
    
    return { totalTasks, totalSubtasks };
  };

  const sprintTotals = getSprintTotals();

  return (
    <div
      ref={enableDragDrop ? setDropRef : undefined}
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'white',
        borderColor: isOver ? brandTheme.primary.navy : (isEditing ? brandTheme.primary.lightBlue : brandTheme.border.light),
        borderWidth: isOver || isEditing ? '2px' : '1px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header - Line 1: Sprint Name, Status, Edit Button */}
      <div 
        className="flex items-center justify-between px-4 py-2"
        style={{ 
          backgroundColor: brandTheme.primary.navy,
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors flex-shrink-0"
            style={{ color: 'white' }}
            title={isCollapsed ? "Expand sprint" : "Collapse sprint"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          <h3 className="text-lg font-bold text-white">
            Sprint {sprint.sprint_id}
          </h3>
          
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
            }}
          >
            {status.label}
          </span>
        </div>
          
        {!isEditing && (
          <button
            onClick={() => onEditSprint(sprint)}
            className="p-1.5 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            style={{ color: 'white' }}
            title="Edit dates"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="px-4 py-2">
        {/* Header - Line 2: Progress Stats */}
        {progress && (
          <div 
            className="flex items-center justify-between pb-2 mb-2"
            style={{ borderBottom: `1px solid ${brandTheme.border.light}` }}
          >
            {/* Left: Days Completed/Remaining */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: brandTheme.primary.navy }}>
                {progress.daysCompleted} {progress.daysCompleted === 1 ? 'day' : 'days'} completed
              </span>
              <span style={{ color: brandTheme.text.muted }}>•</span>
              <span className="text-sm font-semibold" style={{ color: brandTheme.text.secondary }}>
                {progress.daysRemaining} {progress.daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
            </div>
            
            {/* Right: Story Points */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                Story Points:
              </span>
              <span className="text-lg font-bold" style={{ color: brandTheme.primary.navy }}>
                {storyPoints.completed}
              </span>
              <span className="text-sm" style={{ color: brandTheme.text.muted }}>/</span>
              <span className="text-lg font-bold" style={{ color: brandTheme.text.secondary }}>
                {storyPoints.total}
              </span>
            </div>
          </div>
        )}

        {/* Header - Line 3: Dates or Edit Mode */}
        {isEditing ? (
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
            <Input
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              className="text-sm"
              style={{ width: '150px' }}
            />
            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>to</span>
            <Input
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              className="text-sm"
              style={{ width: '150px' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveSprintDates(sprint.sprint_id)}
              disabled={saving}
              className="px-3 py-1.5 rounded transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: brandTheme.status.success,
                color: 'white'
              }}
              title="Save dates"
            >
              <div className="flex items-center gap-1">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </div>
            </button>
            <button
              onClick={onCancelEdit}
              disabled={saving}
              className="px-3 py-1.5 rounded transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: brandTheme.gray[200],
                color: brandTheme.text.secondary
              }}
              title="Cancel"
            >
              <div className="flex items-center gap-1">
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Left: Dates */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
              {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
            </span>
          </div>
          
          {/* Right: Groups, Tasks, Subtasks */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
              {sprint.groups.length} {sprint.groups.length === 1 ? 'group' : 'groups'}
            </span>
            <span style={{ color: brandTheme.text.muted }}>•</span>
            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
              {sprintTotals.totalTasks} {sprintTotals.totalTasks === 1 ? 'task' : 'tasks'}
            </span>
            <span style={{ color: brandTheme.text.muted }}>•</span>
            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
              {sprintTotals.totalSubtasks} {sprintTotals.totalSubtasks === 1 ? 'subtask' : 'subtasks'}
            </span>
          </div>
        </div>
      )}

        {!isCollapsed && (
          <>
            {/* Sprint Groups in this sprint - Expandable */}
            <div className="space-y-2 mt-3">
              {sprint.groups.map((group) => {
                const colors = getSprintTypeColor(group.sprint_type);
                const isExpanded = expandedSprints.has(`${sprint.sprint_id}-${group.id}`);
                const groupTasks = getGroupTasks(group.id);
                const counts = getTaskCounts(group.id);
                const subtaskCount = getSubtaskCount(group.id);
                
                return (
                  <DraggableEpicGroup
                    key={group.id}
                    group={group}
                    sprint={sprint}
                    colors={colors}
                    isExpanded={isExpanded}
                    counts={counts}
                    subtaskCount={subtaskCount}
                    storyPoints={getGroupStoryPoints(group.id)}
                    onToggleExpansion={() => onToggleExpansion(sprint.sprint_id, group.id)}
                    onSprintGroupClick={() => onSprintGroupClick(group)}
                    enableDragDrop={enableDragDrop}
                    isOverTarget={overId === group.id}
                  >
                    {/* Expanded Content */}
                    {isExpanded && (
                      <SprintGroupExpandedContent
                        groupTasks={groupTasks}
                        subtasksMap={subtasksMap}
                        storyPointsMap={storyPointsMap}
                        colors={colors}
                      />
                    )}
                  </DraggableEpicGroup>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SprintCard;


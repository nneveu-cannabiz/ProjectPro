import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { HistoricalSprint, SprintProgress, StoryPoints } from './types';
import SprintCard from './SprintCard';

interface PastSprintsSectionProps {
  pastSprints: HistoricalSprint[];
  allTasks: any[];
  subtasksMap: Map<string, any[]>;
  expandedSprints: Set<string>;
  onToggleExpansion: (sprintId: string, groupId: string) => void;
  onEditSprint: (sprint: HistoricalSprint) => void;
  editingSprintId: string | null;
  editStartDate: string;
  editEndDate: string;
  setEditStartDate: (date: string) => void;
  setEditEndDate: (date: string) => void;
  onSaveSprintDates: (sprintId: string) => Promise<void>;
  onCancelEdit: () => void;
  saving: boolean;
  getSprintProgress: (startDate: string | null, endDate: string | null) => SprintProgress | null;
  getSprintStoryPoints: (sprint: HistoricalSprint, tasks: any[], storyPointsMap: Map<string, number>) => StoryPoints;
  storyPointsMap: Map<string, number>;
  onSprintGroupClick: (group: any) => void;
}

const PastSprintsSection: React.FC<PastSprintsSectionProps> = ({
  pastSprints,
  allTasks,
  subtasksMap,
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
  getSprintProgress,
  getSprintStoryPoints,
  storyPointsMap,
  onSprintGroupClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div
      className="rounded-lg shadow-sm p-6 mt-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-4 hover:opacity-80 transition-opacity"
        disabled={pastSprints.length === 0}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" style={{ color: brandTheme.text.primary }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: brandTheme.text.primary }} />
          )}
          <History className="w-5 h-5" style={{ color: brandTheme.text.primary }} />
          <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
            Past Sprints ({pastSprints.length})
          </h2>
        </div>
        {pastSprints.length > 0 ? (
          <span className="text-sm" style={{ color: brandTheme.text.muted }}>
            {isCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        ) : (
          <span className="text-sm" style={{ color: brandTheme.text.muted }}>
            No past sprints yet
          </span>
        )}
      </button>

      {!isCollapsed && pastSprints.length > 0 && (
        <div className="space-y-4">
          {pastSprints.map((sprint) => {
            const progress = getSprintProgress(sprint.start_date, sprint.end_date) || {
              daysCompleted: 0,
              daysRemaining: 0,
              totalDays: 0,
            };
            const storyPoints = getSprintStoryPoints(sprint, allTasks, storyPointsMap);

            return (
              <SprintCard
                key={sprint.sprint_id}
                sprint={sprint}
                progress={progress}
                storyPoints={storyPoints}
                allTasks={allTasks}
                subtasksMap={subtasksMap}
                expandedSprints={expandedSprints}
                onToggleExpansion={onToggleExpansion}
                onEditSprint={onEditSprint}
                editingSprintId={editingSprintId}
                editStartDate={editStartDate}
                editEndDate={editEndDate}
                setEditStartDate={setEditStartDate}
                setEditEndDate={setEditEndDate}
                onSaveSprintDates={onSaveSprintDates}
                onCancelEdit={onCancelEdit}
                saving={saving}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                onSprintGroupClick={onSprintGroupClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PastSprintsSection;


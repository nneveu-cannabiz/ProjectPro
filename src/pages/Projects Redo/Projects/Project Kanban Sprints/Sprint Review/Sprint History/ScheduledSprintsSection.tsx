import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar, Package, Plus } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { supabase } from '../../../../../../lib/supabase';
import Button from '../../../../../../components/ui/Button';
import SprintCard from './SprintCard';
import ParkingLotColumn from '../../Kanban Columns/ParkingLotColumn';
import { HistoricalSprint, SprintProgress, StoryPoints } from './types';

interface ScheduledSprintsSectionProps {
  scheduledSprints: HistoricalSprint[];
  allTasks: any[];
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
  collapsedSprintCards: Set<string>;
  onToggleCollapse: (sprintId: string) => void;
  onSprintGroupClick: (group: any) => void;
  getSprintProgress: (startDate: string | null, endDate: string | null) => SprintProgress | null;
  getSprintStoryPoints: (sprint: HistoricalSprint, allTasks: any[], storyPointsMap: Map<string, number>) => StoryPoints;
  showParkingLot: boolean;
  setShowParkingLot: (show: boolean) => void;
  parkingLotProjects: any[];
  onParkingLotRefresh: () => void;
  onSprintReviewClick: (project: any) => void;
  onCreateNewSprint: () => void;
  onRefreshData: () => void;
}

const ScheduledSprintsSection: React.FC<ScheduledSprintsSectionProps> = ({
  scheduledSprints,
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
  collapsedSprintCards,
  onToggleCollapse,
  onSprintGroupClick,
  getSprintProgress,
  getSprintStoryPoints,
  showParkingLot,
  setShowParkingLot,
  parkingLotProjects,
  onParkingLotRefresh,
  onSprintReviewClick,
  onCreateNewSprint,
  onRefreshData,
}) => {
  const [activeEpic, setActiveEpic] = useState<{ id: string; name: string; project: any } | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current) {
      setActiveEpic({
        id: active.id as string,
        name: active.data.current.name,
        project: active.data.current.project,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEpic(null);
    setOverId(null);

    if (!over) return;

    const epicId = active.id as string;
    const overId = over.id as string;

    // Find the epic being dragged
    const sourceEpic = scheduledSprints
      .flatMap(sprint => sprint.groups)
      .find(group => group.id === epicId);

    if (!sourceEpic) {
      console.log('Source epic not found');
      return;
    }

    // Check if we're dropping on a sprint or another epic
    const targetSprint = scheduledSprints.find(sprint => sprint.sprint_id === overId);
    const targetEpic = scheduledSprints
      .flatMap(sprint => sprint.groups)
      .find(group => group.id === overId);

    try {
      // Helper function to ensure all epics in a sprint have rankings
      const ensureSprintRankings = async (sprintId: string, sprintGroups: any[]) => {
        const sprintKey = `Sprint ${sprintId}`;
        const updates = [];
        
        // Find epics without rankings
        const epicsWithoutRanking = sprintGroups.filter(g => !g.ranking?.[sprintKey]);
        
        if (epicsWithoutRanking.length > 0) {
          // Get the highest existing ranking
          const existingRankings = sprintGroups
            .map(g => g.ranking?.[sprintKey])
            .filter((r): r is number => typeof r === 'number');
          
          let nextRank = existingRankings.length > 0 ? Math.max(...existingRankings) + 1 : 1;
          
          // Assign rankings to epics without them
          for (const epic of epicsWithoutRanking) {
            const newRankingObj = { ...(epic.ranking || {}), [sprintKey]: nextRank };
            updates.push(
              (supabase as any)
                .from('PMA_Sprints')
                .update({ ranking: newRankingObj })
                .eq('id', epic.id)
            );
            nextRank++;
          }
          
          await Promise.all(updates);
        }
      };

      // Scenario 1: Dropped on another epic (reorder within same or different sprint)
      if (targetEpic) {
        const targetEpicSprint = scheduledSprints.find(sprint => 
          sprint.groups.some(g => g.id === targetEpic.id)
        );

        if (!targetEpicSprint) return;

        // Ensure all epics in the target sprint have rankings
        await ensureSprintRankings(targetEpicSprint.sprint_id, targetEpicSprint.groups);

        const isSameSprint = sourceEpic.sprint_id === targetEpic.sprint_id;
        const targetSprintKey = `Sprint ${targetEpic.sprint_id}`;
        
        // Re-fetch the target epic's ranking after ensuring rankings
        const updatedTargetEpic = targetEpicSprint.groups.find(g => g.id === targetEpic.id);
        const targetRanking = updatedTargetEpic?.ranking?.[targetSprintKey] || 1;

        if (isSameSprint) {
          // Reorder within same sprint
          const sprintKey = `Sprint ${sourceEpic.sprint_id}`;
          
          // Get all epics in the sprint (they all should have rankings now)
          const sprintEpics = targetEpicSprint.groups
            .filter(g => g.ranking?.[sprintKey])
            .sort((a, b) => (a.ranking[sprintKey] || 0) - (b.ranking[sprintKey] || 0));

          const sourceRanking = sourceEpic.ranking?.[sprintKey] || 0;
          const newRanking = targetRanking;
          
          // If source doesn't have a ranking yet, just assign it the target position
          if (!sourceEpic.ranking?.[sprintKey]) {
            const newRankingObj = { ...(sourceEpic.ranking || {}), [sprintKey]: targetRanking };
            await (supabase as any)
              .from('PMA_Sprints')
              .update({ ranking: newRankingObj })
              .eq('id', epicId);
            await onRefreshData();
            return;
          }

          // Update all affected rankings
          const updates = [];
          
          if (sourceRanking < newRanking) {
            // Moving down: shift epics up
            for (const epic of sprintEpics) {
              const epicRank = epic.ranking[sprintKey];
              if (epic.id === epicId) {
                const newRankingObj = { ...epic.ranking, [sprintKey]: newRanking };
                updates.push(
                  (supabase as any)
                    .from('PMA_Sprints')
                    .update({ ranking: newRankingObj })
                    .eq('id', epic.id)
                );
              } else if (epicRank > sourceRanking && epicRank <= newRanking) {
                const newRankingObj = { ...epic.ranking, [sprintKey]: epicRank - 1 };
                updates.push(
                  (supabase as any)
                    .from('PMA_Sprints')
                    .update({ ranking: newRankingObj })
                    .eq('id', epic.id)
                );
              }
            }
          } else if (sourceRanking > newRanking) {
            // Moving up: shift epics down
            for (const epic of sprintEpics) {
              const epicRank = epic.ranking[sprintKey];
              if (epic.id === epicId) {
                const newRankingObj = { ...epic.ranking, [sprintKey]: newRanking };
                updates.push(
                  (supabase as any)
                    .from('PMA_Sprints')
                    .update({ ranking: newRankingObj })
                    .eq('id', epic.id)
                );
              } else if (epicRank >= newRanking && epicRank < sourceRanking) {
                const newRankingObj = { ...epic.ranking, [sprintKey]: epicRank + 1 };
                updates.push(
                  (supabase as any)
                    .from('PMA_Sprints')
                    .update({ ranking: newRankingObj })
                    .eq('id', epic.id)
                );
              }
            }
          }

          await Promise.all(updates);
        } else {
          // Moving to different sprint - insert at target position
          const targetSprintEpics = targetEpicSprint.groups
            .filter(g => g.ranking?.[targetSprintKey])
            .sort((a, b) => (a.ranking[targetSprintKey] || 0) - (b.ranking[targetSprintKey] || 0));

          // Shift rankings in target sprint to make room
          const updates = [];
          for (const epic of targetSprintEpics) {
            const epicRank = epic.ranking[targetSprintKey];
            if (epicRank >= targetRanking) {
              const newRankingObj = { ...epic.ranking, [targetSprintKey]: epicRank + 1 };
              updates.push(
                (supabase as any)
                  .from('PMA_Sprints')
                  .update({ ranking: newRankingObj })
                  .eq('id', epic.id)
              );
            }
          }

          await Promise.all(updates);

          // Update the dragged epic with new sprint info and ranking
          const newRankingObj = { ...sourceEpic.ranking, [targetSprintKey]: targetRanking };
          await (supabase as any)
            .from('PMA_Sprints')
            .update({
              sprint_id: targetEpic.sprint_id,
              start_date: targetEpicSprint.start_date,
              end_date: targetEpicSprint.end_date,
              name: sourceEpic.name.replace(/Sprint \d+/, `Sprint ${targetEpic.sprint_id}`),
              ranking: newRankingObj
            })
            .eq('id', epicId);
        }
      }
      // Scenario 2: Dropped on sprint (add to end)
      else if (targetSprint) {
        const isSameSprint = sourceEpic.sprint_id === targetSprint.sprint_id;
        
        if (isSameSprint) {
          // Already in this sprint, no change
          return;
        }

        // Ensure all epics in the target sprint have rankings
        await ensureSprintRankings(targetSprint.sprint_id, targetSprint.groups);

        const targetSprintKey = `Sprint ${targetSprint.sprint_id}`;
        
        // Get the highest ranking in target sprint
        const targetSprintEpics = targetSprint.groups
          .filter(g => g.ranking?.[targetSprintKey])
          .sort((a, b) => (b.ranking[targetSprintKey] || 0) - (a.ranking[targetSprintKey] || 0));

        const highestRanking = targetSprintEpics.length > 0 
          ? targetSprintEpics[0].ranking[targetSprintKey] 
          : 0;

        const newRanking = highestRanking + 1;

        // Update the epic with new sprint info and ranking
        const newRankingObj = { ...sourceEpic.ranking, [targetSprintKey]: newRanking };
        await (supabase as any)
          .from('PMA_Sprints')
          .update({
            sprint_id: targetSprint.sprint_id,
            start_date: targetSprint.start_date,
            end_date: targetSprint.end_date,
            name: sourceEpic.name.replace(/Sprint \d+/, `Sprint ${targetSprint.sprint_id}`),
            ranking: newRankingObj
          })
          .eq('id', epicId);
      }

      // Refresh the data to show new order
      // Expanded states are preserved via localStorage
      await onRefreshData();
    } catch (error) {
      console.error('Error in drag and drop:', error);
      alert('Failed to move epic. Please try again.');
    }
  };

  const handleDragCancel = () => {
    setActiveEpic(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="rounded-lg shadow-sm p-6"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
            Scheduled Sprints ({scheduledSprints.length})
          </h2>
          <div className="flex items-center gap-3">
            <Button
              onClick={onCreateNewSprint}
              style={{
                backgroundColor: brandTheme.status.success,
                color: 'white',
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Sprint
            </Button>
            <Button
              onClick={() => setShowParkingLot(!showParkingLot)}
              style={{
                backgroundColor: showParkingLot ? brandTheme.primary.lightBlue : brandTheme.primary.navy,
                color: 'white',
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              {showParkingLot ? 'Hide Parking Lot' : 'See Parking Lot'}
            </Button>
          </div>
        </div>

        {scheduledSprints.length === 0 ? (
          <div className="text-center py-12">
            <Calendar
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: brandTheme.text.muted }}
            />
            <p style={{ color: brandTheme.text.muted }}>No sprints scheduled yet</p>
          </div>
        ) : (
          <div className={showParkingLot ? "grid grid-cols-[400px_1fr] gap-4 items-start" : ""}>
            {/* Parking Lot Column */}
            {showParkingLot && (
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <ParkingLotColumn
                  projects={parkingLotProjects}
                  onProjectAdded={onParkingLotRefresh}
                  onProjectClick={onSprintReviewClick}
                  onSprintReviewClick={onSprintReviewClick}
                />
              </div>
            )}

            {/* Sprint Cards */}
            <div className="space-y-4">
              {scheduledSprints.map((sprint) => {
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
                    storyPointsMap={storyPointsMap}
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
                    isCollapsed={collapsedSprintCards.has(sprint.sprint_id)}
                    onToggleCollapse={() => onToggleCollapse(sprint.sprint_id)}
                    onSprintGroupClick={onSprintGroupClick}
                    enableDragDrop={true}
                    overId={overId}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEpic ? (
          <div
            className="p-4 rounded-lg shadow-lg border-2"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.primary.navy,
              cursor: 'grabbing',
            }}
          >
            <div className="font-semibold" style={{ color: brandTheme.text.primary }}>
              {activeEpic.name}
            </div>
            {activeEpic.project && (
              <div className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
                {activeEpic.project.name}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ScheduledSprintsSection;


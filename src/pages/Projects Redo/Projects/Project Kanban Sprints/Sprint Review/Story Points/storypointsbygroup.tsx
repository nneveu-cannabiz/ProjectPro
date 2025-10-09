import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Award, TrendingUp, Package, ExternalLink } from 'lucide-react';
import Badge from '../../../../../../components/ui/Badge';
import { supabase } from '../../../../../../lib/supabase';
import InSprintReviewModal from '../InSprintReviewModal';

interface Task {
  id: string;
  name: string;
  storyPoints?: number;
  sprintGroupName: string;
  sprintGroupId: string;
  status: string;
}

interface StoryPointsByGroupProps {
  tasks: Task[];
}

interface SprintGroup {
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

interface SprintGroupSummary {
  groupId: string;
  groupName: string;
  totalPoints: number;
  taskCount: number;
  completedTaskCount: number;
  averagePoints: number;
}

const StoryPointsByGroup: React.FC<StoryPointsByGroupProps> = ({ tasks }) => {
  const [selectedSprintGroup, setSelectedSprintGroup] = useState<SprintGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group tasks by sprint group
  const groupedData = React.useMemo(() => {
    const grouped: Record<string, SprintGroupSummary> = {};

    tasks.forEach((task) => {
      if (!grouped[task.sprintGroupId]) {
        grouped[task.sprintGroupId] = {
          groupId: task.sprintGroupId,
          groupName: task.sprintGroupName,
          totalPoints: 0,
          taskCount: 0,
          completedTaskCount: 0,
          averagePoints: 0,
        };
      }

      const group = grouped[task.sprintGroupId];
      group.totalPoints += task.storyPoints || 0;
      group.taskCount += 1;
      if (task.status === 'done') {
        group.completedTaskCount += 1;
      }
    });

    // Calculate average points
    Object.values(grouped).forEach((group) => {
      group.averagePoints = group.taskCount > 0 ? group.totalPoints / group.taskCount : 0;
    });

    // Sort by total points descending
    return Object.values(grouped).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [tasks]);

  const handleSprintGroupClick = async (groupId: string) => {
    try {
      // Fetch the sprint group details
      const { data: sprintGroup, error } = await (supabase as any)
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
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching sprint group:', error);
        return;
      }

      if (sprintGroup) {
        // Transform the data to match the expected interface
        const transformedGroup: SprintGroup = {
          id: sprintGroup.id,
          project_id: sprintGroup.project_id,
          selected_task_ids: sprintGroup.selected_task_ids || [],
          sprint_type: sprintGroup.sprint_type,
          status: sprintGroup.status,
          name: sprintGroup.name,
          description: sprintGroup.description,
          project: {
            id: sprintGroup.PMA_Projects.id,
            name: sprintGroup.PMA_Projects.name,
            description: sprintGroup.PMA_Projects.description,
            priority: sprintGroup.PMA_Projects.priority,
            assignee_id: sprintGroup.PMA_Projects.assignee_id,
            status: sprintGroup.PMA_Projects.status,
          },
        };

        setSelectedSprintGroup(transformedGroup);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error opening sprint group:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSprintGroup(null);
  };

  if (groupedData.length === 0) {
    return null;
  }

  const maxPoints = Math.max(...groupedData.map((g) => g.totalPoints));

  return (
    <div
      className="rounded-lg shadow-sm p-6 mb-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: brandTheme.primary.paleBlue }}
          >
            <Package className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
              Story Points by Sprint Group
            </h2>
            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
              Breakdown of story points across all active sprint groups (epics)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
          <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
            {groupedData.length} Sprint Group{groupedData.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {groupedData.map((group) => {
          const progressPercentage = (group.completedTaskCount / group.taskCount) * 100;
          const pointsPercentage = maxPoints > 0 ? (group.totalPoints / maxPoints) * 100 : 0;

          return (
            <div
              key={group.groupId}
              className="p-4 rounded-lg border hover:shadow-md transition-shadow"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <button
                      onClick={() => handleSprintGroupClick(group.groupId)}
                      className="font-semibold text-lg hover:underline flex items-center space-x-2 transition-colors group"
                      style={{ color: brandTheme.primary.navy }}
                      title="Click to view sprint group details"
                    >
                      <span>{group.groupName}</span>
                      <ExternalLink 
                        size={16} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: brandTheme.primary.navy }} 
                      />
                    </button>
                    <Badge variant="default">{group.taskCount} tasks</Badge>
                  </div>
                  <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                    {group.completedTaskCount} completed • {group.taskCount - group.completedTaskCount} remaining
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Award size={20} style={{ color: brandTheme.primary.navy }} />
                    <span className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
                      {group.totalPoints.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                    total story points
                  </p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: brandTheme.text.muted }}>Story Points Distribution</span>
                  <span style={{ color: brandTheme.text.muted }}>{pointsPercentage.toFixed(0)}% of max</span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: brandTheme.gray[200] }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pointsPercentage}%`,
                      backgroundColor: brandTheme.primary.navy,
                    }}
                  />
                </div>
              </div>

              {/* Completion Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: brandTheme.text.muted }}>Task Completion</span>
                  <span style={{ color: brandTheme.text.muted }}>{progressPercentage.toFixed(0)}% complete</span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: brandTheme.gray[200] }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: brandTheme.status.success,
                    }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                <div className="text-center">
                  <p className="text-xs" style={{ color: brandTheme.text.muted }}>Avg Points/Task</p>
                  <p className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                    {group.averagePoints.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: brandTheme.text.muted }}>Completed</p>
                  <p className="text-sm font-semibold" style={{ color: brandTheme.status.success }}>
                    {group.completedTaskCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: brandTheme.text.muted }}>Remaining</p>
                  <p className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                    {group.taskCount - group.completedTaskCount}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: brandTheme.primary.paleBlue }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
            <span className="font-medium" style={{ color: brandTheme.text.primary }}>
              Overall Summary
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs" style={{ color: brandTheme.text.muted }}>Total Story Points</p>
              <p className="text-xl font-bold" style={{ color: brandTheme.primary.navy }}>
                {groupedData.reduce((sum, g) => sum + g.totalPoints, 0).toFixed(1)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: brandTheme.text.muted }}>Average per Group</p>
              <p className="text-xl font-bold" style={{ color: brandTheme.primary.navy }}>
                {(groupedData.reduce((sum, g) => sum + g.totalPoints, 0) / groupedData.length).toFixed(1)}
              </p>
            </div>
          </div>
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

export default StoryPointsByGroup;

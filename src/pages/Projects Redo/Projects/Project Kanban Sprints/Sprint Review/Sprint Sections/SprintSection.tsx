import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { supabase } from '../../../../../../lib/supabase';
import { ChevronDown, ChevronRight, Calendar, Clock, Target, Users } from 'lucide-react';
import SprintGroupRow from './SprintGroupRow';

interface SprintGroup {
  id: string;
  project_id: string;
  selected_task_ids: string[];
  sprint_type: 'Sprint 1' | 'Sprint 2';
  status: string;
  name: string;
  description?: string;
  created_at: string;
  ranking?: Record<string, number>;
  project: {
    id: string;
    name: string;
    description?: string;
    priority?: string;
    assignee_id?: string;
    status?: string;
  };
  taskCount: number;
  hoursSpent: number;
  hoursPlanned: number;
  teamMembers: number;
}

interface SprintSectionProps {
  sprintType: 'Sprint 1' | 'Sprint 2';
  refreshTrigger?: number;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

const SprintSection: React.FC<SprintSectionProps> = ({
  sprintType,
  refreshTrigger,
  onProjectClick,
  onSprintReviewClick
}) => {
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadSprintGroups();
  }, [sprintType, refreshTrigger]);

  const loadSprintGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select(`
          id,
          project_id,
          selected_task_ids,
          sprint_type,
          status,
          name,
          description,
          created_at,
          ranking,
          PMA_Projects!inner (
            id,
            name,
            description,
            priority,
            assignee_id,
            status
          )
        `)
        .eq('sprint_type', sprintType)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading sprint groups:', error);
        return;
      }

      // Enrich sprint groups with task and hours data
      const enrichedGroups = await Promise.all(
        (data || []).map(async (group: any) => {
          let taskCount = 0;
          let hoursSpent = 0;
          let hoursPlanned = 0;
          let uniqueAssignees = new Set<string>();

          if (group.selected_task_ids && group.selected_task_ids.length > 0) {
            taskCount = group.selected_task_ids.length;

            // Get hours data for all tasks in this sprint group
            const { data: hoursData } = await (supabase as any)
              .from('PMA_Hours')
              .select('hours, is_planning_hours, user_id')
              .in('task_id', group.selected_task_ids);

            if (hoursData) {
              hoursData.forEach((hour: any) => {
                if (hour.is_planning_hours) {
                  hoursPlanned += hour.hours || 0;
                } else {
                  hoursSpent += hour.hours || 0;
                }
                if (hour.user_id) {
                  uniqueAssignees.add(hour.user_id);
                }
              });
            }

            // Also get assignees from tasks themselves
            const { data: tasksData } = await (supabase as any)
              .from('PMA_Tasks')
              .select('assignee_id')
              .in('id', group.selected_task_ids);

            if (tasksData) {
              tasksData.forEach((task: any) => {
                if (task.assignee_id) {
                  uniqueAssignees.add(task.assignee_id);
                }
              });
            }
          }

          return {
            ...group,
            project: group.PMA_Projects,
            taskCount,
            hoursSpent,
            hoursPlanned,
            teamMembers: uniqueAssignees.size
          };
        })
      );

      // Sort by ranking for this sprint type, then by created_at
      const rankingKey = `Sprint: ${sprintType}`;
      const sortedGroups = enrichedGroups.sort((a, b) => {
        const rankA = a.ranking?.[rankingKey];
        const rankB = b.ranking?.[rankingKey];

        // If both have ranks, sort by rank (ascending)
        if (rankA !== undefined && rankB !== undefined) {
          return rankA - rankB;
        }

        // If only A has a rank, it comes first
        if (rankA !== undefined) return -1;

        // If only B has a rank, it comes first
        if (rankB !== undefined) return 1;

        // If neither has a rank, sort by created_at (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSprintGroups(sortedGroups);
    } catch (error) {
      console.error('Error loading sprint groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalGroups = sprintGroups.length;
  const totalTasks = sprintGroups.reduce((sum, group) => sum + group.taskCount, 0);
  const totalHoursSpent = sprintGroups.reduce((sum, group) => sum + group.hoursSpent, 0);
  const totalHoursPlanned = sprintGroups.reduce((sum, group) => sum + group.hoursPlanned, 0);
  const totalTeamMembers = new Set(sprintGroups.flatMap(group => 
    Array.from({ length: group.teamMembers }, (_, i) => `${group.id}-${i}`)
  )).size;

  // Check if any sprint group has tasks with 0 planned hours
  const hasUnplannedTasks = async () => {
    for (const group of sprintGroups) {
      if (group.selected_task_ids && group.selected_task_ids.length > 0) {
        const { data: tasksData } = await (supabase as any)
          .from('PMA_Hours')
          .select('task_id, hours')
          .in('task_id', group.selected_task_ids)
          .eq('is_planning_hours', true);

        // Get unique task IDs that have planned hours
        const tasksWithPlannedHours = new Set(
          (tasksData || []).filter((hour: any) => hour.hours > 0).map((hour: any) => hour.task_id)
        );

        // Check if any task in this group has no planned hours
        const hasUnplanned = group.selected_task_ids.some(taskId => !tasksWithPlannedHours.has(taskId));
        if (hasUnplanned) {
          return true;
        }
      }
    }
    return false;
  };

  const [hasAnyUnplannedTasks, setHasAnyUnplannedTasks] = React.useState(false);

  React.useEffect(() => {
    const checkUnplannedTasks = async () => {
      const result = await hasUnplannedTasks();
      setHasAnyUnplannedTasks(result);
    };
    
    if (sprintGroups.length > 0) {
      checkUnplannedTasks();
    }
  }, [sprintGroups]);

  const getSprintColor = (sprintType: string) => {
    return sprintType === 'Sprint 1' 
      ? { 
          bg: brandTheme.primary.paleBlue, 
          text: brandTheme.primary.navy, 
          border: brandTheme.primary.lightBlue,
          headerBg: brandTheme.primary.navy,
          headerText: brandTheme.background.primary
        }
      : { 
          bg: brandTheme.background.brandLight, 
          text: brandTheme.text.primary, 
          border: brandTheme.border.brand,
          headerBg: brandTheme.secondary.slate,
          headerText: brandTheme.background.primary
        };
  };

  const sprintColors = getSprintColor(sprintType);

  return (
    <div 
      className="rounded-lg border shadow-md"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: sprintColors.border,
        borderWidth: '2px',
        boxShadow: brandTheme.shadow.md
      }}
    >
      {/* Sprint Section Header */}
      <div 
        className="px-6 py-4 cursor-pointer hover:opacity-90 transition-all duration-200"
        style={{ 
          backgroundColor: sprintColors.headerBg,
          borderTopLeftRadius: brandTheme.radius.lg,
          borderTopRightRadius: brandTheme.radius.lg
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" style={{ color: sprintColors.headerText }} />
            ) : (
              <ChevronRight className="w-5 h-5" style={{ color: sprintColors.headerText }} />
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" style={{ color: sprintColors.headerText }} />
              <h3 
                className="text-xl font-bold"
                style={{ color: sprintColors.headerText }}
              >
                {sprintType}
              </h3>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" style={{ color: sprintColors.headerText }} />
              <span 
                className="text-sm font-medium"
                style={{ color: sprintColors.headerText }}
              >
                {totalGroups} groups
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" style={{ color: sprintColors.headerText }} />
              <span 
                className="text-sm font-medium"
                style={{ color: sprintColors.headerText }}
              >
                {totalTasks} tasks
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" style={{ color: sprintColors.headerText }} />
              <span 
                className="text-sm font-medium"
                style={{ color: sprintColors.headerText }}
              >
                {totalHoursSpent.toFixed(1)}h spent
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" style={{ color: sprintColors.headerText }} />
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: (totalHoursPlanned === 0 || hasAnyUnplannedTasks) ? brandTheme.status.error : sprintColors.headerText
                }}
              >
                {totalHoursPlanned.toFixed(1)}h planned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t" style={{ borderColor: sprintColors.border }}>
          {isLoading ? (
            <div className="p-8 text-center">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: brandTheme.primary.navy }}
              />
              <p style={{ color: brandTheme.text.secondary }}>
                Loading {sprintType} groups...
              </p>
            </div>
          ) : sprintGroups.length === 0 ? (
            <div 
              className="p-8 text-center"
              style={{ color: brandTheme.text.muted }}
            >
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h4 className="text-lg font-semibold mb-2">No {sprintType} Groups</h4>
              <p>Create sprint groups from the Kanban board above</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Sprint Group Rows */}
              <div className="space-y-3">
                {sprintGroups.map((group) => (
                  <SprintGroupRow
                    key={group.id}
                    sprintGroup={group}
                    onProjectClick={onProjectClick}
                    onSprintReviewClick={onSprintReviewClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SprintSection;

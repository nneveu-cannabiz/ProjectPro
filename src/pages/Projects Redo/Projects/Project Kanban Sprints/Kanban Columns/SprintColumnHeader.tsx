import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import UserAvatar from '../../../../../components/UserAvatar';

interface UserHoursSummary {
  user_id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_color?: string;
  };
  hoursSpent: number;
  hoursPlanned: number;
  taskCount: number;
}

interface SprintColumnHeaderProps {
  sprintType: 'Sprint 1' | 'Sprint 2';
  refreshTrigger?: number;
  sprintGroupCount?: number;
}

const SprintColumnHeader: React.FC<SprintColumnHeaderProps> = ({ sprintType, refreshTrigger, sprintGroupCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userSummaries, setUserSummaries] = useState<UserHoursSummary[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPlanned, setTotalPlanned] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSprintHoursSummary();
  }, [sprintType, refreshTrigger]);

  const loadSprintHoursSummary = async () => {
    setIsLoading(true);
    try {
      // Get all active sprint groups for this sprint type
      const { data: sprintGroups, error: sprintError } = await (supabase as any)
        .from('PMA_Sprints')
        .select('selected_task_ids')
        .eq('sprint_type', sprintType)
        .eq('status', 'active');

      if (sprintError) {
        console.error('Error fetching sprint groups:', sprintError);
        return;
      }

      if (!sprintGroups || sprintGroups.length === 0) {
        setUserSummaries([]);
        setTotalSpent(0);
        setTotalPlanned(0);
        return;
      }

      // Collect all task IDs from all sprint groups
      const allTaskIds = sprintGroups.reduce((acc: string[], group: any) => {
        return acc.concat(group.selected_task_ids || []);
      }, []);

      if (allTaskIds.length === 0) {
        setUserSummaries([]);
        setTotalSpent(0);
        setTotalPlanned(0);
        setTotalTasks(0);
        return;
      }

      // Set total tasks count
      setTotalTasks(allTaskIds.length);

      // Get all hours for these tasks
      const { data: hoursData, error: hoursError } = await (supabase as any)
        .from('PMA_Hours')
        .select(`
          user_id,
          task_id,
          hours,
          is_planning_hours,
          PMA_Users!inner (
            id,
            email,
            first_name,
            last_name,
            profile_color
          )
        `)
        .in('task_id', allTaskIds);

      if (hoursError) {
        console.error('Error fetching hours data:', hoursError);
        return;
      }

      // Group by user and calculate totals
      const userHoursMap = new Map<string, UserHoursSummary>();
      const userTasksMap = new Map<string, Set<string>>(); // Track unique tasks per user
      let totalSpentHours = 0;
      let totalPlannedHours = 0;

      (hoursData || []).forEach((hour: any) => {
        const userId = hour.user_id;
        const taskId = hour.task_id;
        const hours = hour.hours || 0;
        const isPlanning = hour.is_planning_hours === true;

        if (!userHoursMap.has(userId)) {
          userHoursMap.set(userId, {
            user_id: userId,
            user: hour.PMA_Users,
            hoursSpent: 0,
            hoursPlanned: 0,
            taskCount: 0
          });
        }

        if (!userTasksMap.has(userId)) {
          userTasksMap.set(userId, new Set<string>());
        }

        // Add task to user's task set (Set automatically handles duplicates)
        userTasksMap.get(userId)!.add(taskId);

        const userSummary = userHoursMap.get(userId)!;
        if (isPlanning) {
          userSummary.hoursPlanned += hours;
          totalPlannedHours += hours;
        } else {
          userSummary.hoursSpent += hours;
          totalSpentHours += hours;
        }
      });

      // Update task counts for each user
      userTasksMap.forEach((taskSet, userId) => {
        const userSummary = userHoursMap.get(userId);
        if (userSummary) {
          userSummary.taskCount = taskSet.size;
        }
      });

      // Sort users by total hours (spent + planned) descending
      const sortedUsers = Array.from(userHoursMap.values()).sort(
        (a, b) => (b.hoursSpent + b.hoursPlanned) - (a.hoursSpent + a.hoursPlanned)
      );

      setUserSummaries(sortedUsers);
      setTotalSpent(totalSpentHours);
      setTotalPlanned(totalPlannedHours);
    } catch (error) {
      console.error('Error loading sprint hours summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="border-b"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light 
      }}
    >
      {/* Collapsed Summary */}
      <div 
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
            )}
            <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
              Sprint Summary
            </span>
          </div>
          
          {!isLoading && (
            <div className="flex items-center space-x-3 text-xs" style={{ color: brandTheme.text.secondary }}>
              <span>{sprintGroupCount} groups</span>
              <span>•</span>
              <span>{totalTasks} tasks</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{totalSpent.toFixed(1)}h spent</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>{totalPlanned.toFixed(1)}h planned</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2"
                style={{ borderColor: brandTheme.primary.navy }}
              />
              <span className="ml-2 text-xs" style={{ color: brandTheme.text.secondary }}>
                Loading team data...
              </span>
            </div>
          ) : userSummaries.length === 0 ? (
            <div 
              className="text-center py-4 text-xs"
              style={{ color: brandTheme.text.muted }}
            >
              No team members assigned yet
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-medium pb-2 border-b" 
                   style={{ 
                     color: brandTheme.text.secondary,
                     borderColor: brandTheme.border.light 
                   }}>
                <span>Team Member</span>
                <div className="flex space-x-6">
                  <span>Tasks</span>
                  <span>Spent</span>
                  <span>Planned</span>
                </div>
              </div>

              {/* User Rows */}
              {userSummaries.map((userSummary) => (
                <div key={userSummary.user_id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <UserAvatar 
                      user={{
                        id: userSummary.user.id,
                        email: userSummary.user.email || '',
                        firstName: userSummary.user.first_name || '',
                        lastName: userSummary.user.last_name || '',
                        profileColor: userSummary.user.profile_color
                      }}
                      size="xs"
                      showName={true}
                      className="text-[10px]"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-6 text-xs">
                    <div className="w-10 text-right">
                      <span className="font-medium" style={{ color: brandTheme.text.primary }}>
                        {userSummary.taskCount}
                      </span>
                    </div>
                    <div className="w-12 text-right">
                      <span className="font-medium" style={{ color: brandTheme.text.primary }}>
                        {userSummary.hoursSpent.toFixed(1)}h
                      </span>
                    </div>
                    <div className="w-12 text-right">
                      <span className="font-medium" style={{ color: brandTheme.text.primary }}>
                        {userSummary.hoursPlanned.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals Row */}
              <div className="flex items-center justify-between py-2 border-t font-medium" 
                   style={{ borderColor: brandTheme.border.light }}>
                <span className="text-xs" style={{ color: brandTheme.text.primary }}>
                  Total
                </span>
                <div className="flex items-center space-x-6 text-xs">
                  <div className="w-10 text-right">
                    <span className="font-semibold" style={{ color: brandTheme.text.primary }}>
                      {totalTasks}
                    </span>
                  </div>
                  <div className="w-12 text-right">
                    <span className="font-semibold" style={{ color: brandTheme.text.primary }}>
                      {totalSpent.toFixed(1)}h
                    </span>
                  </div>
                  <div className="w-12 text-right">
                    <span className="font-semibold" style={{ color: brandTheme.text.primary }}>
                      {totalPlanned.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SprintColumnHeader;

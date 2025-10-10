import { useState, useEffect } from 'react';
import { supabase } from '../../../../../../lib/supabase';
import { SprintGroup, HistoricalSprint, TaskWithSprintInfo } from './types';

export const useSprintData = () => {
  const [loading, setLoading] = useState(true);
  const [historicalSprints, setHistoricalSprints] = useState<HistoricalSprint[]>([]);
  const [ungroupedSprints, setUngroupedSprints] = useState<SprintGroup[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithSprintInfo[]>([]);
  const [subtasksMap, setSubtasksMap] = useState<Map<string, any[]>>(new Map());
  const [storyPointsMap, setStoryPointsMap] = useState<Map<string, number>>(new Map());

  const loadSprintData = async () => {
    setLoading(true);
    try {
      // Fetch all sprint groups with ranking and project info (left join to allow nulls)
      const { data: sprintGroups, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select(`
          id, 
          name, 
          sprint_type, 
          created_at, 
          sprint_id, 
          start_date, 
          end_date, 
          selected_task_ids, 
          ranking, 
          project_id,
          PMA_Projects (
            id,
            name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sprint groups:', error);
        return;
      }

      console.log('=== SPRINT HISTORY: Fetched sprint groups ===', sprintGroups?.length || 0);

      if (!sprintGroups || sprintGroups.length === 0) {
        console.log('No sprint groups found');
        setHistoricalSprints([]);
        setUngroupedSprints([]);
        setAllTasks([]);
        return;
      }

      // Transform and separate groups with sprint_id from those without
      const grouped: SprintGroup[] = [];
      const ungrouped: SprintGroup[] = [];

      sprintGroups.forEach((group: any) => {
        // Transform the group to include project info (handle null projects)
        const transformedGroup: SprintGroup = {
          ...group,
          project: group.PMA_Projects && group.PMA_Projects.id ? {
            id: group.PMA_Projects.id,
            name: group.PMA_Projects.name,
          } : undefined,
          // Ensure selected_task_ids is always an array
          selected_task_ids: group.selected_task_ids || [],
        };
        
        if (transformedGroup.sprint_id) {
          grouped.push(transformedGroup);
        } else {
          ungrouped.push(transformedGroup);
        }
      });

      // Group by sprint_id
      const sprintMap = new Map<string, HistoricalSprint>();
      grouped.forEach((group) => {
        if (!sprintMap.has(group.sprint_id!)) {
          sprintMap.set(group.sprint_id!, {
            sprint_id: group.sprint_id!,
            groups: [],
            start_date: group.start_date,
            end_date: group.end_date,
          });
        }
        sprintMap.get(group.sprint_id!)!.groups.push(group);
      });

      // Auto-assign rankings to epics that don't have them yet, then sort
      const rankingUpdates = [];
      sprintMap.forEach((sprint) => {
        const sprintKey = `Sprint ${sprint.sprint_id}`;
        
        // Separate epics with and without rankings
        const withRanking = sprint.groups.filter(g => g.ranking?.[sprintKey]);
        const withoutRanking = sprint.groups.filter(g => !g.ranking?.[sprintKey]);
        
        // If there are epics without rankings, assign them
        if (withoutRanking.length > 0) {
          const highestRank = withRanking.length > 0
            ? Math.max(...withRanking.map(g => g.ranking[sprintKey]))
            : 0;
          
          let nextRank = highestRank + 1;
          withoutRanking.forEach(group => {
            const newRanking = { ...(group.ranking || {}), [sprintKey]: nextRank };
            group.ranking = newRanking; // Update local object
            
            // Queue update to database
            rankingUpdates.push(
              (supabase as any)
                .from('PMA_Sprints')
                .update({ ranking: newRanking })
                .eq('id', group.id)
            );
            nextRank++;
          });
        }
        
        // Sort all groups by ranking
        sprint.groups.sort((a, b) => {
          const rankA = a.ranking?.[sprintKey] || Infinity;
          const rankB = b.ranking?.[sprintKey] || Infinity;
          return rankA - rankB;
        });
      });
      
      // Execute all ranking updates in parallel (fire and forget)
      if (rankingUpdates.length > 0) {
        Promise.all(rankingUpdates).catch(err => 
          console.error('Error auto-assigning rankings:', err)
        );
      }

      const sortedSprints = Array.from(sprintMap.values()).sort((a, b) => {
        // First determine status for each sprint
        const getStatus = (sprint: HistoricalSprint) => {
          if (!sprint.start_date || !sprint.end_date) return 3; // Not scheduled - last
          
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const start = new Date(sprint.start_date);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(sprint.end_date);
          end.setHours(0, 0, 0, 0);
          
          if (now >= start && now <= end) return 0; // Active - first
          if (now < start) return 1; // Upcoming - second
          return 2; // Completed - third
        };
        
        const statusA = getStatus(a);
        const statusB = getStatus(b);
        
        // Sort by status first
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Within same status, sort by date
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        
        // For active and upcoming, sort by start date ascending (soonest first)
        // For completed, sort by end date descending (most recent first)
        if (statusA === 2) {
          // Completed - most recent first
          return new Date(b.end_date || b.start_date).getTime() - new Date(a.end_date || a.start_date).getTime();
        } else {
          // Active/Upcoming - soonest first
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        }
      });
      
      setHistoricalSprints(sortedSprints);
      setUngroupedSprints(ungrouped);

      // Fetch tasks for all sprint groups (both historical and ungrouped)
      const allSprintGroups = [...grouped, ...ungrouped];
      
      console.log('=== SPRINT HISTORY: Collecting task IDs ===');
      console.log('All sprint groups to process:', allSprintGroups.length);
      
      // Collect all task IDs from selected_task_ids
      const allTaskIds: string[] = [];
      const taskToSprintMap: Record<string, string> = {}; // Map task_id to group_id
      
      allSprintGroups.forEach((group: SprintGroup) => {
        console.log(`Group: ${group.name} (${group.id})`);
        console.log('  selected_task_ids type:', typeof group.selected_task_ids);
        console.log('  selected_task_ids raw:', group.selected_task_ids);
        
        // Parse task IDs if they come as a string
        let taskIds: any = group.selected_task_ids;
        if (typeof taskIds === 'string') {
          try {
            taskIds = JSON.parse(taskIds);
            console.log('  Parsed from string to:', taskIds);
          } catch (e) {
            console.error('  Failed to parse task IDs:', e);
            return;
          }
        }
        
        console.log('  is array:', Array.isArray(taskIds));
        
        if (taskIds && Array.isArray(taskIds)) {
          console.log('  task count:', taskIds.length);
          (taskIds as string[]).forEach((taskId: string) => {
            if (!allTaskIds.includes(taskId)) {
              allTaskIds.push(taskId);
            }
            taskToSprintMap[taskId] = group.id;
          });
        } else {
          console.log('  Task IDs is not an array or is null');
        }
      });

      console.log('=== SPRINT HISTORY: Total task IDs collected ===', allTaskIds.length);
      console.log('Task IDs:', allTaskIds.slice(0, 5), '...');

      if (allTaskIds.length > 0) {
        // Fetch all users first
        const { data: usersData } = await supabase.from('PMA_Users').select('*');
        const usersMap: Record<string, any> = {};
        if (usersData) {
          usersData.forEach((u: any) => {
            usersMap[u.id] = {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              email: u.email,
            };
          });
        }
        console.log('=== SPRINT HISTORY: Fetched users ===', Object.keys(usersMap).length);

        // Fetch all tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('PMA_Tasks')
          .select(`
            id,
            name,
            status,
            description,
            priority,
            assignee_id
          `)
          .in('id', allTaskIds);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else {
          console.log('=== SPRINT HISTORY: Fetched tasks ===', tasksData?.length || 0);
          
          // Map tasks with sprint group info and assignee
          const enrichedTasks: TaskWithSprintInfo[] = (tasksData || []).map((task: any) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            description: task.description,
            priority: task.priority,
            assignee: task.assignee_id ? usersMap[task.assignee_id] : undefined,
            sprintGroupId: taskToSprintMap[task.id],
          }));

          console.log('=== SPRINT HISTORY: Enriched tasks ===', enrichedTasks.length);

          setAllTasks(enrichedTasks);

          // Fetch story points (planned hours) for all tasks
          if (tasksData && tasksData.length > 0) {
            const taskIds = tasksData.map((t: any) => t.id);
            const { data: hoursData } = await (supabase as any)
              .from('PMA_Hours')
              .select('task_id, hours')
              .in('task_id', taskIds)
              .eq('is_planning_hours', true);

            const newStoryPointsMap = new Map<string, number>();
            hoursData?.forEach((hour: any) => {
              newStoryPointsMap.set(hour.task_id, hour.hours || 0);
            });

            console.log('=== SPRINT HISTORY: Story points fetched ===', newStoryPointsMap.size);
            setStoryPointsMap(newStoryPointsMap);
          }

          // Fetch subtasks for all tasks
          if (tasksData && tasksData.length > 0) {
            const taskIds = tasksData.map((t: any) => t.id);
            const { data: subtasksData, error: subtasksError } = await supabase
              .from('PMA_SubTasks')
              .select('*')
              .in('task_id', taskIds);

            if (subtasksError) {
              console.error('Error fetching subtasks:', subtasksError);
            } else {
              console.log('=== SPRINT HISTORY: Fetched subtasks ===', subtasksData?.length || 0);
              
              // Group subtasks by task_id and enrich with assignee
              const newSubtasksMap = new Map<string, any[]>();
              subtasksData?.forEach((subtask: any) => {
                const taskId = subtask.task_id;
                if (!newSubtasksMap.has(taskId)) {
                  newSubtasksMap.set(taskId, []);
                }
                // Enrich subtask with assignee info
                const enrichedSubtask = {
                  ...subtask,
                  assignee: subtask.assignee_id ? usersMap[subtask.assignee_id] : undefined,
                };
                newSubtasksMap.get(taskId)!.push(enrichedSubtask);
              });

              console.log('=== SPRINT HISTORY: Subtasks map created ===', newSubtasksMap.size, 'tasks with subtasks');

              setSubtasksMap(newSubtasksMap);
            }
          }
        }
      } else {
        console.log('=== SPRINT HISTORY: No task IDs found ===');
        setAllTasks([]);
      }
    } catch (error) {
      console.error('Error loading sprint data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSprintData();
  }, []);

  return {
    loading,
    historicalSprints,
    ungroupedSprints,
    allTasks,
    subtasksMap,
    storyPointsMap,
    refreshData: loadSprintData,
  };
};


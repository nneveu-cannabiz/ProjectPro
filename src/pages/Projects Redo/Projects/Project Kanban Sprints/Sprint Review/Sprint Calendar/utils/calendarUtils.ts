import { supabase } from '../../../../../../../lib/supabase';
import { getMonthRange } from './dateUtils';

interface SprintGroup {
  id: string;
  name: string;
  sprint_type: 'Sprint 1' | 'Sprint 2';
  project: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    priority?: string;
  }>;
}

/**
 * Fetch sprint groups and their tasks for calendar display
 */
export const fetchSprintGroupsForCalendar = async (currentDate: Date): Promise<SprintGroup[]> => {
  try {
    console.log('Fetching sprint groups for calendar:', currentDate);

    // Get the month range to filter relevant sprint groups
    const { start: monthStart, end: monthEnd } = getMonthRange(currentDate);

    // Fetch sprint groups
    const { data: sprintGroupsData, error: sprintGroupsError } = await (supabase as any)
      .from('PMA_Sprints')
      .select(`
        id,
        project_id,
        selected_task_ids,
        sprint_type,
        status,
        created_at,
        PMA_Projects!inner(
          id,
          name,
          description
        )
      `)
      .eq('status', 'active');

    if (sprintGroupsError) {
      console.error('Error fetching sprint groups:', sprintGroupsError);
      return [];
    }

    if (!sprintGroupsData || sprintGroupsData.length === 0) {
      console.log('No sprint groups found');
      return [];
    }

    // Process each sprint group
    const processedSprintGroups = await Promise.all(
      sprintGroupsData.map(async (group: any) => {
        try {
          // Generate sprint group name
          const sprintName = `${group.PMA_Projects.name} - ${group.sprint_type}`;

          // Fetch tasks for this sprint group
          let tasks: any[] = [];
          if (group.selected_task_ids && group.selected_task_ids.length > 0) {
            const { data: tasksData, error: tasksError } = await (supabase as any)
              .from('PMA_Tasks')
              .select(`
                id,
                name,
                start_date,
                end_date,
                status,
                priority,
                assignee_id
              `)
              .in('id', group.selected_task_ids);

            if (tasksError) {
              console.error('Error fetching tasks for sprint group:', group.id, tasksError);
            } else {
              tasks = tasksData || [];
            }
          }

          // Filter tasks that have dates within or overlapping the current month
          const relevantTasks = tasks.filter(task => {
            if (!task.start_date && !task.end_date) return false;
            
            const taskStart = task.start_date ? new Date(task.start_date) : null;
            const taskEnd = task.end_date ? new Date(task.end_date) : null;
            
            // Include if task starts, ends, or spans the current month
            if (taskStart && taskEnd) {
              return (taskStart <= monthEnd && taskEnd >= monthStart);
            } else if (taskStart) {
              return (taskStart >= monthStart && taskStart <= monthEnd);
            } else if (taskEnd) {
              return (taskEnd >= monthStart && taskEnd <= monthEnd);
            }
            
            return false;
          });

          return {
            id: group.id,
            name: sprintName,
            sprint_type: group.sprint_type,
            project: {
              id: group.PMA_Projects.id,
              name: group.PMA_Projects.name
            },
            tasks: relevantTasks
          };
        } catch (error) {
          console.error('Error processing sprint group:', group.id, error);
          return null;
        }
      })
    );

    // Filter out null results and groups with no relevant tasks
    const validSprintGroups = processedSprintGroups
      .filter((group): group is SprintGroup => group !== null && group.tasks.length > 0);

    console.log('Processed sprint groups for calendar:', validSprintGroups.length);
    return validSprintGroups;

  } catch (error) {
    console.error('Error in fetchSprintGroupsForCalendar:', error);
    return [];
  }
};

/**
 * Get sprint group statistics for a specific date range
 */
export const getSprintGroupStats = (sprintGroups: SprintGroup[], startDate: Date, endDate: Date) => {
  const stats = {
    totalGroups: 0,
    sprint1Groups: 0,
    sprint2Groups: 0,
    totalTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  };

  const today = new Date();

  sprintGroups.forEach(group => {
    stats.totalGroups++;
    
    if (group.sprint_type === 'Sprint 1') {
      stats.sprint1Groups++;
    } else {
      stats.sprint2Groups++;
    }

    group.tasks.forEach(task => {
      stats.totalTasks++;
      
      if (task.status?.toLowerCase() === 'in-progress') {
        stats.inProgressTasks++;
      }
      
      if (task.end_date) {
        const taskEndDate = new Date(task.end_date);
        if (taskEndDate < today && task.status?.toLowerCase() !== 'done') {
          stats.overdueTasks++;
        }
      }
    });
  });

  return stats;
};


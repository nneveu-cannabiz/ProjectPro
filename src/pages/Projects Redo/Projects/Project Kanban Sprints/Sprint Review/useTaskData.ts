import { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { Task, TaskHours } from './types';
import { sortTasks } from './utils';

export const useTaskData = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);
    console.log('Loading tasks for project ID:', projectId);
    
    try {
      // Fetch tasks for the project - simplified query first
      const { data: tasksData, error: tasksError } = await supabase
        .from('PMA_Tasks')
        .select(`
          id,
          name,
          priority,
          assignee_id,
          project_id,
          status
        `)
        .eq('project_id', projectId);

      console.log('Tasks query result:', { tasksData, tasksError, projectId });

      if (tasksError) {
        console.error('Tasks query error:', tasksError);
        throw tasksError;
      }

      // Fetch user names separately if we have assignee_ids
      const assigneeIds = tasksData?.filter(task => task.assignee_id).map(task => task.assignee_id) || [];
      let usersData: any[] = [];
      
      if (assigneeIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('PMA_Users')
          .select('id, first_name, last_name')
          .in('id', assigneeIds);
          
        if (!userError) {
          usersData = userData || [];
        }
      }

      // Fetch hours data for all tasks
      const taskIds = tasksData?.map(task => task.id) || [];
      
      if (taskIds.length > 0) {
        const { data: hoursData, error: hoursError } = await supabase
          .from('PMA_Hours')
          .select('task_id, hours, is_planning_hours')
          .in('task_id', taskIds);

        if (hoursError) throw hoursError;

        // Calculate hours spent and planned for each task
        const taskHours: Record<string, TaskHours> = {};
        
        hoursData?.forEach(hour => {
          if (!taskHours[hour.task_id]) {
            taskHours[hour.task_id] = {
              task_id: hour.task_id,
              total_actual_hours: 0,
              total_planned_hours: 0
            };
          }
          
          if (hour.is_planning_hours) {
            taskHours[hour.task_id].total_planned_hours += Number(hour.hours);
          } else {
            taskHours[hour.task_id].total_actual_hours += Number(hour.hours);
          }
        });

        // Combine tasks with hours data and user names
        const tasksWithHours: Task[] = tasksData?.map(task => {
          const user = usersData.find(u => u.id === task.assignee_id);
          const assigneeName = user ? 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
            undefined;
            
          return {
            id: task.id,
            name: task.name,
            priority: task.priority,
            assignee_id: task.assignee_id,
            project_id: task.project_id,
            status: task.status,
            hoursSpent: taskHours[task.id]?.total_actual_hours || 0,
            hoursPlanned: taskHours[task.id]?.total_planned_hours || 0,
            assigneeName: assigneeName
          };
        }) || [];

        const sortedTasks = sortTasks(tasksWithHours);
        console.log('Final tasks with hours:', sortedTasks);
        setTasks(sortedTasks);
      } else {
        // Handle case where there are tasks but no hours logged yet
        const tasksWithoutHours: Task[] = tasksData?.map(task => {
          const user = usersData.find(u => u.id === task.assignee_id);
          const assigneeName = user ? 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
            undefined;
            
          return {
            id: task.id,
            name: task.name,
            priority: task.priority,
            assignee_id: task.assignee_id,
            project_id: task.project_id,
            status: task.status,
            hoursSpent: 0,
            hoursPlanned: 0,
            assigneeName: assigneeName
          };
        }) || [];
        
        const sortedTasksWithoutHours = sortTasks(tasksWithoutHours);
        console.log('Tasks without hours:', sortedTasksWithoutHours);
        setTasks(sortedTasksWithoutHours);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  return {
    tasks,
    isLoading,
    loadTasks
  };
};

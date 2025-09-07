import React from 'react';
import { Task, User } from '../../../../../../../types';
import TaskBar from './TaskBar';

// Temporary inline constants and functions to avoid import issues
const TASK_BAR_HEIGHT = 32;
const TASK_BAR_SPACING = 2; // Reduced spacing between tasks

const calculateTaskContainerHeight = (visibleTasks: Task[]): number => {
  if (!visibleTasks || visibleTasks.length === 0) {
    return 0; // No task container needed - return 0!
  }
  
  const taskCount = visibleTasks.length;
  const totalTaskHeight = taskCount * TASK_BAR_HEIGHT;
  const totalSpacing = Math.max(0, taskCount - 1) * TASK_BAR_SPACING;
  const containerPadding = 2; // Ultra minimal padding for task container
  
  return totalTaskHeight + totalSpacing + containerPadding;
};

const separateOverdueTasks = (tasks: Task[]): { overdueTasks: Task[]; regularTasks: Task[] } => {
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const overdueTasks: Task[] = [];
  const regularTasks: Task[] = [];
  
  tasks.forEach(task => {
    if (task.status === 'done') {
      // Skip done tasks
      return;
    }
    
    const isOverdue = task.endDate && 
      new Date(task.endDate).getTime() < todayNormalized.getTime();
    
    if (isOverdue) {
      overdueTasks.push(task);
    } else {
      regularTasks.push(task);
    }
  });
  
  return { overdueTasks, regularTasks };
};

export interface TaskContainerProps {
  tasks: Task[];
  projectStart: Date;
  projectEnd: Date;
  weekStart: Date;
  onTaskClick?: (taskId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  users?: User[];
  projectAssigneeId?: string;
}

const TaskContainer: React.FC<TaskContainerProps> = ({
  tasks,
  projectStart,
  projectEnd,
  weekStart,
  onTaskClick,
  onTaskUpdatesClick,
  getTaskUpdatesCount,
  users = [],
  projectAssigneeId
}) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }
  
  // Separate overdue and regular tasks
  const { overdueTasks, regularTasks } = separateOverdueTasks(tasks);
  
  // Calculate container height
  const containerHeight = calculateTaskContainerHeight(tasks);
  
  return (
    <div
      className="relative"
      style={{
        height: `${containerHeight}px`,
        minHeight: `${containerHeight}px`,
        marginBottom: '2px'
      }}
    >
      {/* Regular Tasks */}
      {regularTasks.map((task, index) => {
        const taskUpdatesCount = getTaskUpdatesCount ? getTaskUpdatesCount(task.id) : { unreadCount: 0, totalCount: 0 };
        
        return (
          <TaskBar
            key={task.id}
            task={task}
            projectStart={projectStart}
            projectEnd={projectEnd}
            weekStart={weekStart}
            stackLevel={index}
            onTaskClick={onTaskClick}
            onUpdatesClick={onTaskUpdatesClick}
            unreadUpdatesCount={taskUpdatesCount.unreadCount}
            totalUpdatesCount={taskUpdatesCount.totalCount}
            isClickable={!!onTaskClick}
            users={users}
            projectAssigneeId={projectAssigneeId}
          />
        );
      })}
      
      {/* Overdue Tasks - Stack after regular tasks */}
      {overdueTasks.map((task, index) => {
        const taskUpdatesCount = getTaskUpdatesCount ? getTaskUpdatesCount(task.id) : { unreadCount: 0, totalCount: 0 };
        const stackLevel = regularTasks.length + index;
        
        return (
          <TaskBar
            key={`overdue-${task.id}`}
            task={task}
            projectStart={projectStart}
            projectEnd={projectEnd}
            weekStart={weekStart}
            stackLevel={stackLevel}
            onTaskClick={onTaskClick}
            onUpdatesClick={onTaskUpdatesClick}
            unreadUpdatesCount={taskUpdatesCount.unreadCount}
            totalUpdatesCount={taskUpdatesCount.totalCount}
            isClickable={!!onTaskClick}
            users={users}
            projectAssigneeId={projectAssigneeId}
          />
        );
      })}
    </div>
  );
};

export default TaskContainer;


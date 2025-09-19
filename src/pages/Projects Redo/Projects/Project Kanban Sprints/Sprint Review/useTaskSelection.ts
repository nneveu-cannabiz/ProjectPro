import { useState, useCallback } from 'react';
import { Task } from './types';

export const useTaskSelection = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectionMode = useCallback((tasks: Task[]): Task[] => {
    setIsSelectionMode(prev => {
      const newMode = !prev;
      
      // If entering selection mode, select all active tasks (not completed)
      if (newMode) {
        return tasks.map(task => ({
          ...task,
          isSelected: task.status?.toLowerCase() !== 'done'
        }));
      } else {
        // If exiting selection mode, clear all selections
        return tasks.map(task => ({
          ...task,
          isSelected: false
        }));
      }
    });
    
    // Return the updated tasks - this will be handled by the parent component
    return tasks;
  }, []);

  const updateTaskSelection = useCallback((tasks: Task[], taskId: string, isSelected: boolean): Task[] => {
    return tasks.map(task =>
      task.id === taskId ? { ...task, isSelected } : task
    );
  }, []);

  return {
    isSelectionMode,
    setIsSelectionMode,
    toggleSelectionMode,
    updateTaskSelection
  };
};

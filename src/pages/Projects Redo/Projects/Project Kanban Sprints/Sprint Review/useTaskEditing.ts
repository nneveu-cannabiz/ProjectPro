import { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { EditingCell } from './types';

export const useTaskEditing = (onTasksUpdate: () => void) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEditStart = (taskId: string, field: string, currentValue: string | number) => {
    setEditingCell({ taskId, field });
    setEditValue(currentValue.toString());
  };

  const handleEditSave = async (taskId: string, field: string) => {
    try {
      let updateData: any = {};
      
      if (field === 'priority') {
        updateData.priority = editValue;
      } else if (field === 'assignee_id') {
        updateData.assignee_id = editValue;
      } else if (field === 'status') {
        updateData.status = editValue;
      }
      
      // Update task in database
      if (field === 'priority' || field === 'assignee_id' || field === 'status') {
        const { error } = await supabase
          .from('PMA_Tasks')
          .update(updateData)
          .eq('id', taskId);
          
        if (error) throw error;
      }
      
      // Handle Hours Planned editing
      if (field === 'hoursPlanned') {
        const plannedHours = parseFloat(editValue) || 0;
        
        // Get current user ID (you may need to adjust this based on your auth setup)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // First, delete existing planning hours for this task
        const { error: deleteError } = await supabase
          .from('PMA_Hours')
          .delete()
          .eq('task_id', taskId)
          .eq('is_planning_hours', true);
          
        if (deleteError) throw deleteError;
        
        // If planned hours > 0, create new planning hours record
        if (plannedHours > 0) {
          const { error: insertError } = await supabase
            .from('PMA_Hours')
            .insert({
              user_id: user.id,
              task_id: taskId,
              hours: plannedHours,
              date: new Date().toISOString().split('T')[0], // Today's date
              is_planning_hours: true
            });
            
          if (insertError) throw insertError;
        }
      }
      
      setEditingCell(null);
      setEditValue('');
      await onTasksUpdate(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditValueChange = (value: string) => {
    setEditValue(value);
  };

  return {
    editingCell,
    editValue,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleEditValueChange
  };
};

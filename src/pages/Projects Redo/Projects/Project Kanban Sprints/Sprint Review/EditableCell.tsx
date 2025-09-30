import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Task, EditingCell } from './types';
import { supabase } from '../../../../../lib/supabase';

interface EditableCellProps {
  task: Task;
  field: string;
  value: string | number;
  displayValue?: React.ReactNode | string;
  editingCell: EditingCell | null;
  editValue: string;
  onEditStart: (taskId: string, field: string, currentValue: string | number) => void;
  onEditSave: (taskId: string, field: string) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  task,
  field,
  value,
  displayValue,
  editingCell,
  editValue,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditValueChange
}) => {
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string; email: string }>>([]);
  const isEditing = editingCell?.taskId === task.id && editingCell?.field === field;

  // Fetch users when the assignee field is being edited
  useEffect(() => {
    if (isEditing && field === 'assignee_id') {
      loadUsers();
    }
  }, [isEditing, field]);

  const loadUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Users')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  
  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        {field === 'priority' ? (
          <select
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: brandTheme.border.medium }}
          >
            <option value="">None</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        ) : field === 'status' ? (
          <select
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: brandTheme.border.medium }}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        ) : field === 'assignee_id' ? (
          <select
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            style={{ borderColor: brandTheme.border.medium }}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.includes('Hours') ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
            style={{ borderColor: brandTheme.border.medium }}
            min={field.includes('Hours') ? '0' : undefined}
            step={field.includes('Hours') ? '0.5' : undefined}
          />
        )}
        <button
          onClick={() => onEditSave(task.id, field)}
          className="p-1 hover:bg-green-100 rounded"
        >
          <Save className="w-3 h-3 text-green-600" />
        </button>
        <button
          onClick={onEditCancel}
          className="p-1 hover:bg-red-100 rounded"
        >
          <X className="w-3 h-3 text-red-600" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded group"
      onClick={() => onEditStart(task.id, field, value)}
    >
      <span className="text-xs">
        {displayValue || value || '-'}
      </span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default EditableCell;

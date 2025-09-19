import React from 'react';
import { User, AlertCircle } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Task, EditingCell } from './types';
import { getPriorityColor, getPriorityBgColor, getStatusColor, getStatusBgColor, formatStatusDisplay } from './utils';
import EditableCell from './EditableCell';

interface TaskTableProps {
  tasks: Task[];
  isCompleted?: boolean;
  isSelectionMode?: boolean;
  editingCell: EditingCell | null;
  editValue: string;
  onEditStart: (taskId: string, field: string, currentValue: string | number) => void;
  onEditSave: (taskId: string, field: string) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
  onTaskSelectionChange?: (taskId: string, isSelected: boolean) => void;
  onHoursPlannedClick?: (taskId: string, taskName: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isCompleted = false,
  isSelectionMode = false,
  editingCell,
  editValue,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditValueChange,
  onTaskSelectionChange,
  onHoursPlannedClick
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr 
            className="border-b-2"
            style={{ borderColor: brandTheme.primary.navy }}
          >
            {isSelectionMode && (
              <th 
                className="text-left py-3 px-4 font-semibold text-sm w-12"
                style={{ color: brandTheme.text.primary }}
              >
                
              </th>
            )}
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Task Name
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Hours Spent
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Hours Planned
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Priority
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Status
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Assignee
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr 
              key={task.id}
              className={`border-b hover:bg-gray-50 ${isCompleted ? 'opacity-75' : ''}`}
              style={{ borderColor: brandTheme.border.light }}
            >
              {isSelectionMode && (
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={task.isSelected || false}
                    onChange={(e) => onTaskSelectionChange?.(task.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
              )}
              <td className="py-3 px-4">
                <span 
                  className="font-medium text-sm"
                  style={{ color: isCompleted ? brandTheme.text.secondary : brandTheme.text.primary }}
                >
                  {task.name}
                </span>
              </td>
              <td className="py-3 px-4">
                <span 
                  className="text-xs" 
                  style={{ color: isCompleted ? brandTheme.text.muted : brandTheme.text.secondary }}
                >
                  {task.hoursSpent}h
                </span>
              </td>
              <td className="py-3 px-4">
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded group"
                  onClick={() => onHoursPlannedClick?.(task.id, task.name)}
                  title="Click to view/edit planned hours"
                >
                  <span className="text-xs font-medium text-blue-600">
                    {task.hoursPlanned}h
                  </span>
                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    (click to edit)
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                {task.priority ? (
                  <div className="flex items-center">
                    <EditableCell
                      task={task}
                      field="priority"
                      value={task.priority || ''}
                      displayValue={
                        <div className="flex items-center">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getPriorityBgColor(task.priority),
                              color: getPriorityColor(task.priority),
                            }}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {task.priority}
                          </span>
                        </div>
                      }
                      editingCell={editingCell}
                      editValue={editValue}
                      onEditStart={onEditStart}
                      onEditSave={onEditSave}
                      onEditCancel={onEditCancel}
                      onEditValueChange={onEditValueChange}
                    />
                  </div>
                ) : (
                  <EditableCell
                    task={task}
                    field="priority"
                    value=""
                    displayValue="No priority"
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditStart={onEditStart}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    onEditValueChange={onEditValueChange}
                  />
                )}
              </td>
              <td className="py-3 px-4">
                {task.status ? (
                  <div className="flex items-center">
                    <EditableCell
                      task={task}
                      field="status"
                      value={task.status || ''}
                      displayValue={
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getStatusBgColor(task.status),
                            color: getStatusColor(task.status),
                          }}
                        >
                          {formatStatusDisplay(task.status)}
                        </span>
                      }
                      editingCell={editingCell}
                      editValue={editValue}
                      onEditStart={onEditStart}
                      onEditSave={onEditSave}
                      onEditCancel={onEditCancel}
                      onEditValueChange={onEditValueChange}
                    />
                  </div>
                ) : (
                  <EditableCell
                    task={task}
                    field="status"
                    value=""
                    displayValue="No status"
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditStart={onEditStart}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    onEditValueChange={onEditValueChange}
                  />
                )}
              </td>
              <td className="py-3 px-4">
                <EditableCell
                  task={task}
                  field="assignee_id"
                  value={task.assignee_id || ''}
                  displayValue={
                    task.assigneeName ? (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" style={{ color: brandTheme.text.muted }} />
                        {task.assigneeName}
                      </div>
                    ) : 'Unassigned'
                  }
                  editingCell={editingCell}
                  editValue={editValue}
                  onEditStart={onEditStart}
                  onEditSave={onEditSave}
                  onEditCancel={onEditCancel}
                  onEditValueChange={onEditValueChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;

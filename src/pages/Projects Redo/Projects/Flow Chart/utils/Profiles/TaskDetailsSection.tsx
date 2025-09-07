import React, { useState } from 'react';
import { parseISO } from 'date-fns';
import { Pencil } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import Badge from '../../../../../../components/ui/Badge';
import UserAvatar from '../../../../../../components/UserAvatar';
import UserSelect from '../../../../../../components/UserSelect';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { useAppContext } from '../../../../../../context/AppContext';

interface TaskDetailsSectionProps {
  task: any;
  taskSubTasks: any[];
  onUpdateTask: (updatedTask: any) => Promise<void>;
}

const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({
  task,
  taskSubTasks,
  onUpdateTask
}) => {
  const { getUsers } = useAppContext();
  const users = getUsers();

  // State for editing various fields
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState<string>('');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [dateValues, setDateValues] = useState({
    startDate: '',
    endDate: '',
    deadline: ''
  });
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [assigneeValue, setAssigneeValue] = useState<string>('');
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Progress management functions
  const handleEditProgress = () => {
    setProgressValue(task.progress?.toString() || '0');
    setIsEditingProgress(true);
  };

  const handleCancelProgressEdit = () => {
    setIsEditingProgress(false);
    setProgressValue('');
  };

  const handleUpdateProgress = async () => {
    const numValue = parseInt(progressValue);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      alert('Progress must be a number between 0 and 100');
      return;
    }

    try {
      setIsUpdatingProgress(true);
      await onUpdateTask({
        ...task,
        progress: numValue
      });
      
      setIsEditingProgress(false);
      setProgressValue('');
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleProgressKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateProgress();
    } else if (e.key === 'Escape') {
      handleCancelProgressEdit();
    }
  };

  // Date management functions
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleEditDates = () => {
    setDateValues({
      startDate: formatDateForInput(task.startDate),
      endDate: formatDateForInput(task.endDate),
      deadline: formatDateForInput(task.deadline)
    });
    setIsEditingDates(true);
  };

  const handleCancelDatesEdit = () => {
    setIsEditingDates(false);
    setDateValues({
      startDate: '',
      endDate: '',
      deadline: ''
    });
  };

  const handleUpdateDates = async () => {
    try {
      setIsUpdatingDates(true);
      
      const updatedTask = {
        ...task,
        startDate: dateValues.startDate || null,
        endDate: dateValues.endDate || null,
        deadline: dateValues.deadline || null
      };

      await onUpdateTask(updatedTask);
      
      setIsEditingDates(false);
      setDateValues({
        startDate: '',
        endDate: '',
        deadline: ''
      });
    } catch (error) {
      console.error('Error updating dates:', error);
    } finally {
      setIsUpdatingDates(false);
    }
  };

  const handleDateChange = (field: string, value: string) => {
    setDateValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Assignee management functions
  const handleEditAssignee = () => {
    setAssigneeValue(task.assigneeId || '');
    setIsEditingAssignee(true);
  };

  const handleCancelAssigneeEdit = () => {
    setIsEditingAssignee(false);
    setAssigneeValue('');
  };

  const handleUpdateAssignee = async () => {
    try {
      setIsUpdatingAssignee(true);
      
      await onUpdateTask({
        ...task,
        assigneeId: assigneeValue || undefined
      });
      
      setIsEditingAssignee(false);
      setAssigneeValue('');
    } catch (error) {
      console.error('Error updating assignee:', error);
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Tag management functions
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setIsAddingTag(true);
      const currentTags = task.tags || [];
      const updatedTags = [...currentTags, newTag.trim()];
      
      await onUpdateTask({
        ...task,
        tags: updatedTags
      });
      
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const currentTags = task.tags || [];
      const updatedTags = currentTags.filter((tag: any) => tag !== tagToRemove);
      
      await onUpdateTask({
        ...task,
        tags: updatedTags
      });
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Assignee */}
      <div>
        {!isEditingAssignee ? (
          <div>
            <div 
              className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
              style={{ backgroundColor: brandTheme.primary.navy }}
            >
              <h3 
                className="text-sm font-medium"
                style={{ color: brandTheme.background.primary }}
              >
                Task Assignee
              </h3>
              <button
                onClick={handleEditAssignee}
                className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                title="Edit assignee"
                style={{ color: brandTheme.background.primary }}
              >
                <Pencil size={14} />
              </button>
            </div>
            <div className="px-3 flex justify-end items-center space-x-2">
              {task.assigneeId ? (
                (() => {
                  const assignee = users.find(user => user.id === task.assigneeId);
                  return assignee ? (
                    <div className="flex items-center">
                      <UserAvatar user={assignee} showName />
                    </div>
                  ) : (
                    <span 
                      className="text-sm"
                      style={{ color: brandTheme.text.muted }}
                    >
                      Assignee not found
                    </span>
                  );
                })()
              ) : (
                <span 
                  className="text-sm"
                  style={{ color: brandTheme.text.muted }}
                >
                  No assignee set
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="px-3 space-y-3">
            <UserSelect
              selectedUserId={assigneeValue}
              onChange={setAssigneeValue}
              users={users}
              placeholder="Select assignee"
              className="mb-0"
            />
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleUpdateAssignee}
                disabled={isUpdatingAssignee}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy
                }}
              >
                {isUpdatingAssignee ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCancelAssigneeEdit}
                disabled={isUpdatingAssignee}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy,
                  borderColor: brandTheme.primary.navy
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Start Date, End Date, and Deadline */}
      <div>
        {/* Connected Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center justify-between w-full">
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.background.primary }}
            >
              Start Date
            </h3>
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.background.primary }}
            >
              End Date
            </h3>
          </div>
          {!isEditingDates && (
            <button
              onClick={handleEditDates}
              className="ml-2 p-1 rounded-md hover:bg-blue-800 transition-colors"
              title="Edit dates"
              style={{ color: brandTheme.background.primary }}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        
        {/* Date Values */}
        <div className="flex justify-between px-3">
          <div className="flex-1">
            {!isEditingDates ? (
              <div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: brandTheme.text.primary }}
                >
                  {task.startDate ? parseISO(task.startDate).toLocaleDateString() : 'Not set'}
                </span>
                {task.startDate && (
                  <div 
                    className="text-xs italic mt-1"
                    style={{ color: '#9CA3AF' }}
                  >
                    {(() => {
                      const startDate = parseISO(task.startDate);
                      const today = new Date();
                      const diffTime = today.getTime() - startDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) return 'Started today';
                      if (diffDays === 1) return '1 day ago';
                      if (diffDays > 0) return `${diffDays} days ago`;
                      if (diffDays === -1) return 'Starts tomorrow';
                      return `Starts in ${Math.abs(diffDays)} days`;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="date"
                value={dateValues.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
                style={{
                  borderColor: brandTheme.border.light,
                  backgroundColor: brandTheme.background.secondary
                }}
                disabled={isUpdatingDates}
              />
            )}
          </div>
          
          {/* Total Days - Center */}
          {!isEditingDates && task.startDate && task.endDate && (
            <div className="flex-1 text-center">
              <div 
                className="text-xs italic"
                style={{ color: '#9CA3AF' }}
              >
                Total Days
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: brandTheme.text.primary }}
              >
                {(() => {
                  const startDate = parseISO(task.startDate);
                  const endDate = parseISO(task.endDate);
                  const diffTime = endDate.getTime() - startDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays === 1 ? '1 day' : `${diffDays} days`;
                })()}
              </div>
            </div>
          )}
          
          <div className="flex-1 text-right">
            {!isEditingDates ? (
              <div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: brandTheme.text.primary }}
                >
                  {task.endDate ? parseISO(task.endDate).toLocaleDateString() : 'Not set'}
                </span>
                {task.endDate && (
                  <div 
                    className="text-xs italic mt-1"
                    style={{ color: '#9CA3AF' }}
                  >
                    {(() => {
                      const endDate = parseISO(task.endDate);
                      const today = new Date();
                      const diffTime = endDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) return 'Due today';
                      if (diffDays === 1) return '1 day left';
                      if (diffDays > 0) return `${diffDays} days left`;
                      if (diffDays === -1) return '1 day overdue';
                      return `${Math.abs(diffDays)} days overdue`;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="date"
                value={dateValues.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
                style={{
                  borderColor: brandTheme.border.light,
                  backgroundColor: brandTheme.background.secondary
                }}
                disabled={isUpdatingDates}
              />
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div 
          className="px-3 py-2 mb-2 rounded-md text-center"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Deadline
          </h3>
        </div>
        <div className="px-3 text-center">
          {!isEditingDates ? (
            <span 
              className="text-sm font-medium"
              style={{ color: brandTheme.status.warning }}
            >
              {task.deadline ? parseISO(task.deadline).toLocaleDateString() : 'Not set'}
            </span>
          ) : (
            <input
              type="date"
              value={dateValues.deadline}
              onChange={(e) => handleDateChange('deadline', e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
              style={{
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.secondary
              }}
              disabled={isUpdatingDates}
            />
          )}
          
          {isEditingDates && (
            <div className="flex space-x-2 pt-2 justify-center">
              <Button 
                size="sm" 
                onClick={handleUpdateDates}
                disabled={isUpdatingDates}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy
                }}
              >
                {isUpdatingDates ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCancelDatesEdit}
                disabled={isUpdatingDates}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy,
                  borderColor: brandTheme.primary.navy
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Task Progress */}
      <div className="mt-4">
        <div 
          className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Task Progress
          </h3>
          {!isEditingProgress && (
            <button
              onClick={handleEditProgress}
              className="p-1 rounded-md hover:bg-blue-800 transition-colors"
              title="Edit progress"
              style={{ color: brandTheme.background.primary }}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        
        <div className="px-3">
          {!isEditingProgress ? (
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div 
                  className="w-full bg-gray-200 rounded-full h-2"
                  style={{ backgroundColor: brandTheme.background.secondary }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${task.progress || 0}%`,
                      backgroundColor: task.progress === 100 
                        ? brandTheme.status.success 
                        : brandTheme.status.info
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: brandTheme.text.muted }}>0%</span>
                  <span 
                    className="font-medium"
                    style={{ color: brandTheme.text.primary }}
                  >
                    {task.progress || 0}%
                  </span>
                  <span style={{ color: brandTheme.text.muted }}>100%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                onKeyPress={handleProgressKeyPress}
                placeholder="0-100"
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
                style={{
                  borderColor: brandTheme.border.light,
                  backgroundColor: brandTheme.background.secondary
                }}
                disabled={isUpdatingProgress}
              />
              <span 
                className="text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                %
              </span>
              <Button 
                size="sm" 
                onClick={handleUpdateProgress}
                disabled={isUpdatingProgress}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy
                }}
              >
                {isUpdatingProgress ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCancelProgressEdit}
                disabled={isUpdatingProgress}
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy,
                  borderColor: brandTheme.primary.navy
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {typeof task.progress !== 'number' && (
          <p 
            className="text-xs mt-2"
            style={{ color: brandTheme.text.muted }}
          >
            No progress set. Click Edit to add progress tracking.
          </p>
        )}
      </div>

      {/* Task Tags */}
      <div className="mt-4">
        <div 
          className="px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Task Tags
          </h3>
        </div>
        
        <div className="px-3">
          {/* Existing Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
            {task.tags.map((tag: any, index: number) => (
              <div
                key={index}
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleRemoveTag(tag)}
                title="Click to remove tag"
              >
                <Badge 
                  variant="secondary" 
                >
                  {tag} ×
                </Badge>
              </div>
            ))}
            </div>
          )}
          
          {/* Add New Tag */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag..."
              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
              style={{
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.secondary
              }}
              disabled={isAddingTag}
            />
            <Button 
              size="sm" 
              onClick={handleAddTag}
              disabled={!newTag.trim() || isAddingTag}
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy
              }}
            >
              {isAddingTag ? 'Adding...' : 'Add'}
            </Button>
          </div>
          
          {(!task.tags || task.tags.length === 0) && (
            <p 
              className="text-xs mt-2"
              style={{ color: brandTheme.text.muted }}
            >
              No tags yet. Add tags to categorize and organize your task.
            </p>
          )}
        </div>
      </div>

      {/* Subtasks Summary */}
      <div className="mt-4">
        <div 
          className="px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Subtasks Summary
          </h3>
        </div>
        <div className="px-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: brandTheme.text.muted }}>Total Subtasks:</span>
            <span 
              className="font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {taskSubTasks.length}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span style={{ color: brandTheme.text.muted }}>Completed:</span>
            <span 
              className="font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {taskSubTasks.filter(subtask => subtask.status === 'done').length}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span style={{ color: brandTheme.text.muted }}>In Progress:</span>
            <span 
              className="font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {taskSubTasks.filter(subtask => subtask.status === 'in-progress').length}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span style={{ color: brandTheme.text.muted }}>To Do:</span>
            <span 
              className="font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {taskSubTasks.filter(subtask => subtask.status === 'todo').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsSection;

import React, { useState } from 'react';
import Button from '../../../../../../components/ui/Button';
import Badge from '../../../../../../components/ui/Badge';
import UserAvatar from '../../../../../../components/UserAvatar';
import UserSelect from '../../../../../../components/UserSelect';
import MultiUserSelect from '../../../../../../components/ui/MultiUserSelect';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { useAppContext } from '../../../../../../context/AppContext';

interface ProjectDetailsSectionProps {
  project: any;
  onUpdateProject: (updatedProject: any) => Promise<void>;
}

const ProjectDetailsSection: React.FC<ProjectDetailsSectionProps> = ({
  project,
  onUpdateProject
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
  const [isEditingMultiAssignees, setIsEditingMultiAssignees] = useState(false);
  const [multiAssigneeValues, setMultiAssigneeValues] = useState<string[]>([]);
  const [isUpdatingMultiAssignees, setIsUpdatingMultiAssignees] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Progress management functions
  const handleEditProgress = () => {
    setProgressValue(project.progress?.toString() || '0');
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
      await onUpdateProject({
        ...project,
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
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleEditDates = () => {
    setDateValues({
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      deadline: formatDateForInput(project.deadline)
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
      
      const updatedProject = {
        ...project,
        startDate: dateValues.startDate || undefined,
        endDate: dateValues.endDate || undefined,
        deadline: dateValues.deadline || undefined
      };

      await onUpdateProject(updatedProject);
      
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
    setAssigneeValue(project.assigneeId || '');
    setIsEditingAssignee(true);
  };

  const handleCancelAssigneeEdit = () => {
    setIsEditingAssignee(false);
    setAssigneeValue('');
  };

  const handleUpdateAssignee = async () => {
    try {
      setIsUpdatingAssignee(true);
      
      await onUpdateProject({
        ...project,
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

  // Multi-assignee management functions
  const handleEditMultiAssignees = () => {
    setMultiAssigneeValues(project.multiAssigneeIds || []);
    setIsEditingMultiAssignees(true);
  };

  const handleCancelMultiAssigneesEdit = () => {
    setIsEditingMultiAssignees(false);
    setMultiAssigneeValues([]);
  };

  const handleUpdateMultiAssignees = async () => {
    try {
      setIsUpdatingMultiAssignees(true);
      
      await onUpdateProject({
        ...project,
        multiAssigneeIds: multiAssigneeValues
      });
      
      setIsEditingMultiAssignees(false);
      setMultiAssigneeValues([]);
    } catch (error) {
      console.error('Error updating multi-assignees:', error);
    } finally {
      setIsUpdatingMultiAssignees(false);
    }
  };

  // Tag management functions
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setIsAddingTag(true);
      const currentTags = project.tags || [];
      const updatedTags = [...currentTags, newTag.trim()];
      
      await onUpdateProject({
        ...project,
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
      const currentTags = project.tags || [];
      const updatedTags = currentTags.filter((tag: any) => tag !== tagToRemove);
      
      await onUpdateProject({
        ...project,
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

  // Get project tasks for summary
  const projectTasks = project.tasks || [];

  return (
    <div className="space-y-6">
      {/* Project Assignee and Additional Assignees */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              Project Assignee
            </h3>
            {!isEditingAssignee && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleEditAssignee}
              >
                Edit
              </Button>
            )}
          </div>

          {!isEditingAssignee ? (
            <div className="flex items-center space-x-2">
              {project.assigneeId ? (
                (() => {
                  const assignee = users.find(user => user.id === project.assigneeId);
                  return assignee ? (
                    <div className="flex items-center p-2 hover:bg-blue-50 rounded-md">
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
          ) : (
            <div className="space-y-3">
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
                >
                  {isUpdatingAssignee ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancelAssigneeEdit}
                  disabled={isUpdatingAssignee}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              Additional Assignees
            </h3>
            {!isEditingMultiAssignees && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleEditMultiAssignees}
              >
                Edit
              </Button>
            )}
          </div>

          {!isEditingMultiAssignees ? (
            <div className="space-y-2">
              {project.multiAssigneeIds && project.multiAssigneeIds.length > 0 ? (
                <div className="space-y-2">
                  {project.multiAssigneeIds.map((userId: any) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="flex items-center p-2 hover:bg-blue-50 rounded-md">
                        <UserAvatar user={user} showName />
                      </div>
                    ) : (
                      <span 
                        key={userId}
                        className="text-sm"
                        style={{ color: brandTheme.text.muted }}
                      >
                        User not found
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span 
                  className="text-sm"
                  style={{ color: brandTheme.text.muted }}
                >
                  No additional assignees
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <MultiUserSelect
                selectedUserIds={multiAssigneeValues}
                onChange={setMultiAssigneeValues}
                users={users.filter(user => user.department === 'Product Development')}
                placeholder="Select additional assignees"
                className="mb-0"
              />
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleUpdateMultiAssignees}
                  disabled={isUpdatingMultiAssignees}
                >
                  {isUpdatingMultiAssignees ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancelMultiAssigneesEdit}
                  disabled={isUpdatingMultiAssignees}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Date, End Date, and Deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              Start Date
            </h3>
            {!isEditingDates && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleEditDates}
              >
                Edit
              </Button>
            )}
          </div>
          {!isEditingDates ? (
            <span 
              className="text-sm font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
            </span>
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
        
        <div>
          <h3 
            className="text-sm font-medium mb-2"
            style={{ color: brandTheme.text.primary }}
          >
            End Date
          </h3>
          {!isEditingDates ? (
            <span 
              className="text-sm font-medium"
              style={{ color: brandTheme.text.primary }}
            >
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
            </span>
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
      
      <div className="text-center">
        <h3 
          className="text-sm font-medium mb-2"
          style={{ color: brandTheme.text.primary }}
        >
          Deadline
        </h3>
        {!isEditingDates ? (
          <span 
            className="text-sm font-medium"
            style={{ color: brandTheme.status.warning }}
          >
            {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
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
            >
              {isUpdatingDates ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCancelDatesEdit}
              disabled={isUpdatingDates}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Project Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            Project Progress
          </h3>
          {!isEditingProgress && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleEditProgress}
            >
              Edit
            </Button>
          )}
        </div>
        
        <div className="flex-1">
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
                      width: `${project.progress || 0}%`,
                      backgroundColor: project.progress === 100 
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
                    {project.progress || 0}%
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
              >
                {isUpdatingProgress ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCancelProgressEdit}
                disabled={isUpdatingProgress}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {typeof project.progress !== 'number' && (
          <p 
            className="text-xs mt-2"
            style={{ color: brandTheme.text.muted }}
          >
            No progress set. Click Edit to add progress tracking.
          </p>
        )}
      </div>

      {/* Project Tags */}
      <div className="mt-4">
        <h3 
          className="text-sm font-medium mb-2"
          style={{ color: brandTheme.text.primary }}
        >
          Project Tags
        </h3>
        
        {/* Existing Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {project.tags.map((tag: any, index: number) => (
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
          >
            {isAddingTag ? 'Adding...' : 'Add'}
          </Button>
        </div>
        
        {(!project.tags || project.tags.length === 0) && (
          <p 
            className="text-xs mt-2"
            style={{ color: brandTheme.text.muted }}
          >
            No tags yet. Add tags to categorize and organize your project.
          </p>
        )}
      </div>

      {/* Tasks Summary */}
      <div className="mt-4">
        <h3 
          className="text-sm font-medium mb-2"
          style={{ color: brandTheme.text.primary }}
        >
          Tasks Summary
        </h3>
        <div className="flex justify-between text-sm">
          <span style={{ color: brandTheme.text.muted }}>Total Tasks:</span>
          <span 
            className="font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            {projectTasks.length}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span style={{ color: brandTheme.text.muted }}>Completed:</span>
          <span 
            className="font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            {projectTasks.filter((task: any) => task.status === 'done').length}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span style={{ color: brandTheme.text.muted }}>In Progress:</span>
          <span 
            className="font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            {projectTasks.filter((task: any) => task.status === 'in-progress').length}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span style={{ color: brandTheme.text.muted }}>To Do:</span>
          <span 
            className="font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            {projectTasks.filter((task: any) => task.status === 'todo').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsSection;

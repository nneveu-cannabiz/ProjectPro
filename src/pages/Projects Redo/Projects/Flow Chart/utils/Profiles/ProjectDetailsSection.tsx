import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
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
      // Handle different date formats that might come from the database
      let date: Date;
      
      // If it's already in YYYY-MM-DD format, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
      } else {
        // Parse other formats
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '';
      }
      
      // Return in YYYY-MM-DD format for HTML date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`formatDateForInput: "${dateString}" -> "${formattedDate}"`);
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date for input:', dateString, error);
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
      
      // Process date values - convert empty strings to null, keep valid dates
      const processedStartDate = dateValues.startDate.trim() || null;
      const processedEndDate = dateValues.endDate.trim() || null;
      const processedDeadline = dateValues.deadline.trim() || null;
      
      console.log('=== DATE UPDATE DEBUG ===');
      console.log('Raw dateValues:', dateValues);
      console.log('Processed dates:', {
        startDate: processedStartDate,
        endDate: processedEndDate,
        deadline: processedDeadline
      });
      console.log('Original project dates:', {
        startDate: project.startDate,
        endDate: project.endDate,
        deadline: project.deadline
      });
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (processedStartDate && !dateRegex.test(processedStartDate)) {
        alert(`Invalid start date format. Expected YYYY-MM-DD, got: ${processedStartDate}`);
        return;
      }
      if (processedEndDate && !dateRegex.test(processedEndDate)) {
        alert(`Invalid end date format. Expected YYYY-MM-DD, got: ${processedEndDate}`);
        return;
      }
      if (processedDeadline && !dateRegex.test(processedDeadline)) {
        alert(`Invalid deadline format. Expected YYYY-MM-DD, got: ${processedDeadline}`);
        return;
      }
      
      // Additional validation - check if dates can be parsed
      if (processedStartDate && !isValidDate(processedStartDate)) {
        alert(`Start date cannot be parsed: ${processedStartDate}`);
        return;
      }
      if (processedEndDate && !isValidDate(processedEndDate)) {
        alert(`End date cannot be parsed: ${processedEndDate}`);
        return;
      }
      if (processedDeadline && !isValidDate(processedDeadline)) {
        alert(`Deadline cannot be parsed: ${processedDeadline}`);
        return;
      }
      
      const updatedProject = {
        ...project,
        startDate: processedStartDate,
        endDate: processedEndDate,
        deadline: processedDeadline
      };

      console.log('Final project object for save:', JSON.stringify(updatedProject, null, 2));
      console.log('About to call onUpdateProject...');
      
      await onUpdateProject(updatedProject);
      console.log('✅ Project dates saved successfully');
      
      setIsEditingDates(false);
      setDateValues({
        startDate: '',
        endDate: '',
        deadline: ''
      });
    } catch (error) {
      console.error('❌ Error updating dates:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      alert(`Failed to update dates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingDates(false);
    }
  };

  // Helper function to validate date format
  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
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

  // Function to add specific tags
  const handleAddSpecificTag = async (tagToAdd: string) => {
    try {
      setIsAddingTag(true);
      const currentTags = project.tags || [];
      
      // Check if tag already exists
      if (currentTags.includes(tagToAdd)) {
        return; // Tag already exists, no need to add
      }
      
      const updatedTags = [...currentTags, tagToAdd];
      
      await onUpdateProject({
        ...project,
        tags: updatedTags
      });
    } catch (error) {
      console.error('Error adding specific tag:', error);
    } finally {
      setIsAddingTag(false);
    }
  };

  // Get project tasks for summary
  const projectTasks = project.tasks || [];

  return (
    <div className="space-y-6">
      {/* Project Assignee and Additional Assignees */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div 
            className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.background.primary }}
            >
              Project Assignee
            </h3>
            {!isEditingAssignee && (
              <button
                onClick={handleEditAssignee}
                className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                title="Edit assignee"
                style={{ color: brandTheme.background.primary }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {!isEditingAssignee ? (
            <div className="px-3 flex justify-end items-center space-x-2">
              {project.assigneeId ? (
                (() => {
                  const assignee = users.find(user => user.id === project.assigneeId);
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
        
        <div>
          <div 
            className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h3 
              className="text-sm font-medium"
              style={{ color: brandTheme.background.primary }}
            >
              Additional Assignees
            </h3>
            {!isEditingMultiAssignees && (
              <button
                onClick={handleEditMultiAssignees}
                className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                title="Edit additional assignees"
                style={{ color: brandTheme.background.primary }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {!isEditingMultiAssignees ? (
            <div className="px-3 space-y-2">
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
            <div className="px-3 space-y-3">
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
                  style={{
                    backgroundColor: brandTheme.primary.lightBlue,
                    color: brandTheme.primary.navy
                  }}
                >
                  {isUpdatingMultiAssignees ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancelMultiAssigneesEdit}
                  disabled={isUpdatingMultiAssignees}
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
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                </span>
                {project.startDate && (
                  <div 
                    className="text-xs italic mt-1"
                    style={{ color: '#9CA3AF' }}
                  >
                    {(() => {
                      const startDate = new Date(project.startDate);
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
                title="Select any date - no restrictions"
              />
            )}
          </div>
          
          {/* Total Days - Center */}
          {!isEditingDates && project.startDate && project.endDate && (
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
                  const startDate = new Date(project.startDate);
                  const endDate = new Date(project.endDate);
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
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                </span>
                {project.endDate && (
                  <div 
                    className="text-xs italic mt-1"
                    style={{ color: '#9CA3AF' }}
                  >
                    {(() => {
                      const endDate = new Date(project.endDate);
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
                title="Select any date - no restrictions"
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
              title="Select any date - no restrictions"
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

      {/* Project Progress */}
      <div className="mt-4">
        <div 
          className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Project Progress
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
        <div 
          className="px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Project Tags
          </h3>
        </div>
        
        <div className="px-3">
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
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy
              }}
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
      </div>

      {/* Tasks Summary */}
      <div className="mt-4">
        <div 
          className="px-3 py-2 mb-2 rounded-md"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 
            className="text-sm font-medium"
            style={{ color: brandTheme.background.primary }}
          >
            Tasks Summary
          </h3>
        </div>
        <div className="px-3">
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

      {/* Quick Tag Actions */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: brandTheme.border.light }}>
        <h3 
          className="text-sm font-medium mb-3"
          style={{ color: brandTheme.text.primary }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddSpecificTag('Ready to Assign')}
            disabled={isAddingTag || (project.tags && project.tags.includes('Ready to Assign'))}
            className="justify-start"
            style={{
              backgroundColor: brandTheme.primary.lightBlue,
              color: brandTheme.primary.navy,
              borderColor: brandTheme.primary.navy
            }}
          >
            {project.tags && project.tags.includes('Ready to Assign') ? '✓ Ready to Assign' : 'Mark as Ready to Assign'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddSpecificTag('Need to Review')}
            disabled={isAddingTag || (project.tags && project.tags.includes('Need to Review'))}
            className="justify-start"
            style={{
              backgroundColor: brandTheme.primary.lightBlue,
              color: brandTheme.primary.navy,
              borderColor: brandTheme.primary.navy
            }}
          >
            {project.tags && project.tags.includes('Need to Review') ? '✓ Need to Review' : 'Mark as Need to Review'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddSpecificTag('IDS')}
            disabled={isAddingTag || (project.tags && project.tags.includes('IDS'))}
            className="justify-start"
            style={{
              backgroundColor: brandTheme.primary.lightBlue,
              color: brandTheme.primary.navy,
              borderColor: brandTheme.primary.navy
            }}
          >
            {project.tags && project.tags.includes('IDS') ? '✓ IDS' : 'Mark as IDS'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsSection;

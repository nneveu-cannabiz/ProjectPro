import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Users, MessageSquare, X, Tag } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/Card';
import Badge from '../../../../../components/ui/Badge';
import Modal from '../../../../../components/ui/Modal';
import ProjectForm from '../../../../../components/Project/ProjectForm';
import TaskForm from '../../../../../components/Task/TaskForm';
import CollapsibleTaskItem from '../../../../../components/Task/CollapsibleTaskItem';
import UserAvatar from '../../../../../components/UserAvatar';
import { useAppContext } from '../../../../../context/AppContext';
import UpdatesList from '../../../../../components/Update/UpdatesList';
import UpdateForm from '../../../../../components/Update/UpdateForm';
import UpdatesModal from '../../../../../components/Update/UpdatesModal';
import DropdownMenu from '../../../../../components/ui/DropdownMenu';
import UserSelect from '../../../../../components/UserSelect';
import { brandTheme } from '../../../../../styles/brandTheme';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  projectId
}) => {
  const { 
    projects, 
    tasks, 
    deleteProject, 
    updateProject,
    deleteTask, 
    subTasks, 
    getUsers,
    getUpdatesForEntity,
    getRelatedUpdates
  } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
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
  
  const project = projects.find((p) => p.id === projectId);
  
  if (!project) {
    return null;
  }
  
  // Get tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  
  // Get updates for this project
  const directUpdates = getUpdatesForEntity('project', projectId);
  const allRelatedUpdates = getRelatedUpdates('project', projectId);
  
  const handleDeleteProject = () => {
    deleteProject(projectId);
    onClose();
  };
  
  const handleEditTask = (task: any) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleAddTask = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(true);
  };
  
  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setCurrentTask(null);
  };
  
  const handleOpenUpdatesModal = () => {
    setIsUpdatesModalOpen(true);
  };
  
  // Get unique assignees for the project (from tasks and subtasks)
  const users = getUsers();
  
  const getUniqueAssignees = () => {
    const assigneeIds = new Set<string>();
    
    // Add project assignee
    if (project.assigneeId) assigneeIds.add(project.assigneeId);
    
    // Add task assignees
    projectTasks.forEach(task => {
      if (task.assigneeId) assigneeIds.add(task.assigneeId);
    });
    
    // Add subtask assignees
    const projectSubtasks = subTasks.filter(st => 
      projectTasks.some(t => t.id === st.taskId)
    );
    
    projectSubtasks.forEach(subtask => {
      if (subtask.assigneeId) assigneeIds.add(subtask.assigneeId);
    });
    
    // Get user objects
    return Array.from(assigneeIds)
      .map(id => users.find(user => user.id === id))
      .filter(Boolean);
  };
  
  const projectAssignees = getUniqueAssignees();
  
  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get project type badge variant
  const getProjectTypeVariant = (type: string) => {
    switch (type) {
      case 'Active':
        return 'success';
      case 'Upcoming':
        return 'primary';
      case 'Future':
        return 'secondary';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Dropdown menu items for project actions
  const projectMenuItems = [
    {
      label: 'View Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Project',
      icon: <Edit size={18} />,
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'Delete Project',
      icon: <Trash2 size={18} />,
      onClick: () => setIsDeleteModalOpen(true),
      className: 'text-red-500'
    }
  ];

  // Tag management functions
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setIsAddingTag(true);
      const currentTags = project.tags || [];
      const updatedTags = [...currentTags, newTag.trim()];
      
      await updateProject({
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
      const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
      
      await updateProject({
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
      await updateProject({
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

      await updateProject(updatedProject);
      
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
      
      await updateProject({
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

  return (
    <>
      {/* Main Project Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-6xl"
            style={{ 
              minHeight: '600px',
              borderColor: brandTheme.border.light 
            }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: brandTheme.border.light }}
            >
              <div className="flex-1">
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: brandTheme.text.primary }}
                >
                  {project.name} - Project
                </h1>
                <div className="flex items-center mt-2">
                  <Badge variant={getProjectTypeVariant(project.projectType)} className="mr-2">
                    {project.projectType}
                  </Badge>
                  <Badge variant="primary" className="mr-2">{project.category}</Badge>
                  <Badge variant={getStatusVariant(project.status)} className="mr-2">
                    {getStatusText(project.status)}
                  </Badge>
                  <span 
                    className="text-sm mr-4"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  {project.deadline && (
                    <span 
                      className="text-sm font-medium"
                      style={{ color: brandTheme.status.warning }}
                    >
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {typeof project.progress === 'number' && (
                    <span 
                      className="text-sm font-medium ml-4"
                      style={{ color: brandTheme.status.info }}
                    >
                      Progress: {project.progress}%
                    </span>
                  )}
                </div>
                
                {/* Tags Section */}
                {(project.tags && project.tags.length > 0) && (
                  <div className="flex items-center mt-2 flex-wrap">
                    <Tag size={16} className="mr-2" style={{ color: brandTheme.text.muted }} />
                    {project.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="cursor-pointer hover:opacity-80 mr-2 mb-1"
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
              </div>
              
              <div className="flex items-center space-x-2">
                <DropdownMenu items={projectMenuItems} />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 120px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <p 
                        style={{ color: brandTheme.text.secondary }}
                      >
                        {project.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Tasks
                    </h2>
                    <Button onClick={handleAddTask} size="sm">
                      <PlusCircle size={16} className="mr-1" />
                      Add Task
                    </Button>
                  </div>
                  
                  {projectTasks.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      {projectTasks.map((task) => (
                        <CollapsibleTaskItem
                          key={task.id}
                          task={task}
                          projectId={projectId}
                          onEditTask={handleEditTask}
                          onDeleteTask={deleteTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="text-center py-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: brandTheme.background.primary }}
                    >
                      <p style={{ color: brandTheme.text.muted }}>No tasks created yet.</p>
                      <Button 
                        className="mt-4" 
                        onClick={handleAddTask}
                        size="sm"
                      >
                        Add Your First Task
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users size={18} className="mr-2" />
                        Project Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {projectAssignees.length > 0 ? (
                        <div className="space-y-3">
                          {projectAssignees.map((user) => (
                            <div key={user!.id} className="flex items-center p-2 hover:bg-blue-50 rounded-md">
                              <UserAvatar user={user!} showName />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p 
                          className="text-sm"
                          style={{ color: brandTheme.text.muted }}
                        >
                          No team members assigned yet.
                        </p>
                      )}
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 
                            className="text-sm font-medium"
                            style={{ color: brandTheme.text.primary }}
                          >
                            Project Dates
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
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span style={{ color: brandTheme.text.muted }}>Start Date:</span>
                              <span 
                                className="font-medium"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: brandTheme.text.muted }}>End Date:</span>
                              <span 
                                className="font-medium"
                                style={{ color: brandTheme.text.primary }}
                              >
                                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: brandTheme.text.muted }}>Deadline:</span>
                              <span 
                                className="font-medium"
                                style={{ color: brandTheme.status.warning }}
                              >
                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.primary }}
                              >
                                Start Date
                              </label>
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
                            </div>
                            
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.primary }}
                              >
                                End Date
                              </label>
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
                            </div>
                            
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.primary }}
                              >
                                Deadline
                              </label>
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
                            </div>
                            
                            <div className="flex space-x-2 pt-2">
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
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
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
                      
                      <div className="mt-4">
                        <h3 
                          className="text-sm font-medium mb-2"
                          style={{ color: brandTheme.text.primary }}
                        >
                          Project Progress
                        </h3>
                        
                        <div className="flex items-center justify-between">
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
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={handleEditProgress}
                                >
                                  Edit
                                </Button>
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
                            {project.tags.map((tag, index) => (
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
                            {projectTasks.filter(task => task.status === 'done').length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span style={{ color: brandTheme.text.muted }}>In Progress:</span>
                          <span 
                            className="font-medium"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {projectTasks.filter(task => task.status === 'in-progress').length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span style={{ color: brandTheme.text.muted }}>To Do:</span>
                          <span 
                            className="font-medium"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {projectTasks.filter(task => task.status === 'todo').length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare size={18} className="mr-2" />
                        Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {directUpdates.length > 0 ? (
                        <div className="mb-6">
                          <UpdatesList updates={directUpdates.slice(0, 3)} />
                          {directUpdates.length > 3 && (
                            <div className="mt-3 text-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleOpenUpdatesModal}
                              >
                                View All Updates
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p 
                          className="text-center py-4 mb-6"
                          style={{ color: brandTheme.text.muted }}
                        >
                          No updates yet
                        </p>
                      )}
                      
                      <div 
                        className="border-t pt-4"
                        style={{ borderColor: brandTheme.border.light }}
                      >
                        <h4 
                          className="text-sm font-medium mb-2"
                          style={{ color: brandTheme.text.primary }}
                        >
                          Add Update to Project
                        </h4>
                        <UpdateForm entityType="project" entityId={projectId} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
      >
        <ProjectForm 
          project={project} 
          onSubmit={() => setIsEditModalOpen(false)} 
        />
      </Modal>
      
      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleTaskModalClose}
        title={currentTask ? "Edit Task" : "Add New Task"}
      >
        <TaskForm 
          projectId={projectId} 
          task={currentTask}
          onSubmit={handleTaskModalClose} 
        />
      </Modal>
      
      {/* Delete Project Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
      >
        <div>
          <p className="mb-6">Are you sure you want to delete this project? This action cannot be undone and will also delete all tasks associated with this project.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} size="sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProject} size="sm">
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Updates Modal */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="project"
        entityId={projectId}
        entityName={project.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </>
  );
};

export default ProjectDetailsModal;
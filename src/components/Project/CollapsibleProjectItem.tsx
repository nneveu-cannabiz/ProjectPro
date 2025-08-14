import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlusCircle, MoreVertical, Edit, Trash2, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import DropdownMenu from '../ui/DropdownMenu';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import CollapsibleTaskRow from '../Task/CollapsibleTaskRow';
import Modal from '../ui/Modal';
import ProjectForm from '../Project/ProjectForm';
import UpdatesModal from '../Update/UpdatesModal';
import UserAvatar from '../UserAvatar';
import TaskForm from '../Task/TaskForm';
import { brandTheme } from '../../styles/brandTheme';

interface CollapsibleProjectItemProps {
  project: Project;
}

const CollapsibleProjectItem: React.FC<CollapsibleProjectItemProps> = ({ project }) => {
  const navigate = useNavigate();
  const { tasks, subTasks, getUsers, getUpdatesForEntity, getRelatedUpdates, deleteProject } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // Get tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const completedTasks = projectTasks.filter((task) => task.status === 'done').length;
  const totalTasks = projectTasks.length;
  
  // Get updates for this project
  const directUpdates = getUpdatesForEntity('project', project.id);
  const allRelatedUpdates = getRelatedUpdates('project', project.id);
  
  // Get all users involved in this project (from project, tasks and subtasks)
  const getProjectTeam = () => {
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
    const users = getUsers();
    return Array.from(assigneeIds)
      .map(id => users.find(user => user.id === id))
      .filter(user => user !== undefined);
  };
  
  const projectTeam = getProjectTeam();
  
  // Toggle expansion
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Navigate to project details
  const handleViewProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}`);
  };
  
  // Open edit project modal
  const handleEditProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };
  
  // Open delete project confirmation modal
  const handleOpenDeleteModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  // Open updates modal
  const handleOpenUpdatesModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatesModalOpen(true);
  };
  
  // Open add task modal
  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddTaskModalOpen(true);
  };
  
  // Handle project deletion
  const handleDeleteProject = () => {
    deleteProject(project.id);
    setIsDeleteModalOpen(false);
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
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Menu items for project actions
  const menuItems = [
    {
      label: 'View Project Details',
      icon: <ChevronRight size={16} />,
      onClick: handleViewProject
    },
    {
      label: 'View/Add Updates',
      icon: <MessageSquare size={16} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Project',
      icon: <Edit size={16} />,
      onClick: handleEditProject
    },
    {
      label: 'Add New Task',
      icon: <PlusCircle size={16} />,
      onClick: handleAddTask
    },
    {
      label: 'Delete Project',
      icon: <Trash2 size={16} />,
      onClick: handleOpenDeleteModal,
      className: 'text-red-500'
    }
  ];
  
  return (
    <div style={{ borderColor: brandTheme.border.light }} className="border-b last:border-b-0">
      {/* Project Row */}
      <div 
        className="flex items-center px-4 py-3 cursor-pointer transition-colors"
        style={{
          backgroundColor: brandTheme.primary.paleBlue,
          '--tw-hover-bg-opacity': '0.8'
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = brandTheme.table.row.backgroundHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue;
        }}
        onClick={handleToggleExpand}
      >
        <button style={{ color: brandTheme.text.secondary }} className="mr-3">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="text-md font-medium" style={{ color: brandTheme.text.primary }}>{project.name}</div>
          <div className="flex items-center mt-1 space-x-2">
            <Badge variant={getProjectTypeVariant(project.projectType)}>
              {project.projectType}
            </Badge>
          </div>
          {!isExpanded && (
            <div className="text-sm truncate mt-0.5" style={{ color: brandTheme.text.muted }}>{project.description}</div>
          )}
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <Badge variant="primary" className="whitespace-nowrap">
            {project.category}
          </Badge>
          
          <Badge variant={getStatusVariant(project.status)}>
            {getStatusText(project.status)}
          </Badge>
          
          <span className="text-sm whitespace-nowrap ml-3" style={{ color: brandTheme.text.muted }}>
            {completedTasks}/{totalTasks} tasks
          </span>
          
          {projectTeam.length > 0 && (
            <div className="flex -space-x-2 ml-2">
              {projectTeam.slice(0, 5).map((user, index) => (
                <div key={user!.id} className="relative" style={{ zIndex: 50 - index }}>
                  <UserAvatar user={user!} size="sm" />
                </div>
              ))}
              {projectTeam.length > 5 && (
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium z-0" style={{ backgroundColor: brandTheme.gray[200] }}>
                  +{projectTeam.length - 5}
                </div>
              )}
            </div>
          )}
          
          {directUpdates.length > 0 && (
            <button 
              onClick={handleOpenUpdatesModal}
              className="text-sm flex items-center"
              style={{ color: brandTheme.primary.navy }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = brandTheme.interactive.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = brandTheme.primary.navy;
              }}
            >
              <MessageSquare size={16} className="mr-1" />
              {directUpdates.length}
            </button>
          )}
          
          <DropdownMenu items={menuItems} />
        </div>
      </div>
      
      {/* Expanded Content - Project Details and Tasks */}
      {isExpanded && (
        <div style={{ 
          backgroundColor: brandTheme.background.secondary,
          borderColor: brandTheme.border.light
        }} className="px-6 py-3 border-t">
          {/* Project Description */}
          {project.description && (
            <div className="mb-4 pb-3 border-b" style={{ borderColor: brandTheme.border.light }}>
              <div className="text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>Description:</div>
              <p className="text-sm" style={{ color: brandTheme.text.muted }}>{project.description}</p>
            </div>
          )}
          
          {/* Project Info - Horizontal Row */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: brandTheme.border.light }}>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>Created</div>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>Last Updated</div>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>{formatDate(project.updatedAt)}</p>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>Updates</div>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>{allRelatedUpdates.length || 'None'}</p>
              </div>
            </div>
          </div>
          
          {/* Tasks Section */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>Tasks</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAddTask}
              >
                <PlusCircle size={14} className="mr-1" />
                Add Task
              </Button>
            </div>
            
            {projectTasks.length > 0 ? (
              <div style={{ 
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.primary
              }} className="border rounded-md">
                {projectTasks.map(task => (
                  <CollapsibleTaskRow 
                    key={task.id} 
                    task={task} 
                    projectId={project.id}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light
              }} className="text-center py-6 rounded-lg border">
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>No tasks created for this project yet.</p>
              </div>
            )}
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
      
      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm 
          projectId={project.id} 
          onSubmit={() => setIsAddTaskModalOpen(false)} 
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
        entityId={project.id}
        entityName={project.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </div>
  );
};

export default CollapsibleProjectItem;
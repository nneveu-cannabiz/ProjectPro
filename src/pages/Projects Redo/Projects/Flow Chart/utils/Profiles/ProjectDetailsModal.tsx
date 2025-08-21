import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, MessageSquare, X, Tag } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { Card, CardContent } from '../../../../../../components/ui/Card';
import Badge from '../../../../../../components/ui/Badge';
import Modal from '../../../../../../components/ui/Modal';
import ProjectForm from '../../../../../../components/Project/ProjectForm';
import TaskForm from '../../../../../../components/Task/TaskForm';
import CollapsibleTaskItem from '../../../../../../components/Task/CollapsibleTaskItem';
import { useAppContext } from '../../../../../../context/AppContext';
import UpdatesModal from '../../../../../../components/Update/UpdatesModal';
import DropdownMenu from '../../../../../../components/ui/DropdownMenu';
import { brandTheme } from '../../../../../../styles/brandTheme';
import ProjectDetailsSection from './ProjectDetailsSection';
import ProjectDocumentsSection from './ProjectDocumentsSection';
import ProjectUpdates from './ProjectUpdates';

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
    getUpdatesForEntity,
    getRelatedUpdates
  } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  
  // Tab management state
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  
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

  return (
    <>
      {/* Main Project Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-7xl"
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
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
                  
                  {/* Updates Section */}
                  <ProjectUpdates
                    projectId={projectId}
                    directUpdates={directUpdates}
                    onOpenUpdatesModal={handleOpenUpdatesModal}
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'details'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Project Details
                          </button>
                          <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'documents'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Documents/Resources
                          </button>
                        </div>
                      </div>
                    </div>
                    <CardContent>
                      {activeTab === 'details' ? (
                        <ProjectDetailsSection
                          project={{ ...project, tasks: projectTasks }}
                          onUpdateProject={updateProject}
                        />
                      ) : (
                        <ProjectDocumentsSection
                          project={project}
                          onUpdateProject={updateProject}
                        />
                      )}
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
          project={project}
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
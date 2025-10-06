import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, MessageSquare, Pencil } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { Card, CardContent } from '../../../../../../components/ui/Card';
import Modal from '../../../../../../components/ui/Modal';
import ProjectForm from '../../../../../../components/Project/ProjectForm';
import TaskForm from '../../../../../../components/Task/TaskForm';
import CollapsibleTaskItem from '../../../../../../components/Task/CollapsibleTaskItem';
import { useAppContext } from '../../../../../../context/AppContext';
import UpdatesModal from '../../../../../../components/Update/UpdatesModal';
import { brandTheme } from '../../../../../../styles/brandTheme';
import ProjectDetailsSection from './ProjectDetailsSection';
import ProjectDocumentsSection from './ProjectDocumentsSection';
import ProjectUpdates from './ProjectUpdates';
import ProjectDetailsHeader from './ProjectDetailsHeader';
import TaskDetailsModal from './TaskDetailsModal';

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
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Tab management state
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  
  // Description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  
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
  
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailsModalOpen(true);
  };
  
  const handleAddTask = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(true);
  };
  
  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setCurrentTask(null);
  };
  
  const handleTaskDetailsModalClose = () => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskId(null);
  };
  
  const handleOpenUpdatesModal = () => {
    setIsUpdatesModalOpen(true);
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

  // Description editing handlers
  const handleEditDescription = () => {
    setEditedDescription(project.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      await updateProject({
        ...project,
        description: editedDescription
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
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
            <ProjectDetailsHeader
              project={project}
              projectMenuItems={projectMenuItems}
              onClose={onClose}
              onRemoveTag={handleRemoveTag}
            />
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 120px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <Card className="mb-6">
                    <CardContent className="p-6 relative">
                      {!isEditingDescription && (
                        <button
                          onClick={handleEditDescription}
                          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          title="Edit description"
                          style={{ color: brandTheme.text.muted }}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      
                      {isEditingDescription ? (
                        <div>
                          <textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="w-full min-h-[100px] p-3 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ 
                              borderColor: brandTheme.border.light,
                              color: brandTheme.text.secondary,
                              backgroundColor: brandTheme.background.primary
                            }}
                            placeholder="Enter project description..."
                          />
                          <div className="flex justify-end space-x-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelDescription}
                              style={{
                                backgroundColor: brandTheme.primary.lightBlue,
                                color: brandTheme.primary.navy,
                                borderColor: brandTheme.primary.navy
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveDescription}
                              style={{
                                backgroundColor: brandTheme.primary.lightBlue,
                                color: brandTheme.primary.navy
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="whitespace-pre-wrap break-words pr-8"
                          style={{ 
                            color: brandTheme.text.secondary,
                            lineHeight: '1.6',
                            minHeight: 'auto'
                          }}
                      >
                        {project.description || 'No description provided.'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Tasks
                    </h2>
                    <Button 
                      onClick={handleAddTask} 
                      size="sm"
                      style={{
                        backgroundColor: brandTheme.primary.lightBlue,
                        color: brandTheme.primary.navy
                      }}
                    >
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
                          onViewTask={handleViewTask}
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
                        style={{
                          backgroundColor: brandTheme.primary.lightBlue,
                          color: brandTheme.primary.navy
                        }}
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
                    <div 
                      className="p-6"
                      style={{ backgroundColor: brandTheme.primary.navy }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'details'
                                ? 'bg-white text-blue-700'
                                : 'text-white hover:text-gray-200'
                            }`}
                            style={{
                              backgroundColor: activeTab === 'details' ? brandTheme.background.primary : 'transparent'
                            }}
                          >
                            Project Details
                          </button>
                          <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'documents'
                                ? 'bg-white text-blue-700'
                                : 'text-white hover:text-gray-200'
                            }`}
                            style={{
                              backgroundColor: activeTab === 'documents' ? brandTheme.background.primary : 'transparent'
                            }}
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
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)} 
              size="sm"
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy,
                borderColor: brandTheme.primary.navy
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteProject} 
              size="sm"
              style={{
                backgroundColor: brandTheme.status.error,
                color: brandTheme.background.primary
              }}
            >
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
      
      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskDetailsModalOpen}
          onClose={handleTaskDetailsModalClose}
          taskId={selectedTaskId}
        />
      )}
    </>
  );
};

export default ProjectDetailsModal;
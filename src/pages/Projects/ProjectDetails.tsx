import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ArrowLeft, Users, MessageSquare, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProjectForm from '../../components/Project/ProjectForm';
import TaskForm from '../../components/Task/TaskForm';
import CollapsibleTaskItem from '../../components/Task/CollapsibleTaskItem';
import UserAvatar from '../../components/UserAvatar';
import { useAppContext } from '../../context/AppContext';
import UpdatesList from '../../components/Update/UpdatesList';
import UpdateForm from '../../components/Update/UpdateForm';
import UpdatesModal from '../../components/Update/UpdatesModal';
import DropdownMenu from '../../components/ui/DropdownMenu';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { 
    projects, 
    tasks, 
    deleteProject, 
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
  
  if (!projectId) {
    navigate('/projects');
    return null;
  }
  
  const project = projects.find((p) => p.id === projectId);
  
  if (!project) {
    navigate('/projects');
    return null;
  }
  
  // Get tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  
  // Get updates for this project
  const directUpdates = getUpdatesForEntity('project', projectId);
  const allRelatedUpdates = getRelatedUpdates('project', projectId);
  
  const handleDeleteProject = () => {
    deleteProject(projectId);
    navigate('/projects');
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
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 flex items-center mb-6 p-4 rounded-lg border border-gray-200">
        <Button 
          variant="ghost" 
          className="mr-4 bg-white" 
          onClick={() => navigate('/projects')}
          size="sm"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{project.name} - Project</h1>
          <div className="flex items-center mt-1">
            <Badge variant={getProjectTypeVariant(project.projectType)} className="mr-2">
              {project.projectType}
            </Badge>
            <Badge variant="primary" className="mr-2">{project.category}</Badge>
            <Badge variant={getStatusVariant(project.status)} className="mr-2">
              {getStatusText(project.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div>
          <DropdownMenu items={projectMenuItems} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-gray-700">{project.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
            <Button onClick={handleAddTask} size="sm">
              <PlusCircle size={16} className="mr-1" />
              Add Task
            </Button>
          </div>
          
          {projectTasks.length > 0 ? (
            <div>
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
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No tasks created yet.</p>
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
                <p className="text-gray-500 text-sm">No team members assigned yet.</p>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tasks Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{projectTasks.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {projectTasks.filter(task => task.status === 'done').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">In Progress:</span>
                  <span className="font-medium">
                    {projectTasks.filter(task => task.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">To Do:</span>
                  <span className="font-medium">
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
                <p className="text-gray-500 mb-6 text-center py-4">No updates yet</p>
              )}
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update to Project</h4>
                <UpdateForm entityType="project" entityId={projectId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
    </div>
  );
};

export default ProjectDetails;
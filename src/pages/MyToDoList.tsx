import React, { useState } from 'react';
import { CheckCircle, MoreVertical, Edit, Trash2, MessageSquare, Eye, PlusCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import DropdownMenu from '../components/ui/DropdownMenu';
import ProjectForm from '../components/Project/ProjectForm';
import TaskForm from '../components/Task/TaskForm';
import SubTaskForm from '../components/SubTask/SubTaskForm';
import UpdateForm from '../components/Update/UpdateForm';
import UpdatesList from '../components/Update/UpdatesList';
import UserAvatar from '../components/UserAvatar';
import { Project, Task, SubTask } from '../types';
import { useNavigate } from 'react-router-dom';

const MyToDoList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    projects, 
    tasks, 
    subTasks,
    getUsers,
    getUpdatesForEntity,
    deleteProject,
    deleteTask,
    deleteSubTask,
    updateProject,
    updateTask,
    updateSubTask
  } = useAppContext();

  // State for edit modals
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editSubTask, setEditSubTask] = useState<SubTask | null>(null);
  
  // State for delete confirmation
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteSubTaskId, setDeleteSubTaskId] = useState<string | null>(null);
  
  // State for updates display
  const [showUpdatesForType, setShowUpdatesForType] = useState<'project' | 'task' | 'subtask' | null>(null);
  const [showUpdatesForId, setShowUpdatesForId] = useState<string | null>(null);
  
  // State for update form
  const [showUpdateFormForType, setShowUpdateFormForType] = useState<'project' | 'task' | 'subtask' | null>(null);
  const [showUpdateFormForId, setShowUpdateFormForId] = useState<string | null>(null);
  
  // State for expanded items (to show descriptions)
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});

  // Filter items assigned to the current user - no status filter
  const myProjects = projects.filter(project => 
    // Find tasks in this project that are assigned to the current user
    tasks.some(task => 
      task.projectId === project.id && 
      task.assigneeId === currentUser?.id
    )
  );
  
  const myTasks = tasks.filter(task => 
    task.assigneeId === currentUser?.id
  );
  
  const mySubTasks = subTasks.filter(subtask => 
    subtask.assigneeId === currentUser?.id
  );
  
  // Get users data
  const users = getUsers();
  
  // Get entity name
  const getEntityName = (type: 'project' | 'task' | 'subtask', id: string) => {
    if (type === 'project') {
      return projects.find(p => p.id === id)?.name || 'Unknown';
    } else if (type === 'task') {
      return tasks.find(t => t.id === id)?.name || 'Unknown';
    } else {
      return subTasks.find(s => s.id === id)?.name || 'Unknown';
    }
  };
  
  // Handle toggle expand
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle status toggle
  const handleToggleStatus = (type: 'project' | 'task' | 'subtask', id: string) => {
    if (type === 'project') {
      const project = projects.find(p => p.id === id);
      if (project) {
        updateProject({
          ...project,
          status: project.status === 'todo' ? 'in-progress' : 
                 project.status === 'in-progress' ? 'done' : 'todo'
        });
      }
    } else if (type === 'task') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateTask({
          ...task,
          status: task.status === 'todo' ? 'in-progress' : 
                task.status === 'in-progress' ? 'done' : 'todo'
        });
      }
    } else {
      const subtask = subTasks.find(s => s.id === id);
      if (subtask) {
        updateSubTask({
          ...subtask,
          status: subtask.status === 'todo' ? 'in-progress' : 
                 subtask.status === 'in-progress' ? 'done' : 'todo'
        });
      }
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
  
  // Get task type badge variant
  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'danger';
      case 'Feature':
        return 'primary';
      case 'Discovery':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Get the appropriate icon for status toggle button
  const getStatusIcon = (status: string) => {
    return status === 'done' ? (
      <CheckCircle size={20} className="text-green-500" />
    ) : status === 'in-progress' ? (
      <CheckCircle size={20} className="text-yellow-500" />
    ) : (
      <CheckCircle size={20} className="text-gray-400" />
    );
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

  // Render project row
  const renderProjectRow = (project: Project) => {
    const projectUpdates = getUpdatesForEntity('project', project.id);
    const showingUpdates = showUpdatesForType === 'project' && showUpdatesForId === project.id;
    const showingUpdateForm = showUpdateFormForType === 'project' && showUpdateFormForId === project.id;
    const isExpanded = expandedItems[project.id] || false;
    
    const menuItems = [
      {
        label: 'View Project',
        icon: <Eye size={16} />,
        onClick: () => navigate(`/projects/${project.id}`)
      },
      {
        label: 'Edit Project',
        icon: <Edit size={16} />,
        onClick: () => setEditProject(project)
      },
      {
        label: 'Delete Project',
        icon: <Trash2 size={16} />,
        onClick: () => setDeleteProjectId(project.id),
        className: 'text-red-500'
      },
      {
        label: showingUpdates ? 'Hide Updates' : 'Show Updates',
        icon: <MessageSquare size={16} />,
        onClick: () => {
          if (showingUpdates) {
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          } else {
            setShowUpdatesForType('project');
            setShowUpdatesForId(project.id);
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          }
        }
      },
      {
        label: showingUpdateForm ? 'Hide Update Form' : 'Add Update',
        icon: <PlusCircle size={16} />,
        onClick: () => {
          if (showingUpdateForm) {
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          } else {
            setShowUpdateFormForType('project');
            setShowUpdateFormForId(project.id);
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          }
        }
      }
    ];

    return (
      <div key={project.id} className="mb-2 border rounded-md overflow-hidden bg-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 mr-3"
              onClick={() => handleToggleStatus('project', project.id)}
              title="Toggle Status"
            >
              {getStatusIcon(project.status)}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-1 mr-2 text-gray-500"
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(project.id);
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 flex items-center">
                {project.name}
                <Badge 
                  variant={getProjectTypeVariant(project.projectType)} 
                  className="ml-2"
                >
                  {project.projectType}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Badge variant={getStatusVariant(project.status)}>
              {getStatusText(project.status)}
            </Badge>
            
            {projectUpdates.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 p-1 h-auto"
                onClick={() => {
                  setShowUpdatesForType('project');
                  setShowUpdatesForId(project.id);
                  setShowUpdateFormForType(null);
                  setShowUpdateFormForId(null);
                }}
              >
                <MessageSquare size={16} />
                <span className="ml-1">{projectUpdates.length}</span>
              </Button>
            )}
            
            <DropdownMenu items={menuItems} />
          </div>
        </div>
        
        {/* Show description if expanded */}
        {isExpanded && project.description && (
          <div className="px-12 py-3 border-t border-gray-100 bg-blue-50">
            <p className="text-sm text-gray-700">{project.description}</p>
          </div>
        )}
        
        {/* Show updates if selected */}
        {showingUpdates && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Updates</h4>
            <div className="bg-white rounded-md border border-gray-200">
              <UpdatesList updates={projectUpdates} />
            </div>
          </div>
        )}
        
        {/* Show update form if selected */}
        {showingUpdateForm && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update</h4>
            <UpdateForm 
              entityType="project" 
              entityId={project.id} 
              onComplete={() => {
                setShowUpdateFormForType(null);
                setShowUpdateFormForId(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Render task row
  const renderTaskRow = (task: Task) => {
    const taskUpdates = getUpdatesForEntity('task', task.id);
    const showingUpdates = showUpdatesForType === 'task' && showUpdatesForId === task.id;
    const showingUpdateForm = showUpdateFormForType === 'task' && showUpdateFormForId === task.id;
    const project = projects.find(p => p.id === task.projectId);
    const assignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : null;
    const isExpanded = expandedItems[task.id] || false;
    
    const menuItems = [
      {
        label: 'View Task',
        icon: <Eye size={16} />,
        onClick: () => navigate(`/projects/${task.projectId}/tasks/${task.id}`)
      },
      {
        label: 'Edit Task',
        icon: <Edit size={16} />,
        onClick: () => setEditTask(task)
      },
      {
        label: 'Delete Task',
        icon: <Trash2 size={16} />,
        onClick: () => setDeleteTaskId(task.id),
        className: 'text-red-500'
      },
      {
        label: showingUpdates ? 'Hide Updates' : 'Show Updates',
        icon: <MessageSquare size={16} />,
        onClick: () => {
          if (showingUpdates) {
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          } else {
            setShowUpdatesForType('task');
            setShowUpdatesForId(task.id);
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          }
        }
      },
      {
        label: showingUpdateForm ? 'Hide Update Form' : 'Add Update',
        icon: <PlusCircle size={16} />,
        onClick: () => {
          if (showingUpdateForm) {
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          } else {
            setShowUpdateFormForType('task');
            setShowUpdateFormForId(task.id);
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          }
        }
      }
    ];

    return (
      <div key={task.id} className="mb-2 border rounded-md overflow-hidden bg-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 mr-3"
              onClick={() => handleToggleStatus('task', task.id)}
              title="Toggle Status"
            >
              {getStatusIcon(task.status)}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-1 mr-2 text-gray-500"
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(task.id);
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 flex items-center">
                {task.name}
                <Badge 
                  variant={getTypeVariant(task.taskType)} 
                  className="ml-2"
                >
                  {task.taskType}
                </Badge>
              </div>
              {!isExpanded && (
                <div className="text-sm text-gray-500 truncate mt-0.5">
                  <span className="font-medium">{project?.name || 'Unknown Project'}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {assignee && (
              <div className="mr-2">
                <UserAvatar user={assignee} size="sm" />
              </div>
            )}
            
            <Badge variant={getStatusVariant(task.status)}>
              {getStatusText(task.status)}
            </Badge>
            
            {taskUpdates.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 p-1 h-auto"
                onClick={() => {
                  setShowUpdatesForType('task');
                  setShowUpdatesForId(task.id);
                  setShowUpdateFormForType(null);
                  setShowUpdateFormForId(null);
                }}
              >
                <MessageSquare size={16} />
                <span className="ml-1">{taskUpdates.length}</span>
              </Button>
            )}
            
            <DropdownMenu items={menuItems} />
          </div>
        </div>
        
        {/* Show description and project details if expanded */}
        {isExpanded && (
          <div className="px-12 py-3 border-t border-gray-100 bg-blue-50">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Project: </span>
              <span className="text-sm text-gray-700">{project?.name || 'Unknown Project'}</span>
            </div>
            {task.description && (
              <div>
                <span className="text-sm font-medium text-gray-700">Description: </span>
                <p className="text-sm text-gray-700">{task.description}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Show updates if selected */}
        {showingUpdates && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Updates</h4>
            <div className="bg-white rounded-md border border-gray-200">
              <UpdatesList updates={taskUpdates} />
            </div>
          </div>
        )}
        
        {/* Show update form if selected */}
        {showingUpdateForm && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update</h4>
            <UpdateForm 
              entityType="task" 
              entityId={task.id} 
              onComplete={() => {
                setShowUpdateFormForType(null);
                setShowUpdateFormForId(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Render subtask row
  const renderSubTaskRow = (subtask: SubTask) => {
    const subtaskUpdates = getUpdatesForEntity('subtask', subtask.id);
    const showingUpdates = showUpdatesForType === 'subtask' && showUpdatesForId === subtask.id;
    const showingUpdateForm = showUpdateFormForType === 'subtask' && showUpdateFormForId === subtask.id;
    
    const task = tasks.find(t => t.id === subtask.taskId);
    const project = task ? projects.find(p => p.id === task.projectId) : null;
    const assignee = subtask.assigneeId ? users.find(u => u.id === subtask.assigneeId) : null;
    const isExpanded = expandedItems[subtask.id] || false;
    
    const menuItems = [
      {
        label: 'View SubTask',
        icon: <Eye size={16} />,
        onClick: () => {
          if (task && project) {
            navigate(`/projects/${project.id}/tasks/${task.id}/subtasks/${subtask.id}`);
          }
        }
      },
      {
        label: 'Edit SubTask',
        icon: <Edit size={16} />,
        onClick: () => setEditSubTask(subtask)
      },
      {
        label: 'Delete SubTask',
        icon: <Trash2 size={16} />,
        onClick: () => setDeleteSubTaskId(subtask.id),
        className: 'text-red-500'
      },
      {
        label: showingUpdates ? 'Hide Updates' : 'Show Updates',
        icon: <MessageSquare size={16} />,
        onClick: () => {
          if (showingUpdates) {
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          } else {
            setShowUpdatesForType('subtask');
            setShowUpdatesForId(subtask.id);
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          }
        }
      },
      {
        label: showingUpdateForm ? 'Hide Update Form' : 'Add Update',
        icon: <PlusCircle size={16} />,
        onClick: () => {
          if (showingUpdateForm) {
            setShowUpdateFormForType(null);
            setShowUpdateFormForId(null);
          } else {
            setShowUpdateFormForType('subtask');
            setShowUpdateFormForId(subtask.id);
            setShowUpdatesForType(null);
            setShowUpdatesForId(null);
          }
        }
      }
    ];

    return (
      <div key={subtask.id} className="mb-2 border rounded-md overflow-hidden bg-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 mr-3"
              onClick={() => handleToggleStatus('subtask', subtask.id)}
              title="Toggle Status"
            >
              {getStatusIcon(subtask.status)}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-1 mr-2 text-gray-500"
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(subtask.id);
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 flex items-center">
                {subtask.name}
                <Badge 
                  variant={getTypeVariant(subtask.taskType)} 
                  className="ml-2"
                >
                  {subtask.taskType}
                </Badge>
              </div>
              {!isExpanded && (
                <div className="text-sm text-gray-500 truncate mt-0.5">
                  <span className="font-medium">{task?.name || 'Unknown Task'}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {assignee && (
              <div className="mr-2">
                <UserAvatar user={assignee} size="sm" />
              </div>
            )}
            
            <Badge variant={getStatusVariant(subtask.status)}>
              {getStatusText(subtask.status)}
            </Badge>
            
            {subtaskUpdates.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 p-1 h-auto"
                onClick={() => {
                  setShowUpdatesForType('subtask');
                  setShowUpdatesForId(subtask.id);
                  setShowUpdateFormForType(null);
                  setShowUpdateFormForId(null);
                }}
              >
                <MessageSquare size={16} />
                <span className="ml-1">{subtaskUpdates.length}</span>
              </Button>
            )}
            
            <DropdownMenu items={menuItems} />
          </div>
        </div>
        
        {/* Show description and parent task details if expanded */}
        {isExpanded && (
          <div className="px-12 py-3 border-t border-gray-100 bg-blue-50">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Parent Task: </span>
              <span className="text-sm text-gray-700">{task?.name || 'Unknown Task'}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Project: </span>
              <span className="text-sm text-gray-700">{project?.name || 'Unknown Project'}</span>
            </div>
            {subtask.description && (
              <div>
                <span className="text-sm font-medium text-gray-700">Description: </span>
                <p className="text-sm text-gray-700">{subtask.description}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Show updates if selected */}
        {showingUpdates && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Updates</h4>
            <div className="bg-white rounded-md border border-gray-200">
              <UpdatesList updates={subtaskUpdates} />
            </div>
          </div>
        )}
        
        {/* Show update form if selected */}
        {showingUpdateForm && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update</h4>
            <UpdateForm 
              entityType="subtask" 
              entityId={subtask.id} 
              onComplete={() => {
                setShowUpdateFormForType(null);
                setShowUpdateFormForId(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My To Do List</h1>
        {currentUser && (
          <div className="flex items-center">
            <div className="mr-2">
              <UserAvatar user={currentUser} size="sm" />
            </div>
            <span className="text-sm font-medium">
              {currentUser.firstName && currentUser.lastName 
                ? `${currentUser.firstName} ${currentUser.lastName}` 
                : currentUser.email}
            </span>
          </div>
        )}
      </div>
      
      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {myProjects.length > 0 ? (
            <div>
              {myProjects.map(renderProjectRow)}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-md border border-gray-200">
              <p className="text-gray-500">No projects assigned to you.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks.length > 0 ? (
            <div>
              {myTasks.map(renderTaskRow)}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-md border border-gray-200">
              <p className="text-gray-500">No tasks assigned to you.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Subtasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Subtasks</CardTitle>
        </CardHeader>
        <CardContent>
          {mySubTasks.length > 0 ? (
            <div>
              {mySubTasks.map(renderSubTaskRow)}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-md border border-gray-200">
              <p className="text-gray-500">No subtasks assigned to you.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals for editing */}
      {editProject && (
        <Modal
          isOpen={true}
          onClose={() => setEditProject(null)}
          title="Edit Project"
        >
          <ProjectForm 
            project={editProject} 
            onSubmit={() => setEditProject(null)} 
          />
        </Modal>
      )}
      
      {editTask && (
        <Modal
          isOpen={true}
          onClose={() => setEditTask(null)}
          title="Edit Task"
        >
          <TaskForm 
            projectId={editTask.projectId}
            task={editTask} 
            onSubmit={() => setEditTask(null)} 
          />
        </Modal>
      )}
      
      {editSubTask && (
        <Modal
          isOpen={true}
          onClose={() => setEditSubTask(null)}
          title="Edit Subtask"
        >
          <SubTaskForm 
            taskId={editSubTask.taskId}
            subTask={editSubTask} 
            onSubmit={() => setEditSubTask(null)} 
          />
        </Modal>
      )}
      
      {/* Delete confirmation modals */}
      {deleteProjectId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteProjectId(null)}
          title="Delete Project"
        >
          <div>
            <p className="mb-6">Are you sure you want to delete this project? This action cannot be undone and will also delete all tasks associated with this project.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteProjectId(null)} size="sm">
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  deleteProject(deleteProjectId);
                  setDeleteProjectId(null);
                }} 
                size="sm"
              >
                Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {deleteTaskId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteTaskId(null)}
          title="Delete Task"
        >
          <div>
            <p className="mb-6">Are you sure you want to delete this task? This action cannot be undone and will also delete all subtasks associated with this task.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteTaskId(null)} size="sm">
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  deleteTask(deleteTaskId);
                  setDeleteTaskId(null);
                }} 
                size="sm"
              >
                Delete Task
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {deleteSubTaskId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteSubTaskId(null)}
          title="Delete Subtask"
        >
          <div>
            <p className="mb-6">Are you sure you want to delete this subtask? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteSubTaskId(null)} size="sm">
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  deleteSubTask(deleteSubTaskId);
                  setDeleteSubTaskId(null);
                }} 
                size="sm"
              >
                Delete Subtask
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyToDoList;
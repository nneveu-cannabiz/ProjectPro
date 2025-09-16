import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, CheckSquare, AlertCircle, FolderOpen, Plus, Search } from 'lucide-react';
import { Project, Task, User } from '../../../../types';
import { fetchProductDevProjects, fetchProductDevProjectTasks, fetchUsers } from '../../../../data/supabase-store';
import { brandTheme } from '../../../../styles/brandTheme';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import UserAvatar from '../../../../components/UserAvatar';
import { Card } from '../../../../components/ui/Card';
import ProjectDetailsModal from '../Flow Chart/utils/Profiles/ProjectDetailsModal';
import TaskDetailsModal from '../Flow Chart/utils/Profiles/TaskDetailsModal';
import { useAppContext } from '../../../../context/AppContext';

interface ProjectWithTasks extends Project {
  tasks: Task[];
  assignedUsers: User[];
}

const ProductDevProjectPage: React.FC = () => {
  // Get data from AppContext
  const { 
    projects: allProjects, 
    tasks: allTasks, 
    getUsers,
    isLoading: contextLoading,
    error: contextError
  } = useAppContext();
  
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Effect to process AppContext data and combine with Product Dev specific data
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get users from AppContext
        const contextUsers = getUsers();
        setUsers(contextUsers);

        // Always try to use AppContext data first, even if empty
        // Filter for Product Development projects from AppContext
        const productDevProjects = allProjects.filter(project => 
          project.flowChart === 'Product Development'
        );

        if (productDevProjects.length > 0 || allProjects.length > 0) {
          // Create enhanced project objects with tasks and assigned users
          const projectsWithTasks: ProjectWithTasks[] = productDevProjects.map(project => {
            const projectTasks = allTasks.filter(task => task.projectId === project.id);
            
            // Get all assigned users for this project and its tasks
            const assigneeIds = new Set<string>();
            if (project.assigneeId) assigneeIds.add(project.assigneeId);
            if (project.multiAssigneeIds) {
              project.multiAssigneeIds.forEach(id => assigneeIds.add(id));
            }
            projectTasks.forEach(task => {
              if (task.assigneeId) assigneeIds.add(task.assigneeId);
            });

            const assignedUsers = contextUsers.filter(user => assigneeIds.has(user.id));

            return {
              ...project,
              tasks: projectTasks,
              assignedUsers
            };
          });

          setProjects(projectsWithTasks);
        } else if (!contextLoading) {
          // Only fallback to direct Supabase fetch if AppContext is not loading and has no data
          const [usersData, projectsData] = await Promise.all([
            fetchUsers(),
            fetchProductDevProjects()
          ]);

          setUsers(usersData);

          if (projectsData.length > 0) {
            const projectIds = projectsData.map(p => p.id);
            const tasksData = await fetchProductDevProjectTasks(projectIds);

            const projectsWithTasks: ProjectWithTasks[] = projectsData.map(project => {
              const projectTasks = tasksData.filter(task => task.projectId === project.id);
              
              const assigneeIds = new Set<string>();
              if (project.assigneeId) assigneeIds.add(project.assigneeId);
              if (project.multiAssigneeIds) {
                project.multiAssigneeIds.forEach(id => assigneeIds.add(id));
              }
              projectTasks.forEach(task => {
                if (task.assigneeId) assigneeIds.add(task.assigneeId);
              });

              const assignedUsers = usersData.filter(user => assigneeIds.has(user.id));

              return {
                ...project,
                tasks: projectTasks,
                assignedUsers
              };
            });

            setProjects(projectsWithTasks);
          } else {
            setProjects([]);
          }
        } else {
          // AppContext is loading, set empty projects for now
          setProjects([]);
        }
      } catch (err) {
        console.error('Error loading Product Dev projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [allProjects, allTasks, getUsers, contextLoading]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }

    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project => {
      // Search in project name
      if (project.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in project description
      if (project.description?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in project category
      if (project.category?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in project type
      if (project.projectType?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in assigned users
      const userMatch = project.assignedUsers.some(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) || 
        user.email?.toLowerCase().includes(query)
      );
      if (userMatch) {
        return true;
      }
      
      // Search in task names
      const taskMatch = project.tasks.some(task => 
        task.name.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
      
      return taskMatch;
    });
  }, [projects, searchQuery]);

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Modal handlers
  const handleProjectClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expansion toggle
    setSelectedProjectId(projectId);
    setIsProjectModalOpen(true);
  };

  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProjectId(null);
    // No need to refresh data manually since AppContext handles updates automatically
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
    // No need to refresh data manually since AppContext handles updates automatically
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return { bg: brandTheme.status.infoLight, text: brandTheme.status.info };
      case 'in-progress':
        return { bg: brandTheme.status.warningLight, text: brandTheme.status.warning };
      case 'done':
        return { bg: brandTheme.status.successLight, text: brandTheme.status.success };
      default:
        return { bg: brandTheme.gray[100], text: brandTheme.gray[600] };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return { bg: brandTheme.status.errorLight, text: brandTheme.status.error };
      case 'High':
        return { bg: brandTheme.status.warningLight, text: brandTheme.status.warning };
      case 'Medium':
        return { bg: brandTheme.status.infoLight, text: brandTheme.status.info };
      case 'Low':
        return { bg: brandTheme.gray[100], text: brandTheme.gray[600] };
      default:
        return { bg: brandTheme.gray[100], text: brandTheme.gray[600] };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: brandTheme.background.brand }}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                   style={{ borderColor: brandTheme.primary.navy }}></div>
              <p style={{ color: brandTheme.text.muted }}>Loading Product Development projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || contextError) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: brandTheme.background.brand }}>
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <AlertCircle size={48} style={{ color: brandTheme.status.error }} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: brandTheme.text.primary }}>
              Error Loading Projects
            </h2>
            <p style={{ color: brandTheme.text.muted }} className="mb-4">{error || contextError}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: brandTheme.background.brand }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>
                Product Development Projects
              </h1>
              <p style={{ color: brandTheme.text.muted }}>
                View and manage all projects in the Product Development flow chart
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm" style={{ color: brandTheme.text.muted }}>
                  {searchQuery ? `${filteredProjects.length} of ${projects.length}` : 'Total Projects'}
                </div>
                <div className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
                  {searchQuery ? filteredProjects.length : projects.length}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} style={{ color: brandTheme.text.muted }} />
            </div>
            <input
              type="text"
              placeholder="Search projects, tasks, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light,
                color: brandTheme.text.primary
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{ color: brandTheme.text.muted }}
              >
                <span className="text-lg hover:opacity-70 transition-opacity">×</span>
              </button>
            )}
          </div>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen size={64} style={{ color: brandTheme.gray[400] }} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: brandTheme.text.primary }}>
              No Product Development Projects
            </h2>
            <p style={{ color: brandTheme.text.muted }} className="mb-6">
              There are currently no projects assigned to the Product Development flow chart.
            </p>
            <Button>
              <Plus size={16} className="mr-2" />
              Create New Project
            </Button>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <Search size={64} style={{ color: brandTheme.gray[400] }} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: brandTheme.text.primary }}>
              No Projects Found
            </h2>
            <p style={{ color: brandTheme.text.muted }} className="mb-6">
              No projects match your search for "{searchQuery}". Try adjusting your search terms.
            </p>
            <Button onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const completedTasks = project.tasks.filter(task => task.status === 'done').length;
              const totalTasks = project.tasks.length;
              const statusColors = getStatusColor(project.status);

              return (
                <Card key={project.id} className="overflow-hidden">
                  {/* Project Header */}
                  <div 
                    className="p-6 cursor-pointer transition-colors"
                    style={{ backgroundColor: brandTheme.primary.paleBlue }}
                    onClick={() => toggleProjectExpansion(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button 
                          className="flex-shrink-0 p-1 rounded-full transition-colors"
                          style={{ color: brandTheme.text.secondary }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </button>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold truncate" 
                              style={{ color: brandTheme.text.primary }}>
                            <button
                              onClick={(e) => handleProjectClick(project.id, e)}
                              className="text-left hover:underline focus:outline-none focus:underline transition-all"
                              style={{ color: brandTheme.primary.navy }}
                            >
                              {project.name}
                            </button>
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}
                            >
                              {getStatusText(project.status)}
                            </span>
                            <Badge variant="secondary">
                              {project.category}
                            </Badge>
                            <Badge variant="default">
                              {project.projectType}
                            </Badge>
                          </div>
                          {!isExpanded && project.description && (
                            <p className="text-sm mt-2 truncate" 
                               style={{ color: brandTheme.text.muted }}>
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Task Progress */}
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <CheckSquare size={16} style={{ color: brandTheme.text.muted }} />
                            <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                              {completedTasks}/{totalTasks}
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                            tasks
                          </div>
                        </div>

                        {/* Team Members */}
                        {project.assignedUsers.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users size={16} style={{ color: brandTheme.text.muted }} />
                            <div className="flex -space-x-2">
                              {project.assignedUsers.slice(0, 3).map((user, index) => (
                                <div key={user.id} style={{ zIndex: 10 - index }}>
                                  <UserAvatar user={user} size="sm" />
                                </div>
                              ))}
                              {project.assignedUsers.length > 3 && (
                                <div 
                                  className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border-2 border-white"
                                  style={{ 
                                    backgroundColor: brandTheme.gray[200],
                                    color: brandTheme.text.muted
                                  }}
                                >
                                  +{project.assignedUsers.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} style={{ color: brandTheme.text.muted }} />
                            <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
                              {formatDate(project.deadline || project.endDate)}
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                            {project.deadline ? 'deadline' : 'end date'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div 
                      className="border-t"
                      style={{ 
                        backgroundColor: brandTheme.background.secondary,
                        borderColor: brandTheme.border.light 
                      }}
                    >
                      {/* Project Details */}
                      <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
                        {project.description && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2" 
                                style={{ color: brandTheme.text.fieldLabel }}>
                              Description
                            </h4>
                            <p style={{ color: brandTheme.text.muted }}>
                              {project.description}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-1" 
                                style={{ color: brandTheme.text.fieldLabel }}>
                              Created
                            </h4>
                            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                              {formatDate(project.createdAt)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-1" 
                                style={{ color: brandTheme.text.fieldLabel }}>
                              Start Date
                            </h4>
                            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                              {formatDate(project.startDate)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-1" 
                                style={{ color: brandTheme.text.fieldLabel }}>
                              End Date
                            </h4>
                            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                              {formatDate(project.endDate)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-1" 
                                style={{ color: brandTheme.text.fieldLabel }}>
                              Progress
                            </h4>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="flex-1 h-2 rounded-full"
                                style={{ backgroundColor: brandTheme.gray[200] }}
                              >
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${project.progress || 0}%`,
                                    backgroundColor: project.progress === 100 
                                      ? brandTheme.status.success 
                                      : brandTheme.primary.navy
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium" 
                                    style={{ color: brandTheme.text.secondary }}>
                                {project.progress || 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold" 
                              style={{ color: brandTheme.text.fieldLabel }}>
                            Tasks ({project.tasks.length})
                          </h4>
                        </div>

                        {project.tasks.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckSquare size={48} style={{ color: brandTheme.gray[400] }} className="mx-auto mb-4" />
                            <p style={{ color: brandTheme.text.muted }}>
                              No tasks created for this project yet.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {project.tasks.map((task) => {
                              const taskStatusColors = getStatusColor(task.status);
                              const priorityColors = getPriorityColor(task.priority);
                              const taskAssignee = task.assigneeId 
                                ? users.find(user => user.id === task.assigneeId) 
                                : null;

                              return (
                                <div 
                                  key={task.id}
                                  className="p-4 rounded-lg border transition-colors hover:shadow-sm"
                                  style={{ 
                                    backgroundColor: brandTheme.background.primary,
                                    borderColor: brandTheme.border.light 
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium truncate" 
                                          style={{ color: brandTheme.text.primary }}>
                                        <button
                                          onClick={(e) => handleTaskClick(task.id, e)}
                                          className="text-left hover:underline focus:outline-none focus:underline transition-all"
                                          style={{ color: brandTheme.primary.navy }}
                                        >
                                          {task.name}
                                        </button>
                                      </h5>
                                      {task.description && (
                                        <p className="text-sm mt-1 line-clamp-2" 
                                           style={{ color: brandTheme.text.muted }}>
                                          {task.description}
                                        </p>
                                      )}
                                      <div className="flex items-center space-x-2 mt-2">
                                        <span 
                                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                          style={{
                                            backgroundColor: taskStatusColors.bg,
                                            color: taskStatusColors.text
                                          }}
                                        >
                                          {getStatusText(task.status)}
                                        </span>
                                        <Badge variant="default" className="text-xs">
                                          {task.taskType}
                                        </Badge>
                                        {task.priority && (
                                          <span 
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            style={{
                                              backgroundColor: priorityColors.bg,
                                              color: priorityColors.text
                                            }}
                                          >
                                            {task.priority}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 ml-4">
                                      {task.deadline && (
                                        <div className="text-right">
                                          <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                                            Deadline
                                          </div>
                                          <div className="text-sm font-medium" 
                                               style={{ color: brandTheme.status.warning }}>
                                            {formatDate(task.deadline)}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {taskAssignee && (
                                        <UserAvatar user={taskAssignee} size="sm" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modals */}
      {selectedProjectId && (
        <ProjectDetailsModal
          isOpen={isProjectModalOpen}
          onClose={handleCloseProjectModal}
          projectId={selectedProjectId}
        />
      )}
      
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
};

export default ProductDevProjectPage;

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, FolderOpen, Plus, Search } from 'lucide-react';
import { Project, Task, User } from '../../../../types';
import { fetchProductDevProjects, fetchProductDevProjectTasks, fetchUsers, batchUpdateProjectRankings } from '../../../../data/supabase-store';
import { brandTheme } from '../../../../styles/brandTheme';
import Button from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import ProjectDetailsModal from '../Flow Chart/utils/Profiles/ProjectDetailsModal';
import TaskDetailsModal from '../Flow Chart/utils/Profiles/TaskDetailsModal';
import { useAppContext } from '../../../../context/AppContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface ProjectWithTasks extends Project {
  tasks: Task[];
  assignedUsers: User[];
}

import SortableProjectCard from './SortableProjectCard';

const PAGE_NAME = 'Product Dev Project Page';

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
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Require 5px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Sort projects by ranking for this page, then alphabetically
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aRank = a.ranking?.[PAGE_NAME];
      const bRank = b.ranking?.[PAGE_NAME];

      // Both have rankings for this page
      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank;
      }

      // Only a has ranking - a comes first
      if (aRank !== undefined) {
        return -1;
      }

      // Only b has ranking - b comes first
      if (bRank !== undefined) {
        return 1;
      }

      // Neither has ranking - sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedProjects;
    }

    const query = searchQuery.toLowerCase().trim();
    return sortedProjects.filter(project => {
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
  }, [sortedProjects, searchQuery]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🎯 Drag ended!', { active: active.id, over: over?.id });

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredProjects.findIndex(p => p.id === active.id);
    const newIndex = filteredProjects.findIndex(p => p.id === over.id);
    
    console.log('📍 Moving project from index', oldIndex, 'to', newIndex);

    // Reorder locally
    const reorderedProjects = arrayMove(filteredProjects, oldIndex, newIndex);
    
    // Update the main projects array to reflect the new order
    const updatedProjects = projects.map(project => {
      const newPosition = reorderedProjects.findIndex(p => p.id === project.id);
      if (newPosition !== -1) {
        return reorderedProjects[newPosition];
      }
      return project;
    });
    
    setProjects(updatedProjects);

    // Save rankings to database - assign rank 1, 2, 3, etc. based on new order
    try {
      setIsSaving(true);
      const rankings = reorderedProjects.map((project, index) => ({
        projectId: project.id,
        rank: index + 1 // Rank starts at 1
      }));
      
      console.log('💾 Saving rankings:', rankings);
      
      await batchUpdateProjectRankings(rankings, PAGE_NAME);
      
      // Refresh the page data from database to get updated rankings
      console.log('🔄 Refreshing data from database...');
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
        console.log('✅ Data refreshed successfully!');
      }
    } catch (error) {
      console.error('Failed to save project rankings:', error);
      setError('Failed to save new project order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRankChange = async (projectId: string, newRank: number) => {
    try {
      setIsSaving(true);
      
      // Find the project that's being ranked
      const projectToRank = filteredProjects.find(p => p.id === projectId);
      if (!projectToRank) return;

      // Create a new array with the project moved to the new rank position
      const otherProjects = filteredProjects.filter(p => p.id !== projectId);
      const insertIndex = Math.min(Math.max(0, newRank - 1), otherProjects.length);
      const reorderedProjects = [
        ...otherProjects.slice(0, insertIndex),
        projectToRank,
        ...otherProjects.slice(insertIndex)
      ];

      // Save all rankings to database first
      const rankings = reorderedProjects.map((project, index) => ({
        projectId: project.id,
        rank: index + 1
      }));
      
      await batchUpdateProjectRankings(rankings, PAGE_NAME);

      // Refresh the page data from database to get updated rankings
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
      }
    } catch (error) {
      console.error('Failed to update project rank:', error);
      setError('Failed to update project rank. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
                {isSaving && <span className="ml-2 text-sm italic">(Saving order...)</span>}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => {
              console.log('🚀 Drag started!', event.active.id);
            }}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredProjects.map((project, index) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggleExpand={() => toggleProjectExpansion(project.id)}
                    onProjectClick={handleProjectClick}
                    onTaskClick={handleTaskClick}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getPriorityColor={getPriorityColor}
                    formatDate={formatDate}
                    users={users}
                    pageName={PAGE_NAME}
                    displayRank={index + 1}
                    onRankChange={handleRankChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

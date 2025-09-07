import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { User, Task } from '../../../../../types';
import { fetchUsersByDepartment, fetchFlowChartProjects, fetchTasks } from '../../../../../data/supabase-store';
import { getCurrentDay } from '../utils/dateUtils';
import { parseISO, isWithinInterval, startOfWeek, endOfWeek, format, differenceInDays } from 'date-fns';
import UserAvatar from '../../../../../components/UserAvatar';
import ProjectDetailsModal from '../utils/Profiles/ProjectDetailsModal';
import TaskDetailsModal from '../utils/Profiles/TaskDetailsModal';
import ProjectUpdateIcon from '../utils/Project Bar/projectupdateicon';
import TaskUpdateIcon from '../utils/Project Bar/taskupdateicon';
import UpdatesDetailsModal from '../utils/UpdatesDetailsModal';
import FilterButton, { FilterOptions } from './FilterButton';

interface ThisWeekFocusProps {
  selectedDepartment?: string;
  currentDates?: Date[];
  onProjectNameClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  getUpdatesCountsForProject?: (projectId: string) => { totalCount: number; unreadCount: number };
  onModalClose?: () => void;
}

interface ProcessedProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assigneeId: string | null;
  multiAssigneeIds: string[];
  tasks: Task[];
  progress: number;
  deadline?: Date;
}

const ThisWeekFocus: React.FC<ThisWeekFocusProps> = ({
  selectedDepartment = 'Product Development',
  currentDates: _currentDates,
  onProjectNameClick,
  onTaskClick,
  onUpdatesClick: _onUpdatesClick,
  onTaskUpdatesClick: _onTaskUpdatesClick,
  getTaskUpdatesCount: _getTaskUpdatesCount,
  getUpdatesCountsForProject: _getUpdatesCountsForProject,
  onModalClose
}) => {
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [updatesEntityType, setUpdatesEntityType] = useState<'project' | 'task'>('project');
  const [updatesEntityId, setUpdatesEntityId] = useState<string>('');
  const [updatesEntityName, setUpdatesEntityName] = useState<string>('');
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    projectStatuses: [],
    taskStatuses: [],
    assignees: [],
    excludeOngoingProjects: false
  });

  // Calculate this week's date range
  const today = getCurrentDay();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

  useEffect(() => {
    loadThisWeekProjects();
  }, [selectedDepartment]);

  const loadThisWeekProjects = async () => {
    try {
      setLoading(true);
      
      // Load users and projects
      const [departmentUsers, flowChartProjects, allTasks] = await Promise.all([
        fetchUsersByDepartment(selectedDepartment),
        fetchFlowChartProjects(selectedDepartment),
        fetchTasks()
      ]);

      // Process projects similar to ProjectUserWeekChart
      const processedProjects = (flowChartProjects || [])
        .filter((p: any) => p.start_date) // Only projects with start dates
        .map((p: any) => {
          // Get tasks for this project
          const projectTasks = allTasks.filter(task => task.projectId === p.id);
          
          return {
            id: p.id,
            name: p.name,
            startDate: parseISO(p.start_date),
            endDate: p.end_date ? parseISO(p.end_date) : parseISO(p.start_date),
            assigneeId: p.assignee_id || null,
            multiAssigneeIds: p.multi_assignee_id || [],
            tasks: projectTasks || [],
            progress: p.progress || 0,
            deadline: p.deadline ? parseISO(p.deadline) : undefined,
          };
        })
        .filter((project: ProcessedProject) => {
          // Filter projects that are active during this week
          const hasEndDate = project.startDate.getTime() !== project.endDate.getTime();
          
          if (!hasEndDate) {
            // For ongoing projects (no end date), include if start date is before or during this week
            return project.startDate <= thisWeekEnd;
          } else {
            // For projects with end dates, use the existing logic
            return isWithinInterval(thisWeekStart, { start: project.startDate, end: project.endDate }) ||
                   isWithinInterval(thisWeekEnd, { start: project.startDate, end: project.endDate }) ||
                   (project.startDate <= thisWeekStart && project.endDate >= thisWeekEnd);
          }
        });

      setProjects(processedProjects);
      setUsers(departmentUsers || []);
    } catch (error) {
      console.error('Error loading this week projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filter by project status (if any selected)
      if (filters.projectStatuses.length > 0) {
        // Note: We don't have project status in the current data structure
        // This would need to be added to the project data if needed
      }

      // Filter by exclude ongoing projects
      if (filters.excludeOngoingProjects) {
        const hasEndDate = project.startDate.getTime() !== project.endDate.getTime();
        if (!hasEndDate) return false; // Exclude ongoing projects
      }

      // Filter by project assignee (if any selected)
      if (filters.assignees.length > 0) {
        const projectAssigneeId = project.assigneeId || 'unassigned';
        if (!filters.assignees.includes(projectAssigneeId)) return false;
      }

      // Filter tasks within the project
      const filteredTasks = project.tasks.filter(task => {
        // Filter by task status (if any selected)
        if (filters.taskStatuses.length > 0 && !filters.taskStatuses.includes(task.status)) {
          return false;
        }

        // Filter by task assignee (if any selected)
        if (filters.assignees.length > 0) {
          const taskAssigneeId = task.assigneeId || 'unassigned';
          if (!filters.assignees.includes(taskAssigneeId)) {
            return false;
          }
        }

        return true;
      });

      // If we're filtering tasks and this project has no matching tasks, hide it
      if ((filters.taskStatuses.length > 0 || filters.assignees.length > 0) && filteredTasks.length === 0) {
        return false;
      }

      return true;
    }).map(project => ({
      ...project,
      tasks: project.tasks.filter(task => {
        // Apply task filters
        if (filters.taskStatuses.length > 0 && !filters.taskStatuses.includes(task.status)) {
          return false;
        }

        if (filters.assignees.length > 0) {
          const taskAssigneeId = task.assigneeId || 'unassigned';
          if (!filters.assignees.includes(taskAssigneeId)) {
            return false;
          }
        }

        return true;
      })
    }));
  }, [projects, filters]);

  // Modal handlers
  const handleProjectNameClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectDetailsModal(true);
    
    if (onProjectNameClick) {
      onProjectNameClick(projectId);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailsModal(true);
    
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  const handleCloseProjectModalAndReload = async () => {
    setShowProjectDetailsModal(false);
    setSelectedProjectId(null);
    await loadThisWeekProjects();
    // Trigger parent refresh
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleCloseTaskModalAndReload = async () => {
    setShowTaskDetailsModal(false);
    setSelectedTaskId(null);
    await loadThisWeekProjects();
    // Trigger parent refresh
    if (onModalClose) {
      onModalClose();
    }
  };

  // Updates modal handlers
  const handleProjectUpdatesClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setUpdatesEntityType('project');
      setUpdatesEntityId(projectId);
      setUpdatesEntityName(project.name);
      setShowUpdatesModal(true);
    }
  };

  const handleTaskUpdatesClick = (taskId: string) => {
    // Find the task across all projects
    let taskName = '';
    for (const project of projects) {
      const task = project.tasks.find(t => t.id === taskId);
      if (task) {
        taskName = task.name;
        break;
      }
    }
    
    if (taskName) {
      setUpdatesEntityType('task');
      setUpdatesEntityId(taskId);
      setUpdatesEntityName(taskName);
      setShowUpdatesModal(true);
    }
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
    setUpdatesEntityId('');
    setUpdatesEntityName('');
  };

  // Toggle project expansion
  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Get assignee user for a project
  const getAssigneeUser = (project: ProcessedProject): User | null => {
    if (!project.assigneeId) return null;
    return users.find(user => user.id === project.assigneeId) || null;
  };

  // Calculate project duration and format dates
  const getProjectTimeInfo = (project: ProcessedProject) => {
    const startDate = format(project.startDate, 'EEE MMM d, yyyy');
    const hasEndDate = project.startDate.getTime() !== project.endDate.getTime();
    const endDate = hasEndDate ? format(project.endDate, 'EEE MMM d, yyyy') : null;
    
    let totalDays = 0;
    let daysRemaining = 0;
    
    if (hasEndDate) {
      totalDays = differenceInDays(project.endDate, project.startDate) + 1; // +1 to include both start and end days
      daysRemaining = differenceInDays(project.endDate, today);
      
      // If the project has ended (negative days remaining), set to 0
      if (daysRemaining < 0) {
        daysRemaining = 0;
      }
    }
    
    return {
      startDate,
      endDate,
      hasEndDate,
      totalDays,
      daysRemaining,
      isOngoing: !hasEndDate,
      isOverdue: hasEndDate && daysRemaining === 0 && project.endDate < today
    };
  };


  if (loading) {
    return (
      <div 
        style={{ 
          backgroundColor: brandTheme.background.primary, 
          borderRadius: '8px', 
          border: `1px solid ${brandTheme.border.light}`,
          overflow: 'hidden'
        }}
      >
        <div 
          className="p-4"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center">
            <Calendar size={18} className="mr-2" style={{ color: 'white' }} />
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'white' }}
            >
              This Week's Focus
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mr-3" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading this week's focus...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        backgroundColor: brandTheme.background.primary, 
        borderRadius: '8px', 
        border: `1px solid ${brandTheme.border.light}`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer p-4"
        style={{ backgroundColor: brandTheme.primary.navy }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown size={20} style={{ color: 'white' }} />
          ) : (
            <ChevronRight size={20} style={{ color: 'white' }} />
          )}
          <Calendar size={18} className="mx-2" style={{ color: 'white' }} />
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'white' }}
          >
            This Week's Focus
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <span 
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {filteredProjects.length} active project{filteredProjects.length !== 1 ? 's' : ''}
          </span>
          <FilterButton
            users={users}
            currentFilters={filters}
            onFiltersChange={setFilters}
          />
          <span 
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {filteredProjects.length === 0 ? (
            <div 
              className="text-center py-6 rounded-lg border-2 border-dashed"
              style={{ 
                backgroundColor: brandTheme.background.secondary,
                borderColor: brandTheme.border.light
              }}
            >
              <Calendar size={32} className="mx-auto mb-2 opacity-50" style={{ color: brandTheme.text.muted }} />
              <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                No active projects this week.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const assigneeUser = getAssigneeUser(project);
                const timeInfo = getProjectTimeInfo(project);
                const isProjectExpanded = expandedProjects.has(project.id);

                return (
                  <div 
                    key={project.id}
                    className="rounded-lg border"
                    style={{ 
                      backgroundColor: brandTheme.background.secondary,
                      borderColor: brandTheme.border.light
                    }}
                  >
                    {/* Project Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleProjectExpansion(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Expand/Collapse Icon */}
                          {isProjectExpanded ? (
                            <ChevronDown size={18} className="mr-2 flex-shrink-0" style={{ color: brandTheme.text.secondary }} />
                          ) : (
                            <ChevronRight size={18} className="mr-2 flex-shrink-0" style={{ color: brandTheme.text.secondary }} />
                          )}
                          
                          <span 
                            className="font-semibold text-lg mr-3 hover:underline"
                            style={{ color: brandTheme.primary.navy }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectNameClick(project.id);
                            }}
                          >
                            {project.name}
                          </span>
                          {assigneeUser && (
                            <div className="flex items-center mr-2" title={`Project Assignee: ${assigneeUser.firstName} ${assigneeUser.lastName}`}>
                              <UserAvatar user={assigneeUser} size="sm" />
                            </div>
                          )}
                          
                          {/* Project Update Icon */}
                          {_getUpdatesCountsForProject && (
                            <div className="mr-2">
                              <ProjectUpdateIcon
                                projectId={project.id}
                                unreadCount={_getUpdatesCountsForProject(project.id).unreadCount}
                                totalCount={_getUpdatesCountsForProject(project.id).totalCount}
                                onClick={handleProjectUpdatesClick}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Progress Badge and Task Count */}
                        <div className="flex items-center space-x-2">
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: brandTheme.gray[200],
                              color: brandTheme.text.muted 
                            }}
                          >
                            {project.tasks.filter(task => task.status === 'done').length}/{project.tasks.length} Task{project.tasks.length !== 1 ? 's' : ''} Done
                          </span>
                          <span 
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: project.progress === 100 ? brandTheme.status.success : 
                                             project.progress >= 75 ? '#65A30D' :
                                             project.progress >= 50 ? '#CA8A04' :
                                             project.progress >= 25 ? '#D97706' : '#DC2626',
                              color: brandTheme.background.primary
                            }}
                          >
                            {project.progress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isProjectExpanded && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: brandTheme.border.light }}>
                        {/* Project Timeline Info */}
                        <div className="flex items-center space-x-4 text-sm mb-3 pt-3" style={{ color: brandTheme.text.secondary }}>
                          <span>
                            <strong>Start:</strong> {timeInfo.startDate}
                          </span>
                          <span>
                            <strong>End:</strong> {timeInfo.isOngoing ? 'Ongoing' : timeInfo.endDate}
                          </span>
                          {!timeInfo.isOngoing && (
                            <span>
                              <strong>Duration:</strong> {timeInfo.totalDays} day{timeInfo.totalDays !== 1 ? 's' : ''}
                            </span>
                          )}
                          {!timeInfo.isOngoing && (
                            <span style={{ 
                              color: timeInfo.isOverdue ? brandTheme.status.error : 
                                     timeInfo.daysRemaining <= 3 ? brandTheme.status.warning : 
                                     brandTheme.text.secondary 
                            }}>
                              <strong>Days Remaining:</strong> {timeInfo.isOverdue ? 'Overdue' : `${timeInfo.daysRemaining} day${timeInfo.daysRemaining !== 1 ? 's' : ''}`}
                            </span>
                          )}
                        </div>

                        {/* Project Tasks */}
                        {project.tasks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2" style={{ color: brandTheme.text.secondary }}>
                              Tasks ({project.tasks.length}):
                            </h4>
                            <div className="space-y-2">
                              {project.tasks.map((task) => {
                                const taskAssignee = users.find(user => user.id === task.assigneeId);
                                
                                return (
                                  <div 
                                    key={task.id}
                                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50"
                                    style={{ backgroundColor: brandTheme.background.primary }}
                                    onClick={() => handleTaskClick(task.id)}
                                  >
                                    <div className="flex items-center flex-1">
                                      {/* Task Status Indicator */}
                                      <div 
                                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                        style={{ 
                                          backgroundColor: task.status === 'done' ? brandTheme.status.success :
                                                         task.status === 'in-progress' ? brandTheme.status.warning :
                                                         task.status === 'todo' ? brandTheme.gray[400] :
                                                         brandTheme.gray[400]
                                        }}
                                      />
                                      
                                      {/* Task Name */}
                                      <span 
                                        className="font-medium text-sm mr-2"
                                        style={{ color: brandTheme.text.primary }}
                                      >
                                        {task.name}
                                      </span>
                                    </div>

                                <div className="flex items-center space-x-2">
                                  {/* Task Update Icon */}
                                  {_getTaskUpdatesCount && (
                                    <TaskUpdateIcon
                                      taskId={task.id}
                                      unreadCount={_getTaskUpdatesCount(task.id).unreadCount}
                                      totalCount={_getTaskUpdatesCount(task.id).totalCount}
                                      onClick={handleTaskUpdatesClick}
                                    />
                                  )}
                                  
                                  {/* Task Assignee or Unassigned Badge */}
                                  {taskAssignee ? (
                                    <div 
                                      className="flex items-center" 
                                      title={`Assigned to: ${taskAssignee.firstName} ${taskAssignee.lastName}`}
                                    >
                                      <UserAvatar user={taskAssignee} size="xs" />
                                    </div>
                                  ) : (
                                    <span 
                                      className="text-xs px-2 py-1 rounded"
                                      style={{ 
                                        backgroundColor: brandTheme.gray[200],
                                        color: brandTheme.text.muted 
                                      }}
                                    >
                                      Unassigned
                                    </span>
                                  )}
                                
                                  {/* Task Status Text */}
                                  <span 
                                    className="text-xs px-2 py-1 rounded capitalize"
                                    style={{ 
                                      backgroundColor: task.status === 'done' ? brandTheme.status.success + '20' :
                                                     task.status === 'in-progress' ? brandTheme.status.warning + '20' :
                                                     task.status === 'todo' ? brandTheme.gray[200] :
                                                     brandTheme.gray[100],
                                      color: task.status === 'done' ? brandTheme.status.success :
                                            task.status === 'in-progress' ? brandTheme.status.warning :
                                            task.status === 'todo' ? brandTheme.gray[600] :
                                            brandTheme.text.muted
                                    }}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* No Tasks Message */}
                        {project.tasks.length === 0 && (
                          <div className="text-center py-3" style={{ color: brandTheme.text.muted }}>
                            <span className="text-sm">No tasks assigned to this project</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProjectId && (
        <ProjectDetailsModal
          projectId={selectedProjectId}
          isOpen={showProjectDetailsModal}
          onClose={handleCloseProjectModalAndReload}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          isOpen={showTaskDetailsModal}
          onClose={handleCloseTaskModalAndReload}
        />
      )}

      {/* Updates Details Modal */}
      {showUpdatesModal && updatesEntityId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType={updatesEntityType}
          entityId={updatesEntityId}
          entityName={updatesEntityName}
          showAllProjectUpdates={updatesEntityType === 'project'}
        />
      )}
    </div>
  );
};

export default ThisWeekFocus;

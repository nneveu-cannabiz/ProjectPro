import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../styles/brandTheme';
import { User, Task } from '../../../../types';
import UserHeader from './utils/User Bar/UserHeader';
import DateWeekHeaderRow from './utils/User Bar/DateWeekHeaderRow';
import UserRow from './utils/User Bar/UserRow';
import { getUserProjects } from './utils/New Project Bar/utils/userProjectFiltering';
import ProjectDetailsModal from './utils/Profiles/ProjectDetailsModal';
import TaskDetailsModal from './utils/Profiles/TaskDetailsModal';
import { fetchUsersByDepartment, fetchFlowChartProjects, fetchTasks } from '../../../../data/supabase-store';
import { getCurrentDay } from './utils/dateUtils';
import { parseISO } from 'date-fns';

export interface ProjectUserWeekChartProps {
  selectedDepartment?: string;
  selectedView?: string;
  currentDates: Date[];
  onProjectNameClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  getUpdatesCountsForProject?: (projectId: string) => { totalCount: number; unreadCount: number };
}

const ProjectUserWeekChart: React.FC<ProjectUserWeekChartProps> = ({
  selectedDepartment = 'Product Development',
  currentDates,
  onProjectNameClick,
  onTaskClick,
  onUpdatesClick,
  onTaskUpdatesClick,
  getTaskUpdatesCount,
  getUpdatesCountsForProject
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Calculate date range
  const today = getCurrentDay();
  const weekStart = currentDates[0];
  const weekEnd = currentDates[currentDates.length - 1];

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users for the department
      const departmentUsers = await fetchUsersByDepartment(selectedDepartment);
      
      // Load projects that are in the flow chart
      const flowChartProjects = await fetchFlowChartProjects(selectedDepartment);
      
      // Load all tasks (need all tasks to filter by project)
      const allTasks = await fetchTasks();
      
      console.log('ProjectUserWeekChart - Raw data loaded:', {
        users: departmentUsers?.length || 0,
        rawProjects: flowChartProjects?.length || 0,
        allTasks: allTasks?.length || 0,
        selectedDepartment
      });

      // Process projects similar to FlowChartContainer
      const processedProjects = (flowChartProjects || [])
        .filter((p: any) => p.start_date) // Only projects with start dates
        .map((p: any) => {
          // Get tasks for this project
          const projectTasks = allTasks.filter(task => task.projectId === p.id);
          
          return {
            id: p.id,
            name: p.name,
            startDate: parseISO(p.start_date),
            endDate: p.end_date ? parseISO(p.end_date) : parseISO(p.start_date), // Use start_date as end_date if no end_date provided
            assigneeId: p.assignee_id || null,
            multiAssigneeIds: p.multi_assignee_id || [],
            tasks: projectTasks || [], // Ensure tasks is always an array
            progress: p.progress || 0,
            deadline: p.deadline ? parseISO(p.deadline) : undefined,
          };
        });

      console.log('ProjectUserWeekChart - Processed data:', {
        users: departmentUsers?.length || 0,
        processedProjects: processedProjects?.length || 0,
        tasksTotal: allTasks?.length || 0,
        sampleProject: processedProjects?.[0] || null
      });

      setUsers(departmentUsers || []);
      setProjects(processedProjects || []);
      setTasks(allTasks || []);
    } catch (error) {
      console.error('Error loading flow chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment]);

  // Toggle user expansion
  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Modal handlers
  const handleProjectNameClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectDetailsModal(true);
    
    // Also call the optional external handler
    if (onProjectNameClick) {
      onProjectNameClick(projectId);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailsModal(true);
    
    // Also call the optional external handler
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };


  // Reload data when modals close to reflect any changes
  const handleCloseProjectModalAndReload = async () => {
    setShowProjectDetailsModal(false);
    setSelectedProjectId(null);
    // Reload data to reflect any changes made in the modal
    await loadData();
  };

  const handleCloseTaskModalAndReload = async () => {
    setShowTaskDetailsModal(false);
    setSelectedTaskId(null);
    // Reload data to reflect any changes made in the modal
    await loadData();
  };

  // getUserProjects function is now in utils/userProjectFiltering.ts

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center py-8"
        style={{ color: brandTheme.text.muted }}
      >
        Loading flow chart...
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        border: `1px solid ${brandTheme.border.light}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Main Content */}
      <div className="flex-1">
        {users.map((user) => {
          const isExpanded = expandedUsers.has(user.id) || expandedUsers.size === 0; // Expand all by default
          const userProjects = getUserProjects(user, projects, tasks);
          
          return (
            <div key={user.id} className="border-b" style={{ borderBottomColor: brandTheme.border.light }}>
              {/* User Header */}
              <UserHeader
                user={user}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleUserExpansion(user.id)}
              />
              
              {/* Date Header Row */}
              {isExpanded && (
                <DateWeekHeaderRow
                  dates={currentDates}
                  today={today}
                />
              )}
              
              {/* User Projects Row */}
              {isExpanded && (
                <UserRow
                  user={user}
                  projects={userProjects}
                  today={today}
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  onProjectNameClick={handleProjectNameClick}
                  onTaskClick={handleTaskClick}
                  onUpdatesClick={onUpdatesClick}
                  onTaskUpdatesClick={onTaskUpdatesClick}
                  getTaskUpdatesCount={getTaskUpdatesCount}
                  getUpdatesCountsForProject={getUpdatesCountsForProject}
                  users={users}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div 
          className="flex items-center justify-center py-12"
          style={{ 
            color: brandTheme.text.muted,
            fontSize: '16px'
          }}
        >
          No team members found for {selectedDepartment}
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
    </div>
  );
};

export default ProjectUserWeekChart;

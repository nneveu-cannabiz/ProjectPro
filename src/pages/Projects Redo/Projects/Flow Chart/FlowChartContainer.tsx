import React, { useEffect, useState, useRef } from 'react';
import { parseISO } from 'date-fns';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import { fetchUsersByDepartment, fetchFlowChartProjects, updateProjectAssignee, fetchTasks } from '../../../../data/supabase-store';
import { User, Task } from '../../../../types';
import { useAppContext } from '../../../../context/AppContext';
import { useAuth } from '../../../../context/AuthContext';
import PageChange from './Filters/PageChange';
import ProjectBar from './utils/Project Bar/projectbar';
import ProjectDetailsModal from './utils/ProjectDetailsModal';
import TaskDetailsModal from './utils/TaskDetailsModal';
import UpdatesDetailsModal from './utils/UpdatesDetailsModal';
import { calculateRowHeight } from './utils/heightUtils';
import { 
  generateWorkDates, 
  getCurrentDay, 
  getDateRangeLabel, 
  addWorkDays,
  formatDate,
  formatDayName,
  isToday,
  isWeekendDay
} from './utils/dateUtils';

interface FlowProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string | null;
  tasks?: Task[];
  progress?: number;
  deadline?: Date;
}

interface StackedProject {
  project: FlowProject;
  stackLevel: number;
}

// Helper function to check if two projects overlap in time
const projectsOverlap = (project1: FlowProject, project2: FlowProject): boolean => {
  return project1.startDate < project2.endDate && project2.startDate < project1.endDate;
};

// Calculate stacking positions for projects to avoid overlaps
// Projects with the same assignee will be stacked vertically regardless of time overlap
const calculateProjectStacking = (projects: FlowProject[], weekStart: Date, weekEnd: Date): StackedProject[] => {
  if (projects.length === 0) return [];
  
  // Filter projects that are visible in the current week
  const visibleProjects = projects.filter(project => 
    project.endDate >= weekStart && project.startDate <= weekEnd
  );
  
  // Sort projects by start date, then by end date
  const sortedProjects = [...visibleProjects].sort((a, b) => {
    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    return a.endDate.getTime() - b.endDate.getTime();
  });
  
  const stackedProjects: StackedProject[] = [];
  // Track the highest stack level used for each assignee
  const assigneeStackLevels: Map<string, number> = new Map();
  
  for (const project of sortedProjects) {
    let stackLevel = 0;
    let foundLevel = false;
    
    // If this project has an assignee, ensure it stacks below other projects with the same assignee
    if (project.assigneeId) {
      const lastAssigneeLevel = assigneeStackLevels.get(project.assigneeId);
      if (lastAssigneeLevel !== undefined) {
        // Start checking from the level after the last project with this assignee
        stackLevel = lastAssigneeLevel + 1;
      }
    }
    
    // Find the lowest stack level where this project doesn't overlap with others
    while (!foundLevel) {
      const projectsAtLevel = stackedProjects.filter(sp => sp.stackLevel === stackLevel);
      const hasOverlap = projectsAtLevel.some(sp => projectsOverlap(project, sp.project));
      
      if (!hasOverlap) {
        foundLevel = true;
      } else {
        stackLevel++;
      }
    }
    
    // Update the highest stack level for this assignee
    if (project.assigneeId) {
      assigneeStackLevels.set(project.assigneeId, stackLevel);
    }
    
    stackedProjects.push({ project, stackLevel });
  }
  
  return stackedProjects;
};



const FlowChartContainer: React.FC = () => {
  const { getUpdatesForEntity } = useAppContext();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDates, setCurrentDates] = useState<Date[]>([]);
  const [currentStartDate, setCurrentStartDate] = useState<Date>(getCurrentDay());
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null);
  const [assigningProject, setAssigningProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [selectedUpdatesProjectId, setSelectedUpdatesProjectId] = useState<string | null>(null);
  const [showTaskUpdatesModal, setShowTaskUpdatesModal] = useState(false);
  const [selectedUpdatesTaskId, setSelectedUpdatesTaskId] = useState<string | null>(null);
  
  // Refs for scroll synchronization
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const departmentUsers = await fetchUsersByDepartment('Product Development');
      setUsers(departmentUsers);

      // Load projects that are in the Product Development flow chart
      const flowChartProjects = await fetchFlowChartProjects('Product Development');
      
      // Load all tasks
      const allTasks = await fetchTasks();
      
      const parsedProjects: FlowProject[] = (flowChartProjects || [])
        .filter((p: any) => p.start_date && p.end_date)
        .map((p: any) => {
          // Get tasks for this project
          const projectTasks = allTasks.filter(task => task.projectId === p.id);
          
          return {
            id: p.id,
            name: p.name,
            startDate: parseISO(p.start_date),
            endDate: parseISO(p.end_date),
            assigneeId: p.assignee_id || null,
            tasks: projectTasks,
            progress: p.progress || 0,
            deadline: p.deadline ? parseISO(p.deadline) : undefined,
          };
        });
      setProjects(parsedProjects);
    } catch (error) {
      console.error('Error loading flow chart data:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Generate work dates based on current start date
    const workDates = generateWorkDates(currentStartDate);
    setCurrentDates(workDates);
  }, [currentStartDate]);

  const handlePreviousDay = () => {
    const previousDay = addWorkDays(currentStartDate, -1);
    setCurrentStartDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = addWorkDays(currentStartDate, 1);
    setCurrentStartDate(nextDay);
  };

  const isCurrentDay = () => {
    const today = getCurrentDay();
    return currentStartDate.toDateString() === today.toDateString();
  };

  const handleJumpToCurrentDay = () => {
    const today = getCurrentDay();
    setCurrentStartDate(today);
  };

  // Scroll synchronization functions
  const syncScrollLeft = (scrollLeft: number) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollLeft = scrollLeft;
    }
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleDateScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleScrollLeft = () => {
    const scrollAmount = 120; // Width of one work day column
    const currentScroll = contentScrollRef.current?.scrollLeft || 0;
    syncScrollLeft(Math.max(0, currentScroll - scrollAmount));
  };

  const handleScrollRight = () => {
    const scrollAmount = 120; // Width of one work day column
    const currentScroll = contentScrollRef.current?.scrollLeft || 0;
    syncScrollLeft(currentScroll + scrollAmount);
  };

  const handleRefresh = async () => {
    await loadData(true);
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const handleProjectClick = (project: FlowProject) => {
    setSelectedProject(project);
    setShowAssignModal(true);
  };

  const handleProjectNameClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectDetailsModal(true);
  };

  const handleCloseProjectDetailsModal = () => {
    setShowProjectDetailsModal(false);
    setSelectedProjectId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailsModal(true);
  };

  const handleCloseTaskDetailsModal = () => {
    setShowTaskDetailsModal(false);
    setSelectedTaskId(null);
  };

  const handleAssignProject = async (userId: string) => {
    if (!selectedProject) return;

    setAssigningProject(true);
    try {
      await updateProjectAssignee(selectedProject.id, userId);
      
      // Refresh data to reflect the assignment
      await loadData(true);
      
      setShowAssignModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error assigning project:', error);
    } finally {
      setAssigningProject(false);
    }
  };

  const handleUpdatesClick = (projectId: string) => {
    setSelectedUpdatesProjectId(projectId);
    setShowUpdatesModal(true);
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
    setSelectedUpdatesProjectId(null);
  };

  const handleTaskUpdatesClick = (taskId: string) => {
    setSelectedUpdatesTaskId(taskId);
    setShowTaskUpdatesModal(true);
  };

  const handleCloseTaskUpdatesModal = () => {
    setShowTaskUpdatesModal(false);
    setSelectedUpdatesTaskId(null);
  };

  // Helper function to get updates counts for a project
  const getUpdatesCountsForProject = (projectId: string) => {
    const updates = getUpdatesForEntity('project', projectId);
    const totalCount = updates.length;
    const unreadCount = currentUser ? 
      updates.filter(update => !update.isReadBy?.includes(currentUser.id)).length : 0;
    
    return { totalCount, unreadCount };
  };

  // Helper function to get updates counts for a task
  const getUpdatesCountsForTask = (taskId: string) => {
    const updates = getUpdatesForEntity('task', taskId);
    const totalCount = updates.length;
    const unreadCount = currentUser ? 
      updates.filter(update => !update.isReadBy?.includes(currentUser.id)).length : 0;
    
    return { totalCount, unreadCount };
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading flow chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
             {/* Header */}
       <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
         <div className="flex items-center justify-between">
           <div>
             <h2 
               className="text-2xl font-bold"
               style={{ color: brandTheme.primary.navy }}
             >
               Product Development Flow Chart
             </h2>
             <p style={{ color: brandTheme.text.muted }}>
               Team workload and project timeline view
             </p>
           </div>
           
           <div className="flex items-center space-x-4">
             {/* Horizontal Scroll Controls */}
             <div className="flex items-center space-x-2">
               <button
                 onClick={handleScrollLeft}
                 className="p-2 rounded-lg border transition-colors hover:bg-gray-50"
                 style={{
                   borderColor: brandTheme.border.light,
                   color: brandTheme.text.primary,
                   backgroundColor: brandTheme.background.primary
                 }}
                 title="Scroll left"
               >
                 <ChevronLeft size={18} />
               </button>
               <button
                 onClick={handleScrollRight}
                 className="p-2 rounded-lg border transition-colors hover:bg-gray-50"
                 style={{
                   borderColor: brandTheme.border.light,
                   color: brandTheme.text.primary,
                   backgroundColor: brandTheme.background.primary
                 }}
                 title="Scroll right"
               >
                 <ChevronRight size={18} />
               </button>
             </div>
             
             {/* Refresh Button */}
             <button
               onClick={handleRefresh}
               disabled={refreshing || loading}
               className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
                 refreshing ? 'cursor-not-allowed' : 'hover:bg-gray-50'
               }`}
               style={{
                 borderColor: brandTheme.border.light,
                 color: brandTheme.text.primary,
                 backgroundColor: brandTheme.background.primary
               }}
               title="Refresh data"
             >
               <RefreshCw 
                 size={18} 
                 className={refreshing ? 'animate-spin' : ''}
                 style={{ color: brandTheme.text.primary }}
               />
             </button>
             
                         {/* Page Change Navigation */}
            <PageChange
             onPreviousWeek={handlePreviousDay}
             onNextWeek={handleNextDay}
             onJumpToCurrentWeek={handleJumpToCurrentDay}
             currentWeekLabel={getDateRangeLabel(currentStartDate)}
             canGoPrevious={true}
             canGoNext={true}
             isCurrentWeek={isCurrentDay()}
           />
           </div>
         </div>
       </div>

      {/* Flow Chart Container */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Date Headers Row */}
        <div className="flex border-b" style={{ borderColor: brandTheme.border.light }}>
                     {/* User Names Column Header */}
           <div 
             className="w-64 p-6 border-r flex-shrink-0"
             style={{ 
               backgroundColor: brandTheme.background.primary,
               borderColor: brandTheme.border.light
             }}
           >
             <h3 
               className="font-semibold text-lg"
               style={{ color: brandTheme.text.primary }}
             >
               Team Members
             </h3>
           </div>

                     {/* Scrollable Date Headers */}
           <div 
             ref={dateScrollRef}
             className="flex-1 overflow-x-auto" 
             id="date-scroll-container"
             onScroll={handleDateScroll}
           >
             <div className="flex" style={{ minWidth: 'max-content' }}>
               {currentDates.map((date, index) => {
                 const isWeekend = isWeekendDay(date);
                 return (
                   <div
                     key={index}
                     className={`p-4 border-r flex-shrink-0 text-center ${
                       isWeekend ? 'w-12' : 'flex-1'
                     }`}
                                         style={{
                      backgroundColor: isToday(date) 
                        ? brandTheme.primary.paleBlue 
                        : isWeekend 
                        ? '#f3f4f6'
                        : brandTheme.background.primary,
                      borderColor: brandTheme.border.light,
                      minWidth: isWeekend ? '48px' : '120px'
                    }}
                   >
                     <div 
                       className="font-semibold text-base"
                       style={{ color: isWeekend ? brandTheme.text.muted : brandTheme.text.primary }}
                     >
                       {isWeekend ? 'S' : formatDayName(date)}
                     </div>
                     {!isWeekend && (
                       <div 
                         className="text-sm mt-1"
                         style={{ color: brandTheme.text.muted }}
                       >
                         {formatDate(date)}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        </div>

        {/* User Rows */}
        <div className="flex flex-1 min-h-0">
          {/* User Names Column */}
          <div 
            className="w-64 border-r flex-shrink-0"
            style={{ 
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.light
            }}
          >
            {users.length === 0 ? (
              <div className="p-4 text-center">
                <p style={{ color: brandTheme.text.muted }}>
                  No users assigned to Product Development
                </p>
              </div>
            ) : (
              users.map((user) => {
                const userProjects = projects.filter(project => project.assigneeId === user.id);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                const baseRowHeight = calculateRowHeight(userProjects, dateRangeStart, dateRangeEnd, stackedProjects);
                const rowHeight = baseRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                <div
                  key={user.id}
                  className="border-b flex items-center p-6"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    height: `${rowHeight}px`,
                    minHeight: '96px'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                    style={{ backgroundColor: user.profileColor || brandTheme.primary.navy }}
                  >
                    {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div 
                      className="font-medium text-lg"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {getUserDisplayName(user)}
                    </div>
                  </div>
                </div>
                );
              })
            )}
            
            {/* Unassigned Projects Row */}
            {(() => {
              const unassignedProjects = projects.filter(project => !project.assigneeId);
              const dateRangeStart = currentDates[0];
              const dateRangeEnd = currentDates[currentDates.length - 1];
              const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
              const baseUnassignedRowHeight = calculateRowHeight(unassignedProjects, dateRangeStart, dateRangeEnd, stackedUnassignedProjects);
              const unassignedRowHeight = baseUnassignedRowHeight + 16; // Add 8px buffer on top and bottom
              
              return (
                <div
                  className="border-b flex items-center p-6"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    height: `${unassignedRowHeight}px`,
                    minHeight: '96px'
                  }}
                >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                style={{ backgroundColor: brandTheme.secondary.slate }}
              >
                U
              </div>
              <div>
                <div 
                  className="font-medium text-lg"
                  style={{ color: brandTheme.text.primary }}
                >
                  Unassigned Projects
                </div>
              </div>
            </div>
            );
            })()}
          </div>

          {/* Scrollable Content Area */}
          <div 
            ref={contentScrollRef}
            className="flex-1 overflow-x-auto overflow-y-auto" 
            id="content-scroll-container"
            onScroll={handleContentScroll}
          >
            <div style={{ minWidth: 'max-content', height: 'max-content' }}>
              {/* User Rows */}
              {users.map((user) => {
                const userProjects = projects.filter(project => project.assigneeId === user.id);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                const baseRowHeight = calculateRowHeight(userProjects, dateRangeStart, dateRangeEnd, stackedProjects);
                const rowHeight = baseRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                <div 
                  key={user.id} 
                  className="relative border-b"
                  style={{ 
                    borderColor: brandTheme.border.light, 
                    overflow: 'visible',
                    height: `${rowHeight}px`,
                    minHeight: '96px'
                  }}
                >
                  {/* Background day columns */}
                  <div className="absolute inset-0 flex">
                    {currentDates.map((date, idx) => {
                      const isWeekend = isWeekendDay(date);
                      return (
                        <div
                          key={idx}
                          className={`border-r ${isWeekend ? 'w-12' : 'flex-1'}`}
                          style={{
                            backgroundColor: isToday(date) 
                              ? brandTheme.primary.paleBlue 
                              : isWeekend 
                              ? '#f3f4f6'
                              : brandTheme.background.secondary,
                            borderColor: brandTheme.border.light,
                            minWidth: isWeekend ? '48px' : '120px'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Project bars for this user - positioned over the entire row */}
                  <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                    {(() => {
                      const dateRangeStart = currentDates[0];
                      const dateRangeEnd = currentDates[currentDates.length - 1];
                      const today = new Date();
                      
                      // Filter projects assigned to this user
                      const userProjects = projects.filter(project => project.assigneeId === user.id);
                      
                      // Calculate stacking positions to avoid overlaps
                      const stackedProjects = calculateProjectStacking(userProjects, dateRangeStart, dateRangeEnd);
                      
                      return stackedProjects.map((stackedProject) => {
                        const { totalCount, unreadCount } = getUpdatesCountsForProject(stackedProject.project.id);
                        
                        return (
                          <ProjectBar
                            key={stackedProject.project.id}
                            projectId={stackedProject.project.id}
                            projectName={stackedProject.project.name}
                            weekStart={dateRangeStart}
                            weekEnd={dateRangeEnd}
                            projectStart={stackedProject.project.startDate}
                            projectEnd={stackedProject.project.endDate}
                            projectDeadline={stackedProject.project.deadline}
                            projectProgress={stackedProject.project.progress}
                            projectTasks={stackedProject.project.tasks}
                            today={today}
                            barHeightPx={48} // Smaller height to allow more stacking
                            stackLevel={stackedProject.stackLevel}
                            onProjectNameClick={handleProjectNameClick}
                            onTaskClick={handleTaskClick}
                            onUpdatesClick={handleUpdatesClick}
                            onTaskUpdatesClick={handleTaskUpdatesClick}
                            getTaskUpdatesCount={getUpdatesCountsForTask}
                            unreadUpdatesCount={unreadCount}
                            totalUpdatesCount={totalCount}
                          />
                        );
                      });
                    })()}
                  </div>
                </div>
                );
              })}
              
              {/* Unassigned Projects Row */}
              {(() => {
                const unassignedProjects = projects.filter(project => !project.assigneeId);
                const dateRangeStart = currentDates[0];
                const dateRangeEnd = currentDates[currentDates.length - 1];
                const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
                const baseUnassignedRowHeight = calculateRowHeight(unassignedProjects, dateRangeStart, dateRangeEnd, stackedUnassignedProjects);
                const unassignedRowHeight = baseUnassignedRowHeight + 16; // Add 8px buffer on top and bottom
                
                return (
                  <div 
                    className="relative border-b"
                    style={{ 
                      borderColor: brandTheme.border.light, 
                      overflow: 'visible',
                      height: `${unassignedRowHeight}px`,
                      minHeight: '96px'
                    }}
                  >
                {/* Background day columns */}
                <div className="absolute inset-0 flex">
                  {currentDates.map((date, idx) => {
                    const isWeekend = isWeekendDay(date);
                    return (
                      <div
                        key={idx}
                        className={`border-r ${isWeekend ? 'w-12' : 'flex-1'}`}
                        style={{
                          backgroundColor: isToday(date) 
                            ? brandTheme.primary.paleBlue 
                            : isWeekend 
                            ? '#f3f4f6'
                            : brandTheme.background.secondary,
                          borderColor: brandTheme.border.light,
                          minWidth: isWeekend ? '48px' : '120px'
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Project bars for unassigned projects - positioned over the entire row */}
                <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                  {(() => {
                    const dateRangeStart = currentDates[0];
                    const dateRangeEnd = currentDates[currentDates.length - 1];
                    const today = new Date();
                    
                    // Only show projects without an assignee
                    const unassignedProjects = projects.filter(project => !project.assigneeId);
                    
                    // Calculate stacking positions to avoid overlaps
                    const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, dateRangeStart, dateRangeEnd);
                    
                    return stackedUnassignedProjects.map((stackedProject) => {
                      const { totalCount, unreadCount } = getUpdatesCountsForProject(stackedProject.project.id);
                      
                      return (
                        <ProjectBar
                          key={stackedProject.project.id}
                          projectId={stackedProject.project.id}
                          projectName={stackedProject.project.name}
                          weekStart={dateRangeStart}
                          weekEnd={dateRangeEnd}
                          projectStart={stackedProject.project.startDate}
                          projectEnd={stackedProject.project.endDate}
                          projectDeadline={stackedProject.project.deadline}
                          projectProgress={stackedProject.project.progress}
                          projectTasks={stackedProject.project.tasks}
                          today={today}
                          barHeightPx={48} // Smaller height to allow more stacking
                          stackLevel={stackedProject.stackLevel}
                          isClickable={true}
                          onClick={() => handleProjectClick(stackedProject.project)}
                          onProjectNameClick={handleProjectNameClick}
                          onTaskClick={handleTaskClick}
                          onUpdatesClick={handleUpdatesClick}
                          onTaskUpdatesClick={handleTaskUpdatesClick}
                          getTaskUpdatesCount={getUpdatesCountsForTask}
                          unreadUpdatesCount={unreadCount}
                          totalUpdatesCount={totalCount}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
              );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: brandTheme.text.primary }}
            >
              Assign Project: {selectedProject.name}
            </h3>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {users.length === 0 ? (
                <p style={{ color: brandTheme.text.muted }}>
                  No users available for assignment.
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssignProject(user.id)}
                    disabled={assigningProject}
                    className="w-full p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                        style={{ backgroundColor: user.profileColor || brandTheme.primary.navy }}
                      >
                        {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{getUserDisplayName(user)}</div>
                        <div 
                          className="text-sm"
                          style={{ color: brandTheme.text.muted }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProject(null);
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                style={{
                  borderColor: brandTheme.border.light,
                  color: brandTheme.text.primary
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProjectId && (
        <ProjectDetailsModal
          isOpen={showProjectDetailsModal}
          onClose={handleCloseProjectDetailsModal}
          projectId={selectedProjectId}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTaskId && (
        <TaskDetailsModal
          isOpen={showTaskDetailsModal}
          onClose={handleCloseTaskDetailsModal}
          taskId={selectedTaskId}
        />
      )}

      {/* Updates Details Modal */}
      {showUpdatesModal && selectedUpdatesProjectId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType="project"
          entityId={selectedUpdatesProjectId}
          entityName={projects.find(p => p.id === selectedUpdatesProjectId)?.name || 'Unknown Project'}
        />
      )}

      {/* Task Updates Details Modal */}
      {showTaskUpdatesModal && selectedUpdatesTaskId && (
        <UpdatesDetailsModal
          isOpen={showTaskUpdatesModal}
          onClose={handleCloseTaskUpdatesModal}
          entityType="task"
          entityId={selectedUpdatesTaskId}
          entityName={(() => {
            // Find the task name from all projects
            for (const project of projects) {
              const task = project.tasks?.find(t => t.id === selectedUpdatesTaskId);
              if (task) return task.name;
            }
            return 'Unknown Task';
          })()}
        />
      )}
    </div>
  );
};

export default FlowChartContainer;

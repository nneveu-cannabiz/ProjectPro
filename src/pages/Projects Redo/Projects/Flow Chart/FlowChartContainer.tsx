import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import { fetchUsersByDepartment, fetchFlowChartProjects, updateProjectAssignee, fetchTasks } from '../../../../data/supabase-store';
import { User, Task } from '../../../../types';
import PageChange from './Filters/PageChange';
import ProjectBar from './utils/Project Bar/projectbar';
import ProjectDetailsModal from './utils/ProjectDetailsModal';
import { calculateRowHeight } from './utils/heightUtils';
import { 
  generateWeekDates, 
  getCurrentWeekMonday, 
  getWeekLabel, 
  addWeeks,
  formatDate,
  formatDayName,
  isToday
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
  
  for (const project of sortedProjects) {
    let stackLevel = 0;
    let foundLevel = false;
    
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
    
    stackedProjects.push({ project, stackLevel });
  }
  
  return stackedProjects;
};



const FlowChartContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekMonday());
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FlowProject | null>(null);
  const [assigningProject, setAssigningProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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
    // Generate week dates based on current week start
    const weekDates = generateWeekDates(currentWeekStart);
    setCurrentWeekDates(weekDates);
  }, [currentWeekStart]);

  const handlePreviousWeek = () => {
    const previousWeek = addWeeks(currentWeekStart, -1);
    setCurrentWeekStart(previousWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(nextWeek);
  };

  const isCurrentWeek = () => {
    const currentWeekMonday = getCurrentWeekMonday();
    return currentWeekStart.toDateString() === currentWeekMonday.toDateString();
  };

  const handleJumpToCurrentWeek = () => {
    const currentWeekMonday = getCurrentWeekMonday();
    setCurrentWeekStart(currentWeekMonday);
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
    // For now, just log the task click - could open a task details modal in the future
    console.log('Task clicked:', taskId);
    // TODO: Implement task details modal or inline editing
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
      className="w-full h-full"
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
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onJumpToCurrentWeek={handleJumpToCurrentWeek}
              currentWeekLabel={getWeekLabel(currentWeekStart)}
              canGoPrevious={!isCurrentWeek()}
              canGoNext={true}
              isCurrentWeek={isCurrentWeek()}
            />
           </div>
         </div>
       </div>

      {/* Flow Chart Container */}
      <div className="flex flex-col h-full">
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
           <div className="flex-1 overflow-x-auto">
             <div className="flex w-full">
               {currentWeekDates.map((date, index) => (
                 <div
                   key={index}
                   className={`flex-1 p-4 border-r flex-shrink-0 text-center ${
                     isToday(date) ? '' : ''
                   }`}
                   style={{
                     backgroundColor: isToday(date) 
                       ? brandTheme.primary.paleBlue 
                       : brandTheme.background.primary,
                     borderColor: brandTheme.border.light
                   }}
                 >
                   <div 
                     className="font-semibold text-base"
                     style={{ color: brandTheme.text.primary }}
                   >
                     {formatDayName(date)}
                   </div>
                   <div 
                     className="text-sm mt-1"
                     style={{ color: brandTheme.text.muted }}
                   >
                     {formatDate(date)}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* User Rows */}
        <div className="flex flex-1 overflow-hidden">
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
                const weekEnd = new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
                const stackedProjects = calculateProjectStacking(userProjects, currentWeekStart, weekEnd);
                const rowHeight = calculateRowHeight(userProjects, currentWeekStart, weekEnd, stackedProjects);
                
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
              const weekEnd = new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
              const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, currentWeekStart, weekEnd);
              const unassignedRowHeight = calculateRowHeight(unassignedProjects, currentWeekStart, weekEnd, stackedUnassignedProjects);
              
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
          <div className="flex-1 overflow-x-auto">
            <div className="w-full">
              {/* User Rows */}
              {users.map((user) => {
                const userProjects = projects.filter(project => project.assigneeId === user.id);
                const weekEnd = new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
                const stackedProjects = calculateProjectStacking(userProjects, currentWeekStart, weekEnd);
                const rowHeight = calculateRowHeight(userProjects, currentWeekStart, weekEnd, stackedProjects);
                
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
                    {currentWeekDates.map((date, idx) => (
                      <div
                        key={idx}
                        className="flex-1 border-r"
                        style={{
                          backgroundColor: isToday(date) 
                            ? brandTheme.primary.paleBlue 
                            : brandTheme.background.secondary,
                          borderColor: brandTheme.border.light
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Project bars for this user - positioned over the entire row */}
                  <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                    {(() => {
                      const weekStart = currentWeekStart;
                      const weekEnd = new Date(currentWeekStart);
                      weekEnd.setDate(weekStart.getDate() + 4); // Friday
                      const today = new Date();
                      
                      // Filter projects assigned to this user
                      const userProjects = projects.filter(project => project.assigneeId === user.id);
                      
                      // Calculate stacking positions to avoid overlaps
                      const stackedProjects = calculateProjectStacking(userProjects, weekStart, weekEnd);
                      
                      return stackedProjects.map((stackedProject) => (
                        <ProjectBar
                          key={stackedProject.project.id}
                          projectId={stackedProject.project.id}
                          projectName={stackedProject.project.name}
                          weekStart={weekStart}
                          weekEnd={weekEnd}
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
                        />
                      ));
                    })()}
                  </div>
                </div>
                );
              })}
              
              {/* Unassigned Projects Row */}
              {(() => {
                const unassignedProjects = projects.filter(project => !project.assigneeId);
                const weekEnd = new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
                const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, currentWeekStart, weekEnd);
                const unassignedRowHeight = calculateRowHeight(unassignedProjects, currentWeekStart, weekEnd, stackedUnassignedProjects);
                
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
                  {currentWeekDates.map((date, idx) => (
                    <div
                      key={idx}
                      className="flex-1 border-r"
                      style={{
                        backgroundColor: isToday(date) 
                          ? brandTheme.primary.paleBlue 
                          : brandTheme.background.secondary,
                        borderColor: brandTheme.border.light
                      }}
                    />
                  ))}
                </div>
                
                {/* Project bars for unassigned projects - positioned over the entire row */}
                <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
                  {(() => {
                    const weekStart = currentWeekStart;
                    const weekEnd = new Date(currentWeekStart);
                    weekEnd.setDate(weekStart.getDate() + 4); // Friday
                    const today = new Date();
                    
                    // Only show projects without an assignee
                    const unassignedProjects = projects.filter(project => !project.assigneeId);
                    
                    // Calculate stacking positions to avoid overlaps
                    const stackedUnassignedProjects = calculateProjectStacking(unassignedProjects, weekStart, weekEnd);
                    
                    return stackedUnassignedProjects.map((stackedProject) => (
                      <ProjectBar
                        key={stackedProject.project.id}
                        projectId={stackedProject.project.id}
                        projectName={stackedProject.project.name}
                        weekStart={weekStart}
                        weekEnd={weekEnd}
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
                      />
                    ));
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
    </div>
  );
};

export default FlowChartContainer;

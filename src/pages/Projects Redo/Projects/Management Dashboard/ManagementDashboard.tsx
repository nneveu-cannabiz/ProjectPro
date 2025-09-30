import React, { useState, useEffect } from 'react';
import { fetchAllUsers, fetchAllTasks } from '../../../../data/supabase-store';
import { User, Task, Project } from '../../../../types';
import { Users, RefreshCw, AlertCircle, CheckSquare, Clock, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import TaskDetailsModal from '../Flow Chart/utils/Profiles/TaskDetailsModal';

interface UserWithTasks {
  user: User;
  tasks: {
    todo: (Task & { project: Project })[];
    inProgress: (Task & { project: Project })[];
    done: (Task & { project: Project })[];
  };
}

const ManagementDashboard: React.FC = () => {
  const [usersWithTasks, setUsersWithTasks] = useState<UserWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithTasks | null>(null);
  const [isDoneColumnCollapsed, setIsDoneColumnCollapsed] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all users and tasks
      const [users, tasks] = await Promise.all([
        fetchAllUsers(),
        fetchAllTasks()
      ]);

      // Filter users by Product Development department
      const productDevUsers = users.filter(user => 
        user.department?.toLowerCase().includes('product') || 
        user.department?.toLowerCase().includes('development') ||
        user.department?.toLowerCase() === 'product development'
      );

      // Group tasks by user and status
      const usersWithTasksData: UserWithTasks[] = productDevUsers.map(user => {
        const userTasks = tasks.filter(task => task.assigneeId === user.id);
        
        const tasksByStatus = {
          todo: userTasks.filter(task => task.status === 'todo'),
          inProgress: userTasks.filter(task => task.status === 'in-progress'),
          done: userTasks.filter(task => task.status === 'done')
        };

        return {
          user,
          tasks: tasksByStatus
        };
      });

      // Add unassigned tasks as a special "user"
      const unassignedTasks = tasks.filter(task => !task.assigneeId || task.assigneeId.trim() === '');
      const unassignedUser: UserWithTasks = {
        user: {
          id: 'unassigned',
          email: 'Unassigned Tasks',
          firstName: 'Unassigned',
          lastName: 'Tasks',
          department: 'Product Development',
          role: '',
          profileColor: '#6B7280' // Gray color for unassigned
        } as User,
        tasks: {
          todo: unassignedTasks.filter(task => task.status === 'todo'),
          inProgress: unassignedTasks.filter(task => task.status === 'in-progress'),
          done: unassignedTasks.filter(task => task.status === 'done')
        }
      };

      // Add unassigned tasks at the end if there are any
      if (unassignedTasks.length > 0) {
        setUsersWithTasks([...usersWithTasksData, unassignedUser]);
      } else {
        setUsersWithTasks(usersWithTasksData);
      }
    } catch (err) {
      console.error('Failed to load management dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const handleUserSelect = (userWithTasks: UserWithTasks) => {
    setSelectedUser(userWithTasks);
  };

  const isUserSelected = (userId: string): boolean => {
    return selectedUser !== null && selectedUser.user.id === userId;
  };

  const toggleDoneColumn = () => {
    setIsDoneColumnCollapsed(!isDoneColumnCollapsed);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
    // Refresh data after modal closes to show any updates
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team task view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Group users into rows of 4
  const userRows: UserWithTasks[][] = [];
  for (let i = 0; i < usersWithTasks.length; i += 4) {
    userRows.push(usersWithTasks.slice(i, i + 4));
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ backgroundColor: brandTheme.background.brand }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: brandTheme.primary.navy }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brandTheme.text.primary }}>Team Task View</h1>
              <p style={{ color: brandTheme.text.secondary }}>Product Development Team Task Overview</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: brandTheme.primary.navy,
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {usersWithTasks.length === 0 ? (
        <div 
          className="text-center py-12 rounded-lg"
          style={{ 
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <Users className="w-16 h-16 mx-auto mb-4" style={{ color: brandTheme.gray[400] }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: brandTheme.text.primary }}>No Product Development Users Found</h3>
          <p style={{ color: brandTheme.text.secondary }}>
            No users found in the Product Development department. 
            Please check user department assignments.
          </p>
        </div>
      ) : (
        <>
          {/* User Tabs */}
          <div 
            className="rounded-lg mb-6"
            style={{ 
              backgroundColor: brandTheme.primary.navy,
              borderColor: brandTheme.primary.navy,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <div>
              <nav className="flex overflow-x-auto">
                {usersWithTasks.map((userWithTasks) => {
                  const isActive = isUserSelected(userWithTasks.user.id);
                  const isUnassigned = userWithTasks.user.id === 'unassigned';
                  const totalTasks = userWithTasks.tasks.todo.length + 
                                    userWithTasks.tasks.inProgress.length + 
                                    userWithTasks.tasks.done.length;
                  
                  return (
                    <button
                      key={userWithTasks.user.id}
                      onClick={() => handleUserSelect(userWithTasks)}
                      className="flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors"
                      style={{
                        borderBottom: isActive ? `3px solid ${brandTheme.primary.lightBlue}` : '3px solid transparent',
                        color: '#FFFFFF',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: userWithTasks.user.profileColor || brandTheme.primary.lightBlue }}
                      >
                        {isUnassigned ? '!' : (userWithTasks.user.firstName?.charAt(0) || userWithTasks.user.email.charAt(0).toUpperCase())}
                      </div>
                      <span>
                        {isUnassigned ? `Unassigned (${totalTasks})` : 
                          (userWithTasks.user.firstName && userWithTasks.user.lastName
                            ? `${userWithTasks.user.firstName} ${userWithTasks.user.lastName}`
                            : userWithTasks.user.email)}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Kanban Board Content */}
          {selectedUser ? (
            <div 
              className="rounded-lg p-6"
              style={{ 
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              {/* User Header */}
              <div 
                className="flex items-center gap-3 mb-6 pb-0 px-6 py-4 -mx-6 -mt-6 rounded-t-lg"
                style={{ backgroundColor: brandTheme.primary.navy }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
                  style={{ 
                    backgroundColor: selectedUser.user.profileColor || brandTheme.primary.lightBlue,
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {selectedUser.user.id === 'unassigned' ? '!' : 
                    (selectedUser.user.firstName?.charAt(0) || selectedUser.user.email.charAt(0).toUpperCase())}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                    {selectedUser.user.id === 'unassigned' ? 'Unassigned Tasks' :
                      (selectedUser.user.firstName && selectedUser.user.lastName
                        ? `${selectedUser.user.firstName} ${selectedUser.user.lastName}`
                        : selectedUser.user.email)}
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {selectedUser.user.id === 'unassigned' ? 'Tasks without assignees' : 
                      (selectedUser.user.department || 'Product Development')}
                  </p>
                </div>
              </div>

              {/* Kanban Columns - Side by Side */}
              <div className="flex gap-6">
                {/* First Column - To Do or Needs Assigned */}
                <div 
                  className="rounded-lg overflow-hidden flex-1"
                  style={{ 
                    backgroundColor: brandTheme.gray[100],
                    borderColor: brandTheme.border.light,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <div 
                    className="flex items-center gap-2 px-4 py-3"
                    style={{ backgroundColor: brandTheme.primary.navy }}
                  >
                    <CheckSquare className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                    <h3 className="font-bold" style={{ color: '#FFFFFF' }}>
                      {selectedUser.user.id === 'unassigned' ? 'Needs Assigned' : 'To Do'}
                    </h3>
                    <span 
                      className="text-sm px-2 py-1 rounded-full ml-auto font-semibold"
                      style={{ 
                        color: brandTheme.primary.navy,
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      {selectedUser.tasks.todo.length}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {selectedUser.tasks.todo.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: brandTheme.text.muted }}>
                        <CheckSquare className="w-8 h-8 mx-auto mb-2" style={{ color: brandTheme.gray[400] }} />
                        No tasks
                      </div>
                    ) : (
                      selectedUser.tasks.todo.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                      ))
                    )}
                  </div>
                </div>

                {/* Second Column - In Progress or On Hold */}
                <div 
                  className="rounded-lg overflow-hidden flex-1"
                  style={{ 
                    backgroundColor: brandTheme.gray[100],
                    borderColor: brandTheme.border.light,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <div 
                    className="flex items-center gap-2 px-4 py-3"
                    style={{ backgroundColor: brandTheme.primary.navy }}
                  >
                    <Clock className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                    <h3 className="font-bold" style={{ color: '#FFFFFF' }}>
                      {selectedUser.user.id === 'unassigned' ? 'On Hold' : 'In Progress'}
                    </h3>
                    <span 
                      className="text-sm px-2 py-1 rounded-full ml-auto font-semibold"
                      style={{ 
                        color: brandTheme.primary.navy,
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      {selectedUser.tasks.inProgress.length}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {selectedUser.tasks.inProgress.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: brandTheme.text.muted }}>
                        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: brandTheme.gray[400] }} />
                        No tasks
                      </div>
                    ) : (
                      selectedUser.tasks.inProgress.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                      ))
                    )}
                  </div>
                </div>

                {/* Done Column - Collapsible */}
                <div 
                  className="rounded-lg overflow-hidden transition-all duration-300"
                  style={{ 
                    backgroundColor: brandTheme.gray[100],
                    borderColor: brandTheme.border.light,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    flex: isDoneColumnCollapsed ? '0 0 auto' : '1',
                    minWidth: isDoneColumnCollapsed ? 'auto' : '0'
                  }}
                >
                  <div 
                    className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: brandTheme.primary.navy }}
                    onClick={toggleDoneColumn}
                  >
                    {isDoneColumnCollapsed ? (
                      <>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#FFFFFF' }} />
                        <h3 className="font-bold text-sm whitespace-nowrap" style={{ color: '#FFFFFF' }}>Done</h3>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                        <h3 className="font-bold whitespace-nowrap" style={{ color: '#FFFFFF' }}>Done</h3>
                        <span 
                          className="text-sm px-2 py-1 rounded-full ml-auto font-semibold"
                          style={{ 
                            color: brandTheme.primary.navy,
                            backgroundColor: '#FFFFFF'
                          }}
                        >
                          {selectedUser.tasks.done.length}
                        </span>
                        <ChevronDown className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                      </>
                    )}
                  </div>
                  {!isDoneColumnCollapsed && (
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {selectedUser.tasks.done.length === 0 ? (
                        <div className="text-center py-8 text-sm" style={{ color: brandTheme.text.muted }}>
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: brandTheme.gray[400] }} />
                          No tasks
                        </div>
                      ) : (
                        selectedUser.tasks.done.map((task) => (
                          <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="rounded-lg p-12 text-center"
              style={{ 
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.light,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: brandTheme.gray[400] }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: brandTheme.text.primary }}>Select a Team Member</h3>
              <p style={{ color: brandTheme.text.secondary }}>
                Click on a tab above to view tasks for a specific team member
              </p>
            </div>
          )}
        </>
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          isOpen={true}
          onClose={handleCloseTaskModal}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard: React.FC<{ task: Task & { project: Project }; onClick: () => void }> = ({ task, onClick }) => {
  const getTaskPriorityColors = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return { 
          borderColor: brandTheme.status.error, 
          backgroundColor: brandTheme.status.errorLight 
        };
      case 'High':
        return { 
          borderColor: brandTheme.status.warning, 
          backgroundColor: brandTheme.status.warningLight 
        };
      case 'Medium':
        return { 
          borderColor: brandTheme.status.inProgress, 
          backgroundColor: brandTheme.status.inProgressLight 
        };
      case 'Low':
        return { 
          borderColor: brandTheme.status.success, 
          backgroundColor: brandTheme.status.successLight 
        };
      default:
        return { 
          borderColor: brandTheme.gray[500], 
          backgroundColor: brandTheme.gray[100] 
        };
    }
  };

  const colors = getTaskPriorityColors(task.priority);

  return (
    <div 
      className="p-4 mb-3 rounded-lg transition-shadow cursor-pointer"
      style={{
        backgroundColor: brandTheme.background.primary,
        borderLeft: `4px solid ${colors.borderColor}`,
        boxShadow: brandTheme.shadow.sm
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = brandTheme.shadow.md}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = brandTheme.shadow.sm}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2 flex-1" style={{ color: brandTheme.text.primary }}>
          {task.name}
        </h4>
        <span 
          className="text-xs ml-2 flex-shrink-0"
          style={{ color: brandTheme.text.muted }}
        >
          {task.priority || 'Medium'}
        </span>
      </div>
      {task.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: brandTheme.text.secondary }}>
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: brandTheme.primary.navy }}>
          {task.project.name}
        </span>
        {task.deadline && (
          <span className="text-xs" style={{ color: brandTheme.text.muted }}>
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: brandTheme.text.secondary }}>
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: brandTheme.gray[200] }}
          >
            <div 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${task.progress}%`,
                backgroundColor: brandTheme.primary.navy
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;

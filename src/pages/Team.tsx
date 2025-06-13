import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, BarChart3, CheckCircle, Clock, AlertCircle, User as UserIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import UserAvatar from '../components/UserAvatar';
import { User } from '../types';

interface UserStatsProps {
  user: User;
}

const UserStats: React.FC<UserStatsProps> = ({ user }) => {
  const { projects, tasks, subTasks } = useAppContext();
  
  // Get user's assigned tasks and subtasks
  const userTasks = tasks.filter(task => task.assigneeId === user.id);
  const userSubTasks = subTasks.filter(subtask => subtask.assigneeId === user.id);
  
  // Get projects where user has tasks
  const userProjects = projects.filter(project => 
    userTasks.some(task => task.projectId === project.id)
  );
  
  // Calculate statistics
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = userTasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = userTasks.filter(task => task.status === 'todo').length;
  
  const totalSubTasks = userSubTasks.length;
  const completedSubTasks = userSubTasks.filter(subtask => subtask.status === 'done').length;
  const inProgressSubTasks = userSubTasks.filter(subtask => subtask.status === 'in-progress').length;
  const todoSubTasks = userSubTasks.filter(subtask => subtask.status === 'todo').length;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Projects</p>
            <p className="text-2xl font-bold text-blue-700">{userProjects.length}</p>
          </div>
          <BarChart3 size={24} className="text-blue-500" />
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-700">{completedTasks + completedSubTasks}</p>
          </div>
          <CheckCircle size={24} className="text-green-500" />
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700">{inProgressTasks + inProgressSubTasks}</p>
          </div>
          <Clock size={24} className="text-yellow-500" />
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">To Do</p>
            <p className="text-2xl font-bold text-gray-700">{todoTasks + todoSubTasks}</p>
          </div>
          <AlertCircle size={24} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};

interface UserDetailViewProps {
  user: User;
  onBack: () => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack }) => {
  const { projects, tasks, subTasks } = useAppContext();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // Get user's assigned tasks and subtasks
  const userTasks = tasks.filter(task => task.assigneeId === user.id);
  const userSubTasks = subTasks.filter(subtask => subtask.assigneeId === user.id);
  
  // Get projects where user has tasks
  const userProjects = projects.filter(project => 
    userTasks.some(task => task.projectId === project.id)
  );
  
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };
  
  const getStatusBadgeVariant = (status: string) => {
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
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <UserAvatar user={user} size="lg" />
        <div className="ml-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : 'Unnamed User'}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <Badge variant="primary" className="mt-1">
            {user.role?.name || 'User'}
          </Badge>
        </div>
      </div>
      
      <UserStats user={user} />
      
      <Card>
        <CardHeader>
          <CardTitle>Project Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {userProjects.length > 0 ? (
            <div className="space-y-4">
              {userProjects.map(project => {
                const projectTasks = userTasks.filter(task => task.projectId === project.id);
                const projectSubTasks = userSubTasks.filter(subtask => 
                  projectTasks.some(task => task.id === subtask.taskId)
                );
                const isExpanded = expandedProjects.has(project.id);
                
                return (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleProjectExpansion(project.id)}
                    >
                      <div className="flex items-center">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <h3 className="text-lg font-semibold ml-2">{project.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {projectTasks.length} tasks, {projectSubTasks.length} subtasks
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        {projectTasks.map(task => {
                          const taskSubTasks = userSubTasks.filter(subtask => subtask.taskId === task.id);
                          
                          return (
                            <div key={task.id} className="ml-6 border-l-2 border-gray-200 pl-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{task.name}</h4>
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                </div>
                                <Badge variant={getStatusBadgeVariant(task.status)}>
                                  {getStatusText(task.status)}
                                </Badge>
                              </div>
                              
                              {taskSubTasks.length > 0 && (
                                <div className="mt-2 ml-4 space-y-1">
                                  {taskSubTasks.map(subtask => (
                                    <div key={subtask.id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-700">• {subtask.name}</span>
                                      <Badge variant={getStatusBadgeVariant(subtask.status)} className="text-xs">
                                        {getStatusText(subtask.status)}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Assignments</h3>
              <p className="text-gray-500">This user has no project assignments yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Team: React.FC = () => {
  const { getUsers } = useAppContext();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const users = getUsers();
  const currentUserData = users.find(u => u.id === currentUser?.id);
  const userRole = currentUserData?.role?.name;
  
  // Filter users based on role
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // For managers, only show their employees
    if (userRole === 'Manager') {
      result = users.filter(user => user.managerId === currentUser?.id);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      });
    }
    
    // Apply role filter
    if (roleFilter) {
      result = result.filter(user => user.role?.name === roleFilter);
    }
    
    return result;
  }, [users, userRole, currentUser?.id, searchTerm, roleFilter]);
  
  // Get unique roles for filter
  const availableRoles = useMemo(() => {
    const roles = new Set(users.map(user => user.role?.name).filter(Boolean));
    return Array.from(roles);
  }, [users]);
  
  if (selectedUser) {
    return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users size={24} className="mr-3 text-gray-500" />
          <h1 className="text-2xl font-bold">Team</h1>
        </div>
        <div className="text-sm text-gray-600">
          {userRole === 'Admin' ? 'All Users' : 'My Team'}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search team members..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
          const { projects, tasks, subTasks } = useAppContext();
          
          // Calculate user stats
          const userTasks = tasks.filter(task => task.assigneeId === user.id);
          const userSubTasks = subTasks.filter(subtask => subtask.assigneeId === user.id);
          const userProjects = projects.filter(project => 
            userTasks.some(task => task.projectId === project.id)
          );
          
          const totalWork = userTasks.length + userSubTasks.length;
          const completedWork = userTasks.filter(t => t.status === 'done').length + 
                               userSubTasks.filter(st => st.status === 'done').length;
          
          return (
            <Card 
              key={user.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <UserAvatar user={user} size="md" />
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : 'Unnamed User'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <Badge variant="primary" className="mt-1 text-xs">
                      {user.role?.name || 'User'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Projects:</span>
                    <span className="font-medium">{userProjects.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Work:</span>
                    <span className="font-medium">{totalWork}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{completedWork}</span>
                  </div>
                  
                  {totalWork > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((completedWork / totalWork) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(completedWork / totalWork) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Team Members Found</h3>
          <p className="text-gray-500">
            {userRole === 'Manager' 
              ? 'You have no employees assigned to you yet.'
              : 'No users match your search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Team;
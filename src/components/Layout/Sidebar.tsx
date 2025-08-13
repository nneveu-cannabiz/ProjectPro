import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  Settings, 
  CheckSquare, 
  MessageSquare, 
  LogOut, 
  ChevronLeft, 
  Menu,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/supabase';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  isActive,
  hasSubmenu = false,
  isOpen = false,
  onClick,
  isCollapsed = false,
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-blue-50'
      }`}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
    >
      <span className="mr-3">{icon}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {hasSubmenu && (
            <span className="ml-auto">
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    profileColor: string;
    email: string;
  } | null>(null);
  
  // Load profile data when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser) {
        try {
          const userProfile = await getUserProfile(currentUser.id);
          
          if (userProfile) {
            setProfileData({
              firstName: userProfile.first_name || '',
              lastName: userProfile.last_name || '',
              profileColor: userProfile.profile_color || '#2563eb',
              email: userProfile.email
            });
          }
        } catch (error) {
          console.error('Error loading sidebar profile data:', error);
        }
      }
    };
    
    loadProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ProjectPro</h1>
              <p className="text-sm text-gray-500">Manage your projects</p>
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        ) : (
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 mx-auto"
            title="Expand Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <SidebarItem
          to="/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          isActive={location.pathname === '/dashboard'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/projects"
          icon={<ListTodo size={20} />}
          label="Projects"
          isActive={location.pathname.startsWith('/projects') && !location.pathname.startsWith('/projects-redo')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/projects-redo"
          icon={<Sparkles size={20} />}
          label="Projects New"
          isActive={location.pathname.startsWith('/projects-redo')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/todo"
          icon={<CheckSquare size={20} />}
          label="My To Do List"
          isActive={location.pathname === '/todo'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/updates"
          icon={<MessageSquare size={20} />}
          label="Updates"
          isActive={location.pathname === '/updates'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/settings"
          icon={<Settings size={20} />}
          label="Settings"
          isActive={location.pathname === '/settings'}
          isCollapsed={isCollapsed}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: profileData?.profileColor || '#2563eb' }}
            >
              {profileData ? 
                (profileData.firstName?.charAt(0) || '') + (profileData.lastName?.charAt(0) || '') ||
                (currentUser?.email?.charAt(0).toUpperCase() || 'U') 
                : 
                (currentUser?.email?.charAt(0).toUpperCase() || 'U')
              }
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {profileData ? 
                  (profileData.firstName && profileData.lastName ?
                    `${profileData.firstName} ${profileData.lastName}` : 
                    currentUser?.email) 
                  : 
                  (currentUser?.email || 'User')
                }
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.email || ''}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-auto p-1 rounded-full hover:bg-gray-100 text-gray-600"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
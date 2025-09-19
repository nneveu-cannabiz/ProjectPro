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
  ChevronDown,
  ChevronRight,
  Menu,
  Sparkles,
  Clock,
  DollarSign,
  FolderOpen,
  Users,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/supabase';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import { brandTheme } from '../../styles/brandTheme';

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
      className={`w-full flex items-start ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg text-left transition-all duration-200 group border relative mb-1`}
      style={
        isActive
          ? {
              backgroundColor: brandTheme.primary.paleBlue,
              borderColor: brandTheme.primary.lightBlue,
              color: brandTheme.primary.navy
            }
          : {
              backgroundColor: brandTheme.background.brandLight,
              borderColor: 'transparent',
              color: brandTheme.primary.navy
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.color = brandTheme.primary.navy
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = brandTheme.background.brandLight
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.color = brandTheme.primary.navy
        }
      }}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
    >
      <span 
        className="w-5 h-5 mt-0.5 flex-shrink-0"
        style={{ 
          color: isActive ? brandTheme.primary.navy : brandTheme.primary.navy 
        }}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div 
              className="font-medium"
              style={{ 
                color: brandTheme.primary.navy
              }}
            >
              {label}
            </div>
          </div>
          {hasSubmenu && (
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              style={{ color: brandTheme.primary.navy }}
            />
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
  const { isAdmin } = useAdminCheck();
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
    <div 
      className={`${isCollapsed ? 'w-16' : 'w-64'} h-full shadow-lg border-r flex flex-col transition-all duration-300 relative`}
      style={{ 
        backgroundColor: brandTheme.background.brandLight,
        borderColor: brandTheme.border.brand
      }}
    >
      {/* Logo/Brand */}
      <div 
        className="border-b relative"
        style={{ borderColor: brandTheme.border.brand, padding: isCollapsed ? '1rem' : '24px' }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold" style={{ color: brandTheme.primary.navy }}>
                ProjectPro
              </h1>
              <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                Management System
              </p>
            </div>
          )}
        </div>
        
        {/* Toggle Button - Only show when expanded */}
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-3 p-2 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm"
            style={{ color: brandTheme.primary.navy }}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Collapsed state toggle button */}
      {isCollapsed && (
        <div className="p-4 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm"
            style={{ color: brandTheme.primary.navy }}
            title="Expand sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarItem
          to="/product-dev-dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Product Dev Dashboard"
          isActive={location.pathname === '/product-dev-dashboard'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/product-dev-kpis"
          icon={<Sparkles size={20} />}
          label="Product Dev KPIs"
          isActive={location.pathname === '/product-dev-kpis'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/product-dev-projects"
          icon={<FolderOpen size={20} />}
          label="Product Dev Projects"
          isActive={location.pathname === '/product-dev-projects'}
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
          to="/documents"
          icon={<FileText size={20} />}
          label="Documents"
          isActive={location.pathname === '/documents'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/hour-logging"
          icon={<Clock size={20} />}
          label="Hour Logging"
          isActive={location.pathname === '/hour-logging'}
          isCollapsed={isCollapsed}
        />
        
        <SidebarItem
          to="/team-requests"
          icon={<Users size={20} />}
          label="Team Requests"
          isActive={location.pathname === '/team-requests'}
          isCollapsed={isCollapsed}
        />
        
        {isAdmin && (
          <SidebarItem
            to="/budget-hours"
            icon={<DollarSign size={20} />}
            label="Budget & Hours"
            isActive={location.pathname === '/budget-hours'}
            isCollapsed={isCollapsed}
          />
        )}
        
        <SidebarItem
          to="/settings"
          icon={<Settings size={20} />}
          label="Settings"
          isActive={location.pathname === '/settings'}
          isCollapsed={isCollapsed}
        />
      </nav>
      
      {/* Footer */}
      <div 
        className="p-4 border-t"
        style={{ borderColor: brandTheme.border.brand }}
      >
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: profileData?.profileColor || brandTheme.primary.navy }}
            >
              {profileData ? 
                (profileData.firstName?.charAt(0) || '') + (profileData.lastName?.charAt(0) || '') ||
                (currentUser?.email?.charAt(0).toUpperCase() || 'U') 
                : 
                (currentUser?.email?.charAt(0).toUpperCase() || 'U')
              }
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: brandTheme.primary.navy }}>
                {profileData ? 
                  (profileData.firstName && profileData.lastName ?
                    `${profileData.firstName} ${profileData.lastName}` : 
                    currentUser?.email) 
                  : 
                  (currentUser?.email || 'User')
                }
              </p>
              <p className="text-xs" style={{ color: brandTheme.text.muted }}>
                {currentUser?.email || ''}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-auto p-1 rounded-full hover:bg-gray-200 transition-colors"
              style={{ color: brandTheme.primary.navy }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              style={{ color: brandTheme.primary.navy }}
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
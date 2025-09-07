import React, { useState, useEffect } from 'react';
import { Search, Bell, User, MessageSquare } from 'lucide-react';
import UserProfileCard from '../Profile/UserProfileCard';
import UpdatePanel from './UpdatePanel';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getUserProfile } from '../../lib/supabase';
import { brandTheme } from '../../styles/brandTheme';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] = useState(false);
  const { currentUser } = useAuth();
  const { getUsers, projects, tasks } = useAppContext();
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
          console.error('Error loading header profile data:', error);
        }
      }
    };
    
    loadProfile();
  }, [currentUser]);
  
  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };
  
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const handleUpdatePanelClick = () => {
    setIsUpdatePanelOpen(true);
  };

  const handleCloseUpdatePanel = () => {
    setIsUpdatePanelOpen(false);
  };

  // Calculate total unread updates count
  const getUnreadUpdatesCount = () => {
    if (!currentUser) return 0;
    
    const { getUpdatesForEntity } = useAppContext();
    let unreadCount = 0;

    // Count unread project updates
    projects.forEach(project => {
      const projectUpdates = getUpdatesForEntity('project', project.id);
      unreadCount += projectUpdates.filter(update => 
        !update.isReadBy?.includes(currentUser.id)
      ).length;
    });

    // Count unread task updates
    tasks.forEach(task => {
      const taskUpdates = getUpdatesForEntity('task', task.id);
      unreadCount += taskUpdates.filter(update => 
        !update.isReadBy?.includes(currentUser.id)
      ).length;
    });

    return unreadCount;
  };

  const unreadCount = getUnreadUpdatesCount();
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
    }
    return currentUser?.email.charAt(0).toUpperCase() || 'U';
  };
  
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button 
          className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
          onClick={handleUpdatePanelClick}
          title="View updates"
        >
          <MessageSquare size={20} style={{ color: brandTheme.text.secondary }} />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: brandTheme.status.error,
                color: 'white',
                fontSize: '10px'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        
        <button 
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={handleProfileClick}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: profileData?.profileColor || '#2563eb' }}
          >
            {getUserInitials()}
          </div>
        </button>
      </div>
      
      <UserProfileCard 
        isOpen={isProfileOpen} 
        onClose={handleCloseProfile} 
        userProfile={profileData} 
        userId={currentUser?.id}
      />
      
      <UpdatePanel
        isOpen={isUpdatePanelOpen}
        onClose={handleCloseUpdatePanel}
      />
    </header>
  );
};

export default Header;
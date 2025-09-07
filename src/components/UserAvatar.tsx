import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUserProfile } from '../lib/supabase';

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  showName = false,
  className = ''
}) => {
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    profileColor: string;
  } | null>(null);
  
  const [error, setError] = useState(false);
  
  // Load profile data when component mounts
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        if (!user.id) {
          console.warn('UserAvatar: Missing user ID');
          return;
        }
        
        const userProfile = await getUserProfile(user.id);
        
        if (userProfile && isMounted) {
          setProfileData({
            firstName: userProfile.first_name || '',
            lastName: userProfile.last_name || '',
            profileColor: userProfile.profile_color || '#2563eb'
          });
        }
      } catch (error) {
        console.error('Error loading avatar profile data:', error);
        if (isMounted) {
          setError(true);
        }
      }
    };
    
    loadProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user.id]);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-4 h-4 text-[8px]';
      case 'sm':
        return 'w-6 h-6 text-xs';
      case 'lg':
        return 'w-10 h-10 text-base';
      case 'md':
      default:
        return 'w-8 h-8 text-sm';
    }
  };
  
  const getInitials = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
    }
    
    // Fallback to email or generic "U"
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`${getSizeClasses()} rounded-full flex items-center justify-center text-white font-semibold`}
        style={{ backgroundColor: (profileData?.profileColor || user.profileColor || '#2563eb') }}
      >
        {getInitials()}
      </div>
      {showName && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {profileData?.firstName && profileData?.lastName ? 
            `${profileData.firstName} ${profileData.lastName}` : 
            user.email}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
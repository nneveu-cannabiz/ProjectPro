import React from 'react';
import { User } from '../types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  showName = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
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
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    
    // Fallback to email or generic "U"
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div className="flex items-center">
      <div 
        className={`${getSizeClasses()} rounded-full flex items-center justify-center text-white font-semibold`}
        style={{ backgroundColor: user.profileColor || '#2563eb' }}
      >
        {getInitials()}
      </div>
      {showName && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {getDisplayName()}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
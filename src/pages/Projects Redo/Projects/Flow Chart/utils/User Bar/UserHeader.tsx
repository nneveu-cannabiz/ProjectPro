import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { User } from '../../../../../../types';
import UserAvatar from '../../../../../../components/UserAvatar';

export interface UserHeaderProps {
  user: User;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({
  user,
  isExpanded = true,
  onToggleExpand
}) => {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;

  return (
    <div 
      className="flex items-center py-3 px-4 border-b"
      style={{
        backgroundColor: brandTheme.primary.navy,
        borderBottomColor: brandTheme.border.light,
        minHeight: '60px'
      }}
    >
      {/* Expand/Collapse Button */}
      {onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="mr-3 p-1 rounded hover:bg-blue-800 transition-colors"
          style={{ color: 'white' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="M6 4l4 4-4 4V4z" />
          </svg>
        </button>
      )}

      {/* User Avatar */}
      <div className="mr-3">
        <UserAvatar user={user} size="md" />
      </div>

      {/* User Name */}
      <div className="flex-1">
        <h3 
          className="font-semibold text-lg"
          style={{ color: 'white' }}
        >
          {displayName}
        </h3>
        {user.firstName && user.lastName && (
          <p 
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {user.email}
          </p>
        )}
      </div>

      {/* Optional Stats or Actions */}
      <div className="flex items-center space-x-2">
        {/* Could add project count, task count, etc. */}
        <span 
          className="text-sm"
          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Team Member
        </span>
      </div>
    </div>
  );
};

export default UserHeader;

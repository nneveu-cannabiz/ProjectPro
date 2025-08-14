import React from 'react';
import { MessageCircle } from 'lucide-react';
import { brandTheme } from '../../../../../../styles/brandTheme';

export interface ProjectUpdateIconProps {
  projectId: string;
  unreadCount: number;
  totalCount: number;
  onClick: (projectId: string) => void;
}

const ProjectUpdateIcon: React.FC<ProjectUpdateIconProps> = ({
  projectId,
  unreadCount,
  totalCount,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    onClick(projectId);
  };

  return (
    <div 
      className="relative flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
      onClick={handleClick}
      title={`${totalCount} total updates, ${unreadCount} unread`}
    >
      {/* Message Icon */}
      <MessageCircle 
        size={16}
        style={{ color: brandTheme.text.primary }}
        className="flex-shrink-0"
      />
      
      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div 
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: brandTheme.status.error,
            color: brandTheme.background.primary,
            fontSize: '10px',
            lineHeight: '1',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      {/* Total Count Badge (only show if there are updates but no unread) */}
      {totalCount > 0 && unreadCount === 0 && (
        <div 
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: brandTheme.gray[400],
            color: brandTheme.background.primary,
            fontSize: '10px',
            lineHeight: '1',
          }}
        >
          {totalCount > 99 ? '99+' : totalCount}
        </div>
      )}
    </div>
  );
};

export default ProjectUpdateIcon;

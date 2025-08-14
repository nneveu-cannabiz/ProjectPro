import React from 'react';
import { MessageCircle } from 'lucide-react';
import { brandTheme } from '../../../../../../styles/brandTheme';

export interface TaskUpdateIconProps {
  taskId: string;
  unreadCount: number;
  totalCount: number;
  onClick: (taskId: string) => void;
}

const TaskUpdateIcon: React.FC<TaskUpdateIconProps> = ({
  taskId,
  unreadCount,
  totalCount,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    onClick(taskId);
  };

  return (
    <div 
      className="relative flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
      onClick={handleClick}
      title={`${totalCount} total updates, ${unreadCount} unread`}
    >
      {/* Message Icon */}
      <MessageCircle 
        size={14}
        style={{ color: brandTheme.primary.navy }}
        className="flex-shrink-0"
      />
      
      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div 
          className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: brandTheme.status.error,
            color: brandTheme.background.primary,
            fontSize: '8px',
            lineHeight: '1',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      {/* Total Count Badge (only show if there are updates but no unread) */}
      {totalCount > 0 && unreadCount === 0 && (
        <div 
          className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: brandTheme.gray[400],
            color: brandTheme.background.primary,
            fontSize: '8px',
            lineHeight: '1',
          }}
        >
          {totalCount > 99 ? '99+' : totalCount}
        </div>
      )}
    </div>
  );
};

export default TaskUpdateIcon;

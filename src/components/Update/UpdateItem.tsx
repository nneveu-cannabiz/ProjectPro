import React from 'react';
import { Update, User } from '../../types';
import { MessageSquare } from 'lucide-react';
import UserAvatar from '../UserAvatar';

interface UpdateItemProps {
  update: Update;
  user: User;
  showEntity?: boolean;
  entityName?: string;
}

const UpdateItem: React.FC<UpdateItemProps> = ({ 
  update, 
  user, 
  showEntity = false,
  entityName
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format date as "Month Day, Year at HH:MM AM/PM"
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Get text color based on entity type
  const getTextColor = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return 'text-blue-500';
      case 'task':
        return 'text-emerald-500';
      case 'subtask':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };
  
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex">
        <div className="mr-3 mt-1">
          <MessageSquare size={18} className={getTextColor(update.entityType)} />
        </div>
        <div className="flex-1">
          <div className="flex items-start">
            <UserAvatar user={user} size="sm" />
            <div className="ml-2">
              <div className="text-sm font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(update.createdAt)}
              </div>
            </div>
          </div>
          
          {showEntity && entityName && (
            <div className="text-xs text-gray-500 mt-2">
              on {update.entityType.charAt(0).toUpperCase() + update.entityType.slice(1)}: {entityName}
            </div>
          )}
          
          <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">
            {update.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdateItem;
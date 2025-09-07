import React, { useState, useMemo } from 'react';
import { X, MessageSquare, BellOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { brandTheme } from '../../styles/brandTheme';
import { Update, User } from '../../types';
import UserAvatar from '../UserAvatar';
import Button from '../ui/Button';

interface UpdatePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateItemProps {
  update: Update;
  user: User;
  currentUserId: string;
  onMarkAsRead: (updateId: string) => void;
  onOpenDetails: (entityType: string, entityId: string, entityName: string) => void;
}

const UpdateItem: React.FC<UpdateItemProps> = ({
  update,
  user,
  currentUserId,
  onMarkAsRead,
  onOpenDetails
}) => {
  const { projects, tasks } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const isReadByCurrentUser = update.isReadBy?.includes(currentUserId) || false;
  const isLongMessage = update.message.length > 100;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const minutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${minutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const getEntityInfo = () => {
    if (update.entityType === 'project') {
      const project = projects.find(p => p.id === update.entityId);
      return {
        name: project?.name || 'Unknown Project',
        type: 'Project',
        icon: '📁'
      };
    } else if (update.entityType === 'task') {
      const task = tasks.find(t => t.id === update.entityId);
      return {
        name: task?.name || 'Unknown Task',
        type: 'Task',
        icon: '📋'
      };
    }
    return {
      name: 'Unknown Entity',
      type: 'Entity',
      icon: '📄'
    };
  };

  const entityInfo = getEntityInfo();

  const handleEntityClick = () => {
    onOpenDetails(update.entityType, update.entityId, entityInfo.name);
  };

  return (
    <div 
      className={`p-3 border-b transition-colors ${!isReadByCurrentUser ? 'bg-blue-50' : 'bg-white'}`}
      style={{ borderColor: brandTheme.border.light }}
    >
      <div className="flex items-start space-x-3">
        <UserAvatar user={user} size="sm" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                {user.firstName} {user.lastName}
              </span>
              {!isReadByCurrentUser && (
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: brandTheme.status.error }}
                />
              )}
            </div>
            <span className="text-xs" style={{ color: brandTheme.text.muted }}>
              {formatDate(update.createdAt)}
            </span>
          </div>
          
          {/* Entity Tag */}
          <button
            onClick={handleEntityClick}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: update.entityType === 'task' ? brandTheme.status.infoLight : brandTheme.background.secondary,
              color: update.entityType === 'task' ? brandTheme.primary.navy : brandTheme.text.secondary
            }}
          >
            <span className="mr-1">{entityInfo.icon}</span>
            {entityInfo.name}
          </button>
          
          {/* Message */}
          <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
            <p className={`whitespace-pre-line ${isLongMessage && !isExpanded ? 'line-clamp-2' : ''}`}>
              {update.message}
            </p>
            {isLongMessage && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs mt-1 flex items-center transition-colors"
                style={{ color: brandTheme.status.info }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} className="mr-1" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} className="mr-1" /> Show more
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-3 mt-2">
            {!isReadByCurrentUser && (
              <button
                onClick={() => onMarkAsRead(update.id)}
                className="text-xs transition-colors"
                style={{ color: brandTheme.status.info }}
              >
                Mark as read
              </button>
            )}
            <button
              onClick={handleEntityClick}
              className="text-xs transition-colors"
              style={{ color: brandTheme.status.info }}
            >
              View details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UpdatePanel: React.FC<UpdatePanelProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { getUsers, markUpdateAsRead } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const users = getUsers();

  // Get all updates across all entities
  const getAllUpdates = () => {
    const { getUpdatesForEntity, projects, tasks } = useAppContext();
    const allUpdates: Update[] = [];

    // Get project updates
    projects.forEach(project => {
      const projectUpdates = getUpdatesForEntity('project', project.id);
      allUpdates.push(...projectUpdates);
    });

    // Get task updates
    tasks.forEach(task => {
      const taskUpdates = getUpdatesForEntity('task', task.id);
      allUpdates.push(...taskUpdates);
    });

    return allUpdates;
  };

  const allUpdates = getAllUpdates();

  // Filter and sort updates
  const filteredUpdates = useMemo(() => {
    if (!currentUser) return [];

    let filtered = allUpdates;

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(update => !update.isReadBy?.includes(currentUser.id));
    }

    // Apply sort
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allUpdates, currentUser, filter, sortOrder]);

  const unreadCount = allUpdates.filter(update => 
    currentUser && !update.isReadBy?.includes(currentUser.id)
  ).length;

  const handleMarkAsRead = async (updateId: string) => {
    if (!currentUser) return;
    try {
      await markUpdateAsRead(updateId, currentUser.id);
    } catch (error) {
      console.error('Error marking update as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadUpdates = allUpdates.filter(update => !update.isReadBy?.includes(currentUser.id));
      await Promise.all(unreadUpdates.map(update => markUpdateAsRead(update.id, currentUser.id)));
    } catch (error) {
      console.error('Error marking all updates as read:', error);
    }
  };

  const handleOpenDetails = (entityType: string, entityId: string, entityName: string) => {
    // This would open the UpdatesDetailsModal for the specific entity
    // For now, we'll just log it - this can be enhanced later
    console.log('Open details for:', entityType, entityId, entityName);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col"
        style={{ borderLeft: `1px solid ${brandTheme.border.light}` }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: brandTheme.border.light }}
        >
          <div className="flex items-center space-x-2">
            <MessageSquare size={20} style={{ color: brandTheme.primary.navy }} />
            <h2 className="text-lg font-semibold" style={{ color: brandTheme.text.primary }}>
              Updates
            </h2>
            {unreadCount > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: brandTheme.status.error,
                  color: 'white'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: brandTheme.text.muted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div 
          className="p-4 border-b space-y-3"
          style={{ borderColor: brandTheme.border.light }}
        >
          {/* Filter and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'all' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: filter === 'all' ? brandTheme.status.infoLight : 'transparent',
                  color: filter === 'all' ? brandTheme.primary.navy : brandTheme.text.secondary
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'unread' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: filter === 'unread' ? brandTheme.status.infoLight : 'transparent',
                  color: filter === 'unread' ? brandTheme.primary.navy : brandTheme.text.secondary
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>
            
            <div className="flex items-center border rounded overflow-hidden" style={{ borderColor: brandTheme.border.medium }}>
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-3 py-1 text-xs transition-colors ${
                  sortOrder === 'newest' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: sortOrder === 'newest' ? brandTheme.primary.navy : 'transparent',
                  color: sortOrder === 'newest' ? 'white' : brandTheme.text.secondary
                }}
              >
                Newest
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-3 py-1 text-xs transition-colors ${
                  sortOrder === 'oldest' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: sortOrder === 'oldest' ? brandTheme.primary.navy : 'transparent',
                  color: sortOrder === 'oldest' ? 'white' : brandTheme.text.secondary
                }}
              >
                Oldest
              </button>
            </div>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="w-full"
            >
              <BellOff size={14} className="mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Updates List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageSquare size={48} className="mb-3 opacity-30" style={{ color: brandTheme.text.muted }} />
              <p className="text-center" style={{ color: brandTheme.text.muted }}>
                {filter === 'unread' ? 'No unread updates' : 'No updates found'}
              </p>
              <p className="text-sm text-center mt-1" style={{ color: brandTheme.text.muted }}>
                {filter === 'unread' ? 'You\'re all caught up!' : 'Updates will appear here when available.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredUpdates.map(update => {
                const user = users.find(u => u.id === update.userId);
                if (!user || !currentUser) return null;

                return (
                  <UpdateItem
                    key={update.id}
                    update={update}
                    user={user}
                    currentUserId={currentUser.id}
                    onMarkAsRead={handleMarkAsRead}
                    onOpenDetails={handleOpenDetails}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatePanel;

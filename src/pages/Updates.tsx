import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Loader2, MessageSquare, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAppContext } from '../context/AppContext';
import UserAvatar from '../components/UserAvatar';
import { Update } from '../types';
import { useNavigate } from 'react-router-dom';

const UpdateCard: React.FC<{ update: Update }> = ({ update }) => {
  const navigate = useNavigate();
  const { projects, tasks, subTasks, getUsers } = useAppContext();
  const users = getUsers();
  const author = users.find(u => u.id === update.userId);
  
  // Find the entity that this update is about
  const entity = useMemo(() => {
    if (update.entityType === 'project') {
      return {
        name: projects.find(p => p.id === update.entityId)?.name || 'Unknown Project',
        type: 'Project',
        path: `/projects/${update.entityId}`,
        parent: null,
        parentProject: null
      };
    } else if (update.entityType === 'task') {
      const task = tasks.find(t => t.id === update.entityId);
      const project = task ? projects.find(p => p.id === task.projectId) : null;
      
      return {
        name: task?.name || 'Unknown Task',
        type: 'Task',
        path: project ? `/projects/${project.id}/tasks/${update.entityId}` : null,
        parent: null,
        parentProject: project ? {
          name: project.name,
          path: `/projects/${project.id}`
        } : null
      };
    } else if (update.entityType === 'subtask') {
      const subtask = subTasks.find(s => s.id === update.entityId);
      const task = subtask ? tasks.find(t => t.id === subtask.taskId) : null;
      const project = task ? projects.find(p => p.id === task.projectId) : null;
      
      return {
        name: subtask?.name || 'Unknown Subtask',
        type: 'Subtask',
        path: project && task ? `/projects/${project.id}/tasks/${task.id}/subtasks/${update.entityId}` : null,
        parent: task ? {
          name: task.name,
          path: project ? `/projects/${project.id}/tasks/${task.id}` : null
        } : null,
        parentProject: project ? {
          name: project.name,
          path: `/projects/${project.id}`
        } : null
      };
    }
    
    return {
      name: 'Unknown',
      type: 'Unknown',
      path: null,
      parent: null,
      parentProject: null
    };
  }, [update, projects, tasks, subTasks]);

  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get badge color based on entity type
  const getEntityBadgeVariant = (type: string) => {
    switch (type) {
      case 'Project':
        return 'primary';
      case 'Task':
        return 'success';
      case 'Subtask':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Handle click on the entity name/link
  const handleEntityClick = () => {
    if (entity.path) {
      navigate(entity.path);
    }
  };

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          <MessageSquare size={18} className="text-blue-500" />
        </div>
        <div className="flex-1">
          {/* Entity info */}
          <div className="flex items-center mb-1 flex-wrap">
            <Badge 
              variant={getEntityBadgeVariant(entity.type)} 
              className="mr-2 mb-1"
            >
              {entity.type}
            </Badge>
            <button 
              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline mr-2 mb-1"
              onClick={handleEntityClick}
            >
              {entity.name}
            </button>
            
            {/* Show parent task for subtasks */}
            {entity.parent && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <span className="mx-1">in</span>
                <button 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => entity.parent?.path && navigate(entity.parent.path)}
                >
                  {entity.parent.name}
                </button>
              </div>
            )}
            
            {/* Show parent project for tasks and subtasks */}
            {entity.parentProject && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <span className="mx-1">from</span>
                <button 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => entity.parentProject?.path && navigate(entity.parentProject.path)}
                >
                  {entity.parentProject.name}
                </button>
              </div>
            )}
          </div>
          
          {/* Message and timestamp */}
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-line line-clamp-3">
            {update.message}
          </p>
          
          {/* Update metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center">
              {author ? (
                <>
                  <UserAvatar user={author} size="sm" />
                  <span className="ml-2">
                    {author.firstName && author.lastName
                      ? `${author.firstName} ${author.lastName}`
                      : author.email}
                  </span>
                </>
              ) : (
                <span>Unknown User</span>
              )}
            </div>
            <span>{formatDate(update.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Updates: React.FC = () => {
  const { updates, projects, tasks, subTasks, refreshData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort updates
  const filteredUpdates = useMemo(() => {
    let result = [...updates];
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(update => {
        // Check update message
        if (update.message.toLowerCase().includes(lowerSearchTerm)) return true;
        
        // Check entity names
        if (update.entityType === 'project') {
          const project = projects.find(p => p.id === update.entityId);
          if (project && project.name.toLowerCase().includes(lowerSearchTerm)) return true;
        } else if (update.entityType === 'task') {
          const task = tasks.find(t => t.id === update.entityId);
          if (task && task.name.toLowerCase().includes(lowerSearchTerm)) return true;
        } else if (update.entityType === 'subtask') {
          const subtask = subTasks.find(s => s.id === update.entityId);
          if (subtask && subtask.name.toLowerCase().includes(lowerSearchTerm)) return true;
        }
        
        return false;
      });
    }
    
    // Filter by entity type
    if (entityTypeFilter) {
      result = result.filter(update => update.entityType === entityTypeFilter);
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [updates, projects, tasks, subTasks, searchTerm, entityTypeFilter, sortOrder]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Updates</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search updates..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
            >
              <option value="">All Entity Types</option>
              <option value="project">Projects</option>
              <option value="task">Tasks</option>
              <option value="subtask">Subtasks</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              className="p-2 h-auto"
              onClick={toggleSortOrder}
              title={sortOrder === 'newest' ? 'Oldest First' : 'Newest First'}
            >
              {sortOrder === 'newest' ? (
                <div className="flex items-center">
                  <ArrowDown size={16} className="mr-1" /> Newest
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUp size={16} className="mr-1" /> Oldest
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Updates list */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {filteredUpdates.length} {filteredUpdates.length === 1 ? 'Update' : 'Updates'} Found
          </h2>
          
          <div className="flex items-center text-sm text-gray-500">
            <Filter size={14} className="mr-1" />
            <span>
              {entityTypeFilter 
                ? `Showing ${entityTypeFilter} updates` 
                : 'Showing all updates'}
            </span>
          </div>
        </div>
        
        {filteredUpdates.length > 0 ? (
          <div>
            {filteredUpdates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Updates Found</h3>
            <p className="text-gray-500">
              {searchTerm || entityTypeFilter 
                ? 'Try adjusting your search or filters' 
                : 'No updates have been added to the system yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Updates;
import React from 'react';
import { Update } from '../../types';
import UpdateItem from './UpdateItem';
import { useAppContext } from '../../context/AppContext';
import { MessageSquare } from 'lucide-react';

interface UpdatesListProps {
  updates: Update[];
  showEntity?: boolean;
  emptyMessage?: string;
}

const UpdatesList: React.FC<UpdatesListProps> = ({ 
  updates, 
  showEntity = false,
  emptyMessage = 'No updates yet'
}) => {
  const { getUsers, projects, tasks, subTasks } = useAppContext();
  const users = getUsers();
  
  // Get entity name for an update - with error handling
  const getEntityName = (update: Update): string => {
    try {
      switch (update.entityType) {
        case 'project':
          const project = projects.find(p => p.id === update.entityId);
          return project ? project.name : 'Unknown Project';
        
        case 'task':
          const task = tasks.find(t => t.id === update.entityId);
          return task ? task.name : 'Unknown Task';
        
        case 'subtask':
          const subtask = subTasks.find(st => st.id === update.entityId);
          return subtask ? subtask.name : 'Unknown Subtask';
        
        default:
          return 'Unknown';
      }
    } catch (error) {
      console.error('Error getting entity name:', error);
      return 'Unknown';
    }
  };
  
  // Get theme class based on entity type
  const getThemeClass = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return 'theme-project themed-card';
      case 'task':
        return 'theme-task themed-card';
      case 'subtask':
        return 'theme-subtask themed-card';
      default:
        return 'bg-white';
    }
  };
  
  // Handle case of no updates
  if (!updates || updates.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <MessageSquare size={24} className="mx-auto mb-2 text-gray-400" />
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-0 divide-y">
      {updates.map(update => {
        // Find the user for this update
        const user = users.find(u => u.id === update.userId);
        if (!user) return null;
        
        return (
          <div key={update.id} className={`${getThemeClass(update.entityType)}`}>
            <UpdateItem 
              update={update} 
              user={user} 
              showEntity={showEntity}
              entityName={getEntityName(update)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default UpdatesList;
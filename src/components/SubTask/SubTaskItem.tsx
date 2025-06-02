import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MessageSquare, Eye, MoreVertical } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import UserAvatar from '../UserAvatar';
import { SubTask } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UpdatesModal from '../Update/UpdatesModal';
import DropdownMenu from '../ui/DropdownMenu';

interface SubTaskItemProps {
  subTask: SubTask;
  onEdit: (subTask: SubTask) => void;
  taskId: string;
  projectId: string;
}

const SubTaskItem: React.FC<SubTaskItemProps> = ({ subTask, onEdit, taskId, projectId }) => {
  const navigate = useNavigate();
  const { deleteSubTask, getUsers, getUpdatesForEntity } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSubTask(subTask.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(subTask);
  };
  
  const handleUpdatesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatesModalOpen(true);
  };
  
  const handleClick = () => {
    navigate(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTask.id}`);
  };
  
  // Get updates for this subtask
  const updates = getUpdatesForEntity('subtask', subTask.id);
  
  const users = getUsers();
  const assignee = subTask.assigneeId ? users.find(user => user.id === subTask.assigneeId) : null;
  
  // Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Task type badge variant
  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'danger';
      case 'Feature':
        return 'primary';
      case 'Discovery':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Dropdown menu items
  const menuItems = [
    {
      label: 'View Subtask',
      icon: <Eye size={18} />,
      onClick: handleClick
    },
    {
      label: 'See Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleUpdatesClick
    },
    {
      label: 'Edit Subtask',
      icon: <Edit size={18} />,
      onClick: handleEdit
    },
    {
      label: 'Delete Subtask',
      icon: <Trash2 size={18} />,
      onClick: handleDelete,
      className: 'text-red-500'
    }
  ];
  
  return (
    <>
      <div 
        className="flex items-center py-3 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="flex-1">
          <div className="font-medium text-gray-800">{subTask.name}</div>
          {subTask.description && (
            <div className="text-sm text-gray-600 truncate mt-1">{subTask.description}</div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant={getTypeVariant(subTask.taskType)}>
            {subTask.taskType}
          </Badge>
          
          <Badge variant={getStatusVariant(subTask.status)}>
            {getStatusText(subTask.status)}
          </Badge>
          
          {assignee && (
            <div>
              <UserAvatar user={assignee} size="sm" />
            </div>
          )}
          
          {updates.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto text-gray-500"
              onClick={handleUpdatesClick}
              title="View Updates"
            >
              <MessageSquare size={16} />
              <span className="ml-1 text-xs">{updates.length}</span>
            </Button>
          )}
          
          <DropdownMenu items={menuItems} />
        </div>
      </div>
      
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="subtask"
        entityId={subTask.id}
        entityName={subTask.name}
        directUpdates={updates}
      />
    </>
  );
};

export default SubTaskItem;
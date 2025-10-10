import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MessageSquare, Eye, MoreVertical } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import UserAvatar from '../UserAvatar';
import { SubTask } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UpdatesModal from '../Update/UpdatesModal';
import DropdownMenu from '../ui/DropdownMenu';
import { brandTheme } from '../../styles/brandTheme';

interface SubTaskItemProps {
  subTask: SubTask;
  onEdit: (subTask: SubTask) => void;
  taskId: string;
  projectId: string;
}

const SubTaskItem: React.FC<SubTaskItemProps> = ({ subTask, onEdit, taskId, projectId }) => {
  const navigate = useNavigate();
  const { deleteSubTask, getUsers, getUpdatesForEntity, updateSubTask } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Completion date confirmation state
  const [isCompletionDateModalOpen, setIsCompletionDateModalOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Start date confirmation state
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);
  
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
  
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusDropdown(!showStatusDropdown);
  };

  const handleStatusChange = async (e: React.MouseEvent, newStatus: 'todo' | 'in-progress' | 'done') => {
    e.stopPropagation();
    
    // If changing to 'done', show completion date modal
    if (newStatus === 'done') {
      const today = new Date().toISOString().split('T')[0];
      setCompletionDate(today);
      setIsCompletionDateModalOpen(true);
      setShowStatusDropdown(false);
      return;
    }
    
    // If changing to 'in-progress', show start date modal
    if (newStatus === 'in-progress') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(subTask.startDate || today);
      setIsStartDateModalOpen(true);
      setShowStatusDropdown(false);
      return;
    }
    
    // For 'todo' status, update directly
    try {
      await updateSubTask({
        ...subTask,
        status: newStatus
      });
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating subtask status:', error);
    }
  };

  // Actually mark subtask as done with the selected completion date
  const handleConfirmCompletion = async () => {
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      await updateSubTask({
        ...subTask,
        status: 'done',
        endDate: completionDate,
        updatedAt: new Date().toISOString()
      });
      setIsCompletionDateModalOpen(false);
    } catch (error) {
      console.error('Error marking subtask as done:', error);
      alert('Failed to mark subtask as done. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Actually mark subtask as in progress with the selected start date
  const handleConfirmStartProgress = async () => {
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      console.log('Marking subtask as in progress:', subTask.id);
      console.log('Start date:', startDate);
      
      await updateSubTask({
        ...subTask,
        status: 'in-progress',
        startDate: startDate,
        updatedAt: new Date().toISOString()
      });
      setIsStartDateModalOpen(false);
    } catch (error) {
      console.error('Error marking subtask as in progress:', error);
      alert('Failed to mark subtask as in progress. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
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
        className="flex items-start py-3 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="flex-1">
          <div className="font-medium text-gray-800">{subTask.name}</div>
          {subTask.description && (
            <div className="text-sm text-gray-600 whitespace-pre-wrap break-words mt-1">{subTask.description}</div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 pt-0.5">
          <Badge variant={getTypeVariant(subTask.taskType)}>
            {subTask.taskType}
          </Badge>
          
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={handleStatusClick}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to change status"
            >
              <Badge variant={getStatusVariant(subTask.status)}>
                {getStatusText(subTask.status)}
              </Badge>
            </div>
            
            {showStatusDropdown && (
              <div 
                className="absolute top-full mt-1 right-0 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[140px]"
                style={{ borderColor: '#e5e7eb' }}
              >
                <button
                  onClick={(e) => handleStatusChange(e, 'todo')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ color: subTask.status === 'todo' ? '#2563eb' : '#374151' }}
                >
                  <span className={`font-medium ${subTask.status === 'todo' ? 'font-bold' : ''}`}>
                    To Do
                  </span>
                </button>
                <button
                  onClick={(e) => handleStatusChange(e, 'in-progress')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ color: subTask.status === 'in-progress' ? '#f59e0b' : '#374151' }}
                >
                  <span className={`font-medium ${subTask.status === 'in-progress' ? 'font-bold' : ''}`}>
                    In Progress
                  </span>
                </button>
                <button
                  onClick={(e) => handleStatusChange(e, 'done')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ color: subTask.status === 'done' ? '#16a34a' : '#374151' }}
                >
                  <span className={`font-medium ${subTask.status === 'done' ? 'font-bold' : ''}`}>
                    Done
                  </span>
                </button>
              </div>
            )}
          </div>
          
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

      {/* Start Date Confirmation Modal */}
      {isStartDateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsStartDateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: brandTheme.background.primary }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: brandTheme.status.warning,
                borderColor: brandTheme.border.light,
              }}
            >
              <h2 className="text-xl font-bold text-white">Confirm Start Date</h2>
              <p className="text-sm text-white opacity-90 mt-1">
                Set the start date for this subtask
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: brandTheme.text.primary }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                    color: brandTheme.text.primary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                  This date will be set as the subtask's start date
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
                <p className="text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
                  Subtask: {subTask.name}
                </p>
                <p className="text-xs" style={{ color: brandTheme.text.secondary }}>
                  This subtask will be marked as in progress
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex justify-end space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStartDateModalOpen(false);
                }}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.primary,
                  border: `1px solid ${brandTheme.border.medium}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmStartProgress();
                }}
                disabled={isUpdatingStatus || !startDate}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.status.warning,
                  color: 'white',
                }}
              >
                {isUpdatingStatus ? 'Marking as In Progress...' : 'Mark as In Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Date Confirmation Modal */}
      {isCompletionDateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsCompletionDateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: brandTheme.background.primary }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: brandTheme.status.success,
                borderColor: brandTheme.border.light,
              }}
            >
              <h2 className="text-xl font-bold text-white">Confirm Subtask Completion</h2>
              <p className="text-sm text-white opacity-90 mt-1">
                Set the completion date for this subtask
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: brandTheme.text.primary }}
                >
                  Completion Date
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                    color: brandTheme.text.primary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                  This date will be set as the subtask's end date
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
                <p className="text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
                  Subtask: {subTask.name}
                </p>
                <p className="text-xs" style={{ color: brandTheme.text.secondary }}>
                  This subtask will be marked as complete
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex justify-end space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompletionDateModalOpen(false);
                }}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.primary,
                  border: `1px solid ${brandTheme.border.medium}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmCompletion();
                }}
                disabled={isUpdatingStatus || !completionDate}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.status.success,
                  color: 'white',
                }}
              >
                {isUpdatingStatus ? 'Marking as Done...' : 'Mark as Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubTaskItem;
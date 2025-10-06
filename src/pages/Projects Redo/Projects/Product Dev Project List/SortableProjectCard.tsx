import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, CheckSquare, GripVertical, Hash } from 'lucide-react';
import { Project, Task, User } from '../../../../types';
import { brandTheme } from '../../../../styles/brandTheme';
import Badge from '../../../../components/ui/Badge';
import UserAvatar from '../../../../components/UserAvatar';
// import { Card } from '../../../../components/ui/Card'; // Not using Card to allow ref forwarding
import Modal from '../../../../components/ui/Modal';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectWithTasks extends Project {
  tasks: Task[];
  assignedUsers: User[];
}

interface SortableProjectCardProps {
  project: ProjectWithTasks;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onProjectClick: (projectId: string, e: React.MouseEvent) => void;
  onTaskClick: (taskId: string, e: React.MouseEvent) => void;
  getStatusColor: (status: string) => { bg: string; text: string };
  getStatusText: (status: string) => string;
  getPriorityColor: (priority?: string) => { bg: string; text: string };
  formatDate: (dateString?: string) => string;
  users: User[];
  pageName: string;
  displayRank?: number;
  onRankChange: (projectId: string, newRank: number) => void;
  isDragDisabled?: boolean;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  isExpanded,
  onToggleExpand,
  onProjectClick,
  onTaskClick,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  formatDate,
  users,
  pageName,
  displayRank,
  onRankChange,
  isDragDisabled = false,
}) => {
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankInput, setRankInput] = useState('');
  
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: project.id,
    disabled: isDragDisabled,
  });
  
  console.log('🔧 Sortable setup:', { 
    projectId: project.id, 
    hasListeners: !!listeners, 
    hasAttributes: !!attributes,
    isDragging 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  const completedTasks = project.tasks.filter(task => task.status === 'done').length;
  const totalTasks = project.tasks.length;
  const statusColors = getStatusColor(project.status);
  
  // Get the rank for this page
  const currentRank = project.ranking?.[pageName];
  const hasRank = currentRank !== undefined;

  const handleRankClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRankInput(currentRank ? currentRank.toString() : '');
    setIsRankModalOpen(true);
  };

  const handleRankSubmit = () => {
    const newRank = parseInt(rankInput, 10);
    if (!isNaN(newRank) && newRank > 0) {
      onRankChange(project.id, newRank);
      setIsRankModalOpen(false);
      setRankInput('');
    }
  };

  const handleRankCancel = () => {
    setIsRankModalOpen(false);
    setRankInput('');
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Project Header */}
      <div 
        className="p-6 transition-colors"
        style={{ backgroundColor: brandTheme.primary.paleBlue }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Rank Badge */}
            <button
              onClick={handleRankClick}
              className="flex-shrink-0 flex items-center justify-center font-bold text-xs rounded-md px-2 py-1 min-w-[50px] hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: hasRank ? brandTheme.primary.navy : brandTheme.gray[300],
                color: hasRank ? '#FFFFFF' : brandTheme.text.muted,
              }}
              title="Click to set rank"
            >
              {hasRank ? `#${displayRank || currentRank}` : 'Unranked'}
            </button>
            
            {/* Drag Handle */}
            <div
              ref={setActivatorNodeRef}
              className="flex-shrink-0 p-2 rounded transition-colors"
              style={{ 
                color: isDragDisabled ? brandTheme.gray[400] : brandTheme.text.secondary,
                cursor: isDragDisabled ? 'not-allowed' : 'grab',
                touchAction: isDragDisabled ? 'auto' : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                opacity: isDragDisabled ? 0.5 : 1,
              }}
              {...(isDragDisabled ? {} : attributes)}
              {...(isDragDisabled ? {} : listeners)}
              title={isDragDisabled ? "Clear search to enable reordering" : "Drag to reorder"}
            >
              <GripVertical size={20} />
            </div>
            
            <button 
              className="flex-shrink-0 p-1 rounded-full transition-colors cursor-pointer hover:bg-white/20"
              style={{ color: brandTheme.text.secondary }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
            
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate" 
                  style={{ color: brandTheme.text.primary }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectClick(project.id, e);
                  }}
                  className="text-left hover:underline focus:outline-none focus:underline transition-all"
                  style={{ color: brandTheme.primary.navy }}
                >
                  {project.name}
                </button>
              </h3>
              <div className="flex items-center space-x-3 mt-1">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: statusColors.bg,
                    color: statusColors.text
                  }}
                >
                  {getStatusText(project.status)}
                </span>
                <Badge variant="secondary">
                  {project.category}
                </Badge>
                <Badge variant="default">
                  {project.projectType}
                </Badge>
              </div>
              {!isExpanded && project.description && (
                <p className="text-sm mt-2 line-clamp-2 overflow-hidden" 
                   style={{ color: brandTheme.text.muted }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6 flex-shrink-0">
            {/* Task Progress */}
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <CheckSquare size={16} style={{ color: brandTheme.text.muted }} />
                <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                tasks
              </div>
            </div>

            {/* Team Members */}
            {project.assignedUsers.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users size={16} style={{ color: brandTheme.text.muted }} />
                <div className="flex -space-x-2">
                  {project.assignedUsers.slice(0, 3).map((user, index) => (
                    <div key={user.id} style={{ zIndex: 10 - index }}>
                      <UserAvatar user={user} size="sm" />
                    </div>
                  ))}
                  {project.assignedUsers.length > 3 && (
                    <div 
                      className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border-2 border-white"
                      style={{ 
                        backgroundColor: brandTheme.gray[200],
                        color: brandTheme.text.muted
                      }}
                    >
                      +{project.assignedUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Calendar size={16} style={{ color: brandTheme.text.muted }} />
                <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
                  {formatDate(project.deadline || project.endDate)}
                </span>
              </div>
              <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                {project.deadline ? 'deadline' : 'end date'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className="border-t"
          style={{ 
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light 
          }}
        >
          {/* Project Details */}
          <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
            {project.description && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2" 
                    style={{ color: brandTheme.text.fieldLabel }}>
                  Description
                </h4>
                <p style={{ color: brandTheme.text.muted }}>
                  {project.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1" 
                    style={{ color: brandTheme.text.fieldLabel }}>
                  Created
                </h4>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                  {formatDate(project.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1" 
                    style={{ color: brandTheme.text.fieldLabel }}>
                  Start Date
                </h4>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                  {formatDate(project.startDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1" 
                    style={{ color: brandTheme.text.fieldLabel }}>
                  End Date
                </h4>
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                  {formatDate(project.endDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1" 
                    style={{ color: brandTheme.text.fieldLabel }}>
                  Progress
                </h4>
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: brandTheme.gray[200] }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress || 0}%`,
                        backgroundColor: project.progress === 100 
                          ? brandTheme.status.success 
                          : brandTheme.primary.navy
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium" 
                        style={{ color: brandTheme.text.secondary }}>
                    {project.progress || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold" 
                  style={{ color: brandTheme.text.fieldLabel }}>
                Tasks ({project.tasks.length})
              </h4>
            </div>

            {project.tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare size={48} style={{ color: brandTheme.gray[400] }} className="mx-auto mb-4" />
                <p style={{ color: brandTheme.text.muted }}>
                  No tasks created for this project yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.tasks.map((task) => {
                  const taskStatusColors = getStatusColor(task.status);
                  const priorityColors = getPriorityColor(task.priority);
                  const taskAssignee = task.assigneeId 
                    ? users.find(user => user.id === task.assigneeId) 
                    : null;

                  return (
                    <div 
                      key={task.id}
                      className="p-4 rounded-lg border transition-colors hover:shadow-sm"
                      style={{ 
                        backgroundColor: brandTheme.background.primary,
                        borderColor: brandTheme.border.light 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium truncate" 
                              style={{ color: brandTheme.text.primary }}>
                            <button
                              onClick={(e) => onTaskClick(task.id, e)}
                              className="text-left hover:underline focus:outline-none focus:underline transition-all"
                              style={{ color: brandTheme.primary.navy }}
                            >
                              {task.name}
                            </button>
                          </h5>
                          {task.description && (
                            <p className="text-sm mt-1 line-clamp-2" 
                               style={{ color: brandTheme.text.muted }}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: taskStatusColors.bg,
                                color: taskStatusColors.text
                              }}
                            >
                              {getStatusText(task.status)}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {task.taskType}
                            </Badge>
                            {task.priority && (
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: priorityColors.bg,
                                  color: priorityColors.text
                                }}
                              >
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          {task.deadline && (
                            <div className="text-right">
                              <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                                Deadline
                              </div>
                              <div className="text-sm font-medium" 
                                   style={{ color: brandTheme.status.warning }}>
                                {formatDate(task.deadline)}
                              </div>
                            </div>
                          )}
                          
                          {taskAssignee && (
                            <UserAvatar user={taskAssignee} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rank Input Modal */}
      <Modal
        isOpen={isRankModalOpen}
        onClose={handleRankCancel}
        title="Set Project Rank"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-4" style={{ color: brandTheme.text.secondary }}>
              Enter a rank number for <strong>{project.name}</strong>. This will determine the project's position in the list.
            </p>
            <div className="flex items-center space-x-2">
              <Hash size={20} style={{ color: brandTheme.text.muted }} />
              <Input
                type="number"
                placeholder="Enter rank number (e.g., 1, 2, 3...)"
                value={rankInput}
                onChange={(e) => setRankInput(e.target.value)}
                min="1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRankSubmit();
                  } else if (e.key === 'Escape') {
                    handleRankCancel();
                  }
                }}
              />
            </div>
            {currentRank && (
              <p className="text-xs mt-2" style={{ color: brandTheme.text.muted }}>
                Current rank: #{currentRank}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleRankCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRankSubmit}
              disabled={!rankInput || parseInt(rankInput, 10) < 1}
            >
              Set Rank
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SortableProjectCard;


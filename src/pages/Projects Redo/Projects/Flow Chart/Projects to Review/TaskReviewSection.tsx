import React, { useEffect, useState } from 'react';
import { CheckSquare, Calendar, Target, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

import { supabase } from '../../../../../lib/supabase';
import TaskUpdateIcon from '../utils/Project Bar/taskupdateicon';
import UpdatesDetailsModal from '../utils/UpdatesDetailsModal';
import TaskDetailsModal from '../utils/Profiles/TaskDetailsModal';
import { useAppContext } from '../../../../../context/AppContext';

interface ReviewTask {
  id: string;
  name: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  progress: number;
  assignee_id: string | null;
  project: {
    id: string;
    name: string;
    flow_chart: string;
  };
}

// Generic function to remove a tag from a task
const removeTagFromTask = async (taskId: string, tagToRemove: string): Promise<void> => {
  try {
    // First get the current task to see its existing tags
    const { data: currentTask, error: fetchError } = await supabase
      .from('PMA_Tasks')
      .select('tags')
      .eq('id', taskId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current task:', fetchError);
      throw fetchError;
    }
    
    // Remove the specified tag from existing tags
    let newTags: string[] = [];
    if (currentTask.tags && Array.isArray(currentTask.tags)) {
      newTags = currentTask.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .filter((tag) => tag !== tagToRemove);
    }
    
    // Update the task with new tags (or null if no tags left)
    const { error: updateError } = await supabase
      .from('PMA_Tasks')
      .update({ 
        tags: newTags.length > 0 ? newTags : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
    if (updateError) {
      console.error('Error updating task tags:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in removeTagFromTask:', error);
    throw error;
  }
};

const TaskReviewSection: React.FC = () => {
  const { refreshData } = useAppContext();
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingTagTaskId, setRemovingTagTaskId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  
  // Updates modal state
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [selectedUpdatesTaskId, setSelectedUpdatesTaskId] = useState<string | null>(null);
  
  // Task details modal state
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<string | null>(null);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      // Refresh AppContext data to ensure TaskDetailsModal has access to tasks
      await refreshData();
      
      // Fetch all tasks with project data and filter in JavaScript to avoid JSONB query issues
      const { data: allTasks, error } = await supabase
        .from('PMA_Tasks')
        .select(`
          *,
          project:PMA_Projects(
            id,
            name,
            flow_chart
          )
        `);
      
      if (error) {
        console.error('Error fetching review tasks:', error);
        throw error;
      }
      
      // Filter for tasks with "Need to Review" tag that belong to Product Development
      const needToReview = (allTasks || [])
        .filter((task: any) => {
          // First check if task has the "Need to Review" tag
          const tags = task.tags || [];
          const hasReviewTag = Array.isArray(tags) && tags.includes('Need to Review');
          
          if (!hasReviewTag) {
            return false;
          }
          
          // Then check if task is associated with Product Development
          // Task is in Product Development flow chart directly
          if (task.flow_chart === 'Product Development') {
            return true;
          }
          // Task belongs to a project in Product Development flow chart
          if (task.project && task.project.flow_chart === 'Product Development') {
            return true;
          }
          return false;
        })
        .map((task: any) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          task_type: task.task_type,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          start_date: task.start_date,
          end_date: task.end_date,
          deadline: task.deadline,
          progress: task.progress || 0,
          assignee_id: task.assignee_id,
          project: task.project || { id: '', name: 'Unknown Project', flow_chart: '' }
        }));
      
      setReviewTasks(needToReview);
    } catch (error) {
      console.error('Error loading review tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update click handlers
  const handleTaskUpdatesClick = (taskId: string) => {
    setSelectedUpdatesTaskId(taskId);
    setShowUpdatesModal(true);
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
    setSelectedUpdatesTaskId(null);
  };

  // Task details handlers
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskForDetails(taskId);
    setShowTaskDetails(true);
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetails(false);
    setSelectedTaskForDetails(null);
  };

  // Remove tag handler
  const handleMarkAsReviewed = async (taskId: string) => {
    setRemovingTagTaskId(taskId);
    try {
      await removeTagFromTask(taskId, 'Need to Review');
      // Refresh data to remove the task from the list
      await loadReviewData();
    } catch (error) {
      console.error('Error removing review tag from task:', error);
      alert('Failed to mark task as reviewed. Please try again.');
    } finally {
      setRemovingTagTaskId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return brandTheme.status.warning;
      case 'in-progress':
        return brandTheme.status.info;
      case 'done':
        return brandTheme.status.success;
      default:
        return brandTheme.text.muted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div 
        className="p-4"
        style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading tasks to review...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4"
      style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
    >
        {/* Collapsible Header */}
        <div 
          className="cursor-pointer transition-colors hover:bg-gray-50 p-2 -m-2 rounded-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown size={20} style={{ color: brandTheme.text.primary }} />
              ) : (
                <ChevronRight size={20} style={{ color: brandTheme.text.primary }} />
              )}
              <CheckSquare size={20} className="mx-2" style={{ color: brandTheme.primary.navy }} />
              <h2 
                className="text-xl font-bold"
                style={{ color: brandTheme.primary.navy }}
              >
                Tasks to Review ({reviewTasks.length})
              </h2>
            </div>
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </div>
          {!isExpanded && (
            <p className="text-sm mt-1 ml-12" style={{ color: brandTheme.text.muted }}>
              Tasks in Product Development tagged as "Need to Review"
            </p>
          )}
        </div>

        {/* Review Tasks List */}
        {isExpanded && (
          <div className="mt-4">
            {reviewTasks.length === 0 ? (
              <div 
                className="text-center py-6 rounded-lg border-2 border-dashed"
                style={{ 
                  backgroundColor: brandTheme.background.secondary,
                  borderColor: brandTheme.border.light
                }}
              >
                <CheckSquare size={32} className="mx-auto mb-2 opacity-50" style={{ color: brandTheme.text.muted }} />
                <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                  No tasks tagged as "Need to Review" found for Product Development.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h3 
                  className="text-md font-semibold mb-3 flex items-center"
                  style={{ color: brandTheme.primary.navy }}
                >
                  <CheckSquare size={16} className="mr-2" />
                  Tasks to Review ({reviewTasks.length})
                </h3>
                <div className="space-y-3">
                  {reviewTasks.map((task) => (
                    <ReviewTaskCard
                      key={`task-${task.id}`}
                      task={task}
                      isRemovingTag={removingTagTaskId === task.id}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                      formatDate={formatDate}
                      onTaskClick={handleTaskClick}
                      onUpdatesClick={handleTaskUpdatesClick}
                      onMarkAsReviewed={handleMarkAsReviewed}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      
      {/* Updates Modal */}
      {showUpdatesModal && selectedUpdatesTaskId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType="task"
          entityId={selectedUpdatesTaskId}
          entityName={(() => {
            const task = reviewTasks.find(t => t.id === selectedUpdatesTaskId);
            return task ? `${task.name} (${task.project.name})` : 'Unknown Task';
          })()}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTaskForDetails && (
        <TaskDetailsModal
          isOpen={showTaskDetails}
          onClose={handleCloseTaskDetails}
          taskId={selectedTaskForDetails}
        />
      )}
    </div>
  );
};

interface ReviewTaskCardProps {
  task: ReviewTask;
  isRemovingTag: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (dateString: string) => string;
  onTaskClick: (taskId: string) => void;
  onUpdatesClick: (taskId: string) => void;
  onMarkAsReviewed: (taskId: string) => void;
}

const ReviewTaskCard: React.FC<ReviewTaskCardProps> = ({
  task,
  isRemovingTag,
  getStatusColor,
  getPriorityColor,
  formatDate,
  onTaskClick,
  onUpdatesClick,
  onMarkAsReviewed
}) => {
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: brandTheme.background.secondary,
        borderColor: brandTheme.border.light
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold mb-1 cursor-pointer hover:underline transition-all"
            style={{ color: brandTheme.primary.navy }}
            onClick={() => onTaskClick(task.id)}
          >
            {task.name}
          </h3>
          <p 
            className="text-sm mb-2 font-medium"
            style={{ color: brandTheme.text.secondary }}
          >
            Project: {task.project.name}
            {task.project.flow_chart && (
              <span 
                className="ml-2 px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: brandTheme.primary.navy + '20',
                  color: brandTheme.primary.navy
                }}
              >
                {task.project.flow_chart}
              </span>
            )}
          </p>
          {task.description && (
            <p 
              className="mb-2 text-sm"
              style={{ color: brandTheme.text.secondary }}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mb-2">
            <span 
              className="px-2 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: getStatusColor(task.status) + '20',
                color: getStatusColor(task.status)
              }}
            >
              {task.status}
            </span>
            <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority} Priority
            </span>
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              Type: {task.task_type}
            </span>
          </div>
          
          {/* Dates */}
          <div className="flex items-center space-x-4 text-sm mb-2">
            {task.start_date && (
              <div className="flex items-center space-x-1">
                <Calendar size={14} style={{ color: brandTheme.text.muted }} />
                <span style={{ color: brandTheme.text.muted }}>
                  {formatDate(task.start_date)}
                  {task.end_date && task.end_date !== task.start_date && 
                    ` - ${formatDate(task.end_date)}`
                  }
                </span>
              </div>
            )}
            
            {task.deadline && (
              <div className="flex items-center space-x-1">
                <Target size={14} style={{ color: brandTheme.status.warning }} />
                <span style={{ color: brandTheme.status.warning }}>
                  Due: {formatDate(task.deadline)}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          {task.progress > 0 && (
            <div className="mb-2">
              <span 
                className="text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                Progress: {task.progress}%
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <TaskUpdateIcon
            taskId={task.id}
            unreadCount={0} // TODO: Implement actual unread count
            totalCount={0} // TODO: Implement actual total count
            onClick={onUpdatesClick}
          />
          <div className="flex items-center">
            <CheckSquare size={16} className="text-blue-600" />
            <span className="ml-1 text-xs font-medium text-blue-600">Need to Review</span>
          </div>
        </div>
      </div>
      
      {/* Mark as Reviewed Section */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
        <div className="flex justify-end">
          <button
            onClick={() => onMarkAsReviewed(task.id)}
            disabled={isRemovingTag}
            className="flex items-center px-3 py-1 text-sm rounded-md border hover:bg-green-50 transition-colors disabled:opacity-50"
            style={{
              borderColor: brandTheme.status.success,
              color: brandTheme.status.success
            }}
          >
            <CheckCircle size={14} className="mr-1" />
            {isRemovingTag ? 'Marking as Reviewed...' : 'Mark as Reviewed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskReviewSection;

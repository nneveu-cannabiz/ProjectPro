import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, SubTask } from '../../../../types';
import { Clock, ChevronRight, FolderOpen, Search, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { brandTheme } from '../../../../styles/brandTheme';

interface AssignedProjectsTasksListProps {
  tasks: (Task & { project: Project })[];
  onTaskClick: (task: Task) => void;
}

const AssignedProjectsTasksList: React.FC<AssignedProjectsTasksListProps> = ({ tasks, onTaskClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all subtasks for the tasks
  useEffect(() => {
    const fetchSubtasks = async () => {
      if (tasks.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const taskIds = tasks.map(t => t.id);
        const { data, error } = await supabase
          .from('PMA_SubTasks')
          .select('*')
          .in('task_id', taskIds)
          .in('status', ['todo', 'in-progress']);

        if (error) throw error;
        setSubtasks(data as any || []);
      } catch (error) {
        console.error('Error fetching subtasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubtasks();
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Very Low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and group tasks/subtasks by search query
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Create a map of subtasks by taskId
    const subtasksByTaskId = subtasks.reduce((acc, subtask) => {
      const taskId = (subtask as any).task_id || subtask.taskId;
      if (!acc[taskId]) {
        acc[taskId] = [];
      }
      acc[taskId].push(subtask);
      return acc;
    }, {} as Record<string, SubTask[]>);

    // Filter tasks and their subtasks
    const filteredTasks = tasks.filter(task => {
      if (!query) return true;
      
      const taskMatches = task.name.toLowerCase().includes(query) || 
                          task.description?.toLowerCase().includes(query) ||
                          task.project.name.toLowerCase().includes(query);
      
      const subtaskMatches = subtasksByTaskId[task.id]?.some(st => 
        st.name.toLowerCase().includes(query) || 
        st.description?.toLowerCase().includes(query)
      );
      
      return taskMatches || subtaskMatches;
    });

    // Group by project
    const grouped = filteredTasks.reduce((acc, task) => {
      const projectId = task.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: task.project,
          tasks: []
        };
      }
      
      const taskSubtasks = subtasksByTaskId[task.id] || [];
      const filteredSubtasks = !query 
        ? taskSubtasks 
        : taskSubtasks.filter(st => 
            st.name.toLowerCase().includes(query) || 
            st.description?.toLowerCase().includes(query)
          );
      
      acc[projectId].tasks.push({
        task,
        subtasks: filteredSubtasks
      });
      return acc;
    }, {} as Record<string, { project: Project; tasks: { task: Task & { project: Project }; subtasks: SubTask[] }[] }>);

    return grouped;
  }, [tasks, subtasks, searchQuery]);

  const totalCount = useMemo(() => {
    let taskCount = 0;
    let subtaskCount = 0;
    Object.values(filteredData).forEach(({ tasks }) => {
      taskCount += tasks.length;
      tasks.forEach(({ subtasks }) => {
        subtaskCount += subtasks.length;
      });
    });
    return { taskCount, subtaskCount };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="w-8 h-8 animate-spin" style={{ color: brandTheme.primary.navy }} />
        <span className="ml-3" style={{ color: brandTheme.text.secondary }}>Loading tasks...</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
        <p className="text-sm" style={{ color: brandTheme.text.secondary }}>No active tasks available.</p>
        <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>Tasks with status "To Do" or "In Progress" will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 pb-4" style={{ backgroundColor: brandTheme.background.primary }}>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: brandTheme.text.muted }} />
            <input
              type="text"
              placeholder="Search tasks and subtasks by name, description, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: brandTheme.background.secondary,
                borderColor: brandTheme.border.medium,
                color: brandTheme.text.primary,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
            Click on any task or subtask to log hours. All active items (To Do or In Progress) are shown below.
          </div>
          <div className="text-sm font-medium flex items-center gap-3" style={{ color: brandTheme.primary.navy }}>
            <span>{totalCount.taskCount} task{totalCount.taskCount !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{totalCount.subtaskCount} subtask{totalCount.subtaskCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Projects and Tasks List */}
      {Object.keys(filteredData).length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>No tasks or subtasks match your search.</p>
          <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredData).map(([projectId, { project, tasks: projectTasks }]) => (
            <div 
              key={projectId} 
              className="rounded-lg overflow-hidden shadow-sm border"
              style={{ 
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.primary 
              }}
            >
              {/* Project Header */}
              <div 
                className="px-5 py-4 border-b"
                style={{ 
                  backgroundColor: brandTheme.primary.paleBlue,
                  borderColor: brandTheme.border.light 
                }}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
                  <span className="font-bold text-lg" style={{ color: brandTheme.text.primary }}>
                    {project.name}
                  </span>
                  <span className="text-sm px-2 py-1 rounded-full" style={{ 
                    backgroundColor: brandTheme.background.primary,
                    color: brandTheme.text.secondary 
                  }}>
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm mt-2" style={{ color: brandTheme.text.secondary }}>
                    {project.description}
                  </p>
                )}
              </div>

              {/* Tasks and Subtasks List */}
              <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
                {projectTasks.map(({ task, subtasks: taskSubtasks }) => (
                  <div key={task.id}>
                    {/* Task Row */}
                    <div
                      onClick={() => onTaskClick(task)}
                      className="px-5 py-4 cursor-pointer transition-all group"
                      style={{
                        backgroundColor: brandTheme.background.primary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = brandTheme.background.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = brandTheme.background.primary;
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-base font-semibold" style={{ color: brandTheme.text.primary }}>
                              {task.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('-', ' ').toUpperCase()}
                            </span>
                            {task.priority && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                            {taskSubtasks.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded" style={{ 
                                backgroundColor: brandTheme.primary.paleBlue,
                                color: brandTheme.primary.navy 
                              }}>
                                {taskSubtasks.length} subtask{taskSubtasks.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm mb-2" style={{ color: brandTheme.text.secondary }}>
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs" style={{ color: brandTheme.text.muted }}>
                            <span>Type: {task.taskType}</span>
                            {task.deadline && (
                              <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-xs text-right" style={{ color: brandTheme.text.muted }}>
                            Click to log hours
                          </div>
                          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: brandTheme.primary.navy }} />
                        </div>
                      </div>
                    </div>

                    {/* Subtasks */}
                    {taskSubtasks.length > 0 && (
                      <div 
                        className="pl-12 pr-5 py-2 space-y-1"
                        style={{ backgroundColor: brandTheme.background.secondary }}
                      >
                        {taskSubtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            onClick={() => onTaskClick(task)}
                            className="px-4 py-3 rounded-lg cursor-pointer transition-all group"
                            style={{ backgroundColor: brandTheme.background.primary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = brandTheme.background.primary;
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm" style={{ color: brandTheme.text.muted }}>↳</span>
                                  <h5 className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                                    {subtask.name}
                                  </h5>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                                    {subtask.status.replace('-', ' ').toUpperCase()}
                                  </span>
                                </div>
                                
                                {subtask.description && (
                                  <p className="text-xs pl-4" style={{ color: brandTheme.text.secondary }}>
                                    {subtask.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                                  Log hours
                                </div>
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: brandTheme.primary.lightBlue }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedProjectsTasksList;

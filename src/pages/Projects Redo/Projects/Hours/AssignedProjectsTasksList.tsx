import React from 'react';
import { Task, Project } from '../../../../types';
import { Clock, ChevronRight, FolderOpen } from 'lucide-react';

interface AssignedProjectsTasksListProps {
  tasks: (Task & { project: Project })[];
  onTaskClick: (task: Task) => void;
}

const AssignedProjectsTasksList: React.FC<AssignedProjectsTasksListProps> = ({ tasks, onTaskClick }) => {

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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No active tasks available.</p>
        <p className="text-gray-400 text-xs mt-1">Tasks with status "To Do" or "In Progress" will appear here.</p>
      </div>
    );
  }

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId;
    if (!acc[projectId]) {
      acc[projectId] = {
        project: task.project,
        tasks: []
      };
    }
    acc[projectId].tasks.push(task);
    return acc;
  }, {} as Record<string, { project: Project; tasks: (Task & { project: Project })[] }>);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Click on any task to log hours. All active tasks (Todo or In Progress) from all projects are shown below.
      </div>

      {Object.entries(tasksByProject).map(([projectId, { project, tasks }]) => (
        <div key={projectId} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Project Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">
                {project.name}
              </span>
              <span className="text-xs text-gray-500">
                ({tasks.length} task{tasks.length !== 1 ? 's' : ''})
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-gray-600 mt-1">{project.description}</p>
            )}
          </div>

          {/* Tasks List */}
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      {task.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Type: {task.taskType}</span>
                      {task.deadline && (
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-xs text-gray-500 text-right">
                      Click to log hours
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssignedProjectsTasksList;

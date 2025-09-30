import React from 'react';
import { User, Task, Project } from '../../../../types';
import { CheckSquare, Clock, CheckCircle } from 'lucide-react';

interface UserColumnProps {
  user: User;
  tasks: {
    todo: (Task & { project: Project })[];
    inProgress: (Task & { project: Project })[];
    done: (Task & { project: Project })[];
  };
}

const UserColumn: React.FC<UserColumnProps> = ({ user, tasks }) => {
  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getTaskPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return 'border-l-red-500 bg-red-50';
      case 'High':
        return 'border-l-orange-500 bg-orange-50';
      case 'Medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'Low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const TaskCard: React.FC<{ task: Task & { project: Project } }> = ({ task }) => (
    <div className={`p-3 mb-2 rounded-lg border-l-4 ${getTaskPriorityColor(task.priority)} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.name}</h4>
        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
          {task.priority || 'Medium'}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-600 font-medium">{task.project.name}</span>
        {task.deadline && (
          <span className="text-xs text-gray-500">
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 w-80 flex-shrink-0">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: user.profileColor || '#2563eb' }}
        >
          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{getUserDisplayName(user)}</h3>
          <p className="text-sm text-gray-600">{user.department || 'Product Development'}</p>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="space-y-4">
        {/* To Do Column */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900 text-sm">To Do</h4>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              {tasks.todo.length}
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.todo.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tasks
              </div>
            ) : (
              tasks.todo.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-900 text-sm">In Progress</h4>
            <span className="text-xs text-gray-500 bg-blue-200 px-2 py-1 rounded-full">
              {tasks.inProgress.length}
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.inProgress.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tasks
              </div>
            ) : (
              tasks.inProgress.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-900 text-sm">Done</h4>
            <span className="text-xs text-gray-500 bg-green-200 px-2 py-1 rounded-full">
              {tasks.done.length}
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.done.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tasks
              </div>
            ) : (
              tasks.done.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserColumn;

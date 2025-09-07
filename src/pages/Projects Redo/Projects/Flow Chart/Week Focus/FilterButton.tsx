import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { User } from '../../../../../types';
import UserAvatar from '../../../../../components/UserAvatar';

export interface FilterOptions {
  projectStatuses: string[];
  taskStatuses: string[];
  assignees: string[];
  excludeOngoingProjects: boolean;
}

interface FilterButtonProps {
  users: User[];
  currentFilters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  users,
  currentFilters,
  onFiltersChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Available filter options
  const projectStatuses = ['todo', 'in-progress', 'done', 'on-hold'];
  const taskStatuses = ['todo', 'in-progress', 'done', 'blocked'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = 
    currentFilters.projectStatuses.length > 0 ||
    currentFilters.taskStatuses.length > 0 ||
    currentFilters.assignees.length > 0 ||
    currentFilters.excludeOngoingProjects;

  // Handle status filter toggle
  const toggleStatusFilter = (status: string, type: 'project' | 'task') => {
    const filterKey = type === 'project' ? 'projectStatuses' : 'taskStatuses';
    const currentStatuses = currentFilters[filterKey];
    
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...currentFilters,
      [filterKey]: newStatuses
    });
  };

  // Handle assignee filter toggle
  const toggleAssigneeFilter = (userId: string) => {
    const currentAssignees = currentFilters.assignees;
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];

    onFiltersChange({
      ...currentFilters,
      assignees: newAssignees
    });
  };

  // Handle ongoing projects filter toggle
  const toggleOngoingProjectsFilter = () => {
    onFiltersChange({
      ...currentFilters,
      excludeOngoingProjects: !currentFilters.excludeOngoingProjects
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      projectStatuses: [],
      taskStatuses: [],
      assignees: [],
      excludeOngoingProjects: false
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return brandTheme.status.success;
      case 'in-progress':
        return brandTheme.status.warning;
      case 'todo':
        return brandTheme.gray[600];
      case 'on-hold':
      case 'blocked':
        return brandTheme.status.error;
      default:
        return brandTheme.text.muted;
    }
  };

  // Format status display name
  const formatStatusName = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors relative ${
          hasActiveFilters ? 'bg-blue-100' : 'hover:bg-gray-100'
        }`}
        title="Filter projects and tasks"
      >
        <Filter 
          size={16} 
          style={{ 
            color: hasActiveFilters ? brandTheme.primary.navy : 'white'
          }} 
        />
        {hasActiveFilters && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: brandTheme.status.error }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50"
          style={{ borderColor: brandTheme.border.light }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 border-b"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h3 
              className="font-semibold text-sm"
              style={{ color: brandTheme.text.primary }}
            >
              Filter Options
            </h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  style={{ color: brandTheme.text.muted }}
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                style={{ color: brandTheme.text.muted }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div 
            className="flex border-b"
            style={{ borderColor: brandTheme.border.light }}
          >
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'projects' 
                  ? 'border-b-2 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              style={{ 
                color: activeTab === 'projects' 
                  ? brandTheme.primary.navy 
                  : brandTheme.text.muted 
              }}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'tasks' 
                  ? 'border-b-2 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              style={{ 
                color: activeTab === 'tasks' 
                  ? brandTheme.primary.navy 
                  : brandTheme.text.muted 
              }}
            >
              Tasks
            </button>
          </div>

          {/* Content */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {activeTab === 'projects' ? (
              <div className="space-y-4">
                {/* Project Status Filters */}
                <div>
                  <h4 
                    className="text-xs font-medium mb-2 uppercase tracking-wide"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Project Status
                  </h4>
                  <div className="space-y-2">
                    {projectStatuses.map(status => (
                      <label
                        key={status}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={currentFilters.projectStatuses.includes(status)}
                            onChange={() => toggleStatusFilter(status, 'project')}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              currentFilters.projectStatuses.includes(status)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {currentFilters.projectStatuses.includes(status) && (
                              <Check size={12} color="white" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <span 
                            className="text-sm"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {formatStatusName(status)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exclude Ongoing Projects */}
                <div>
                  <h4 
                    className="text-xs font-medium mb-2 uppercase tracking-wide"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Project Type
                  </h4>
                  <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={currentFilters.excludeOngoingProjects}
                        onChange={toggleOngoingProjectsFilter}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          currentFilters.excludeOngoingProjects
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentFilters.excludeOngoingProjects && (
                          <Check size={12} color="white" />
                        )}
                      </div>
                    </div>
                    <span 
                      className="text-sm ml-3"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Exclude Ongoing Projects
                    </span>
                  </label>
                </div>

                {/* Project Assignees */}
                <div>
                  <h4 
                    className="text-xs font-medium mb-2 uppercase tracking-wide"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Project Assignee
                  </h4>
                  <div className="space-y-2">
                    {users.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={currentFilters.assignees.includes(user.id)}
                            onChange={() => toggleAssigneeFilter(user.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              currentFilters.assignees.includes(user.id)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {currentFilters.assignees.includes(user.id) && (
                              <Check size={12} color="white" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          <UserAvatar user={user} size="xs" />
                          <span 
                            className="text-sm ml-2"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Task Status Filters */}
                <div>
                  <h4 
                    className="text-xs font-medium mb-2 uppercase tracking-wide"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Task Status
                  </h4>
                  <div className="space-y-2">
                    {taskStatuses.map(status => (
                      <label
                        key={status}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={currentFilters.taskStatuses.includes(status)}
                            onChange={() => toggleStatusFilter(status, 'task')}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              currentFilters.taskStatuses.includes(status)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {currentFilters.taskStatuses.includes(status) && (
                              <Check size={12} color="white" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <span 
                            className="text-sm"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {formatStatusName(status)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Task Assignees */}
                <div>
                  <h4 
                    className="text-xs font-medium mb-2 uppercase tracking-wide"
                    style={{ color: brandTheme.text.muted }}
                  >
                    Task Assignee
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={currentFilters.assignees.includes('unassigned')}
                          onChange={() => toggleAssigneeFilter('unassigned')}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            currentFilters.assignees.includes('unassigned')
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {currentFilters.assignees.includes('unassigned') && (
                            <Check size={12} color="white" />
                          )}
                        </div>
                      </div>
                      <span 
                        className="text-sm ml-3"
                        style={{ color: brandTheme.text.primary }}
                      >
                        Unassigned Tasks
                      </span>
                    </label>
                    {users.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={currentFilters.assignees.includes(user.id)}
                            onChange={() => toggleAssigneeFilter(user.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              currentFilters.assignees.includes(user.id)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {currentFilters.assignees.includes(user.id) && (
                              <Check size={12} color="white" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          <UserAvatar user={user} size="xs" />
                          <span 
                            className="text-sm ml-2"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton;

import React, { useState, useMemo } from 'react';
import { Hour, Task, Project } from '../../../../types';
import { Calendar, Clock, FolderOpen, Filter } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface LoggedHoursProps {
  hours: (Hour & { task: Task; project: Project })[];
}

type SortOption = 'date-desc' | 'date-asc' | 'hours-desc' | 'hours-asc' | 'project' | 'task';
type FilterOption = 'all' | 'this-week' | 'this-month' | 'last-30-days';

const LoggedHours: React.FC<LoggedHoursProps> = ({ hours }) => {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getDateFilter = (filter: FilterOption, date: string) => {
    const entryDate = new Date(date);
    const now = new Date();
    
    switch (filter) {
      case 'this-week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return entryDate >= startOfWeek;
      }
      case 'this-month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return entryDate >= startOfMonth;
      }
      case 'last-30-days': {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return entryDate >= thirtyDaysAgo;
      }
      default:
        return true;
    }
  };

  const filteredAndSortedHours = useMemo(() => {
    // Filter first
    let filtered = hours.filter(hour => getDateFilter(filterBy, hour.date));
    
    // Then sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'hours-desc':
          return b.hours - a.hours;
        case 'hours-asc':
          return a.hours - b.hours;
        case 'project':
          return a.project.name.localeCompare(b.project.name);
        case 'task':
          return a.task.name.localeCompare(b.task.name);
        default:
          return 0;
      }
    });
  }, [hours, sortBy, filterBy]);

  const totalHours = filteredAndSortedHours.reduce((sum, hour) => sum + hour.hours, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getFilterLabel = (filter: FilterOption) => {
    switch (filter) {
      case 'this-week': return 'This Week';
      case 'this-month': return 'This Month';
      case 'last-30-days': return 'Last 30 Days';
      default: return 'All Time';
    }
  };

  if (hours.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No hours logged yet.</p>
        <p className="text-gray-400 text-xs mt-1">Your logged hours will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredAndSortedHours.length}</span> entries • 
            <span className="font-medium ml-1">{totalHours.toFixed(2)}</span> hours total
            {filterBy !== 'all' && (
              <span className="text-gray-500 ml-1">({getFilterLabel(filterBy)})</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-30-days">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="hours-desc">Hours (High to Low)</option>
                <option value="hours-asc">Hours (Low to High)</option>
                <option value="project">Project Name</option>
                <option value="task">Task Name</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Hours List */}
      <div className="space-y-2">
        {filteredAndSortedHours.map((hour) => (
          <div
            key={hour.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(hour.date)}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">
                    {new Date(hour.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {hour.project.name}
                    </span>
                  </div>
                  
                  <div className="ml-6">
                    <p className="text-sm text-gray-900 font-medium">
                      {hour.task.name}
                    </p>
                    {hour.task.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {hour.task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 ml-6 flex items-center gap-4 text-xs text-gray-500">
                  <span>Task Type: {hour.task.taskType}</span>
                  <span>Status: {hour.task.status.replace('-', ' ')}</span>
                  {hour.task.priority && (
                    <span>Priority: {hour.task.priority}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                    <Clock className="w-4 h-4" />
                    {hour.hours}h
                  </div>
                  <div className="text-xs text-gray-500">
                    Logged {new Date(hour.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedHours.length === 0 && hours.length > 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hours found for the selected filter.</p>
          <p className="text-gray-400 text-xs mt-1">Try adjusting your filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LoggedHours;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchHoursWithTaskDetails, updateHourEntry, deleteHourEntry } from '../../../../data/supabase-store';
import { Hour, Task, Project } from '../../../../types';
import { Clock, Calendar, FolderOpen, Filter, ChevronDown, Edit2, Save, X, Trash2, CheckCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { brandTheme } from '../../../../styles/brandTheme';

type SortOption = 'date-desc' | 'date-asc' | 'hours-desc' | 'hours-asc' | 'project' | 'task';
type FilterOption = 'all' | 'this-week' | 'this-month' | 'last-30-days';

const MyHours: React.FC = () => {
  const { currentUser } = useAuth();
  const [hoursData, setHoursData] = useState<(Hour & { task: Task; project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadHoursData = async () => {
      if (!currentUser?.id) return;

      setLoading(true);
      try {
        const data = await fetchHoursWithTaskDetails(currentUser.id);
        setHoursData(data);
      } catch (error) {
        console.error('Failed to load hours data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHoursData();
  }, [currentUser?.id]);

  const handleEditClick = (hour: Hour & { task: Task; project: Project }) => {
    setEditingId(hour.id);
    setEditHours(hour.hours.toString());
    setEditDate(hour.date);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHours('');
    setEditDate('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editHours || parseFloat(editHours) <= 0 || !editDate) return;

    setIsUpdating(true);
    try {
      await updateHourEntry(editingId, parseFloat(editHours), editDate);
      
      // Update local state
      setHoursData(prevData => 
        prevData.map(hour => 
          hour.id === editingId 
            ? { ...hour, hours: parseFloat(editHours), date: editDate, updatedAt: new Date().toISOString() }
            : hour
        )
      );

      setSuccessMessage('Hours updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to update hours:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (hourId: string) => {
    if (!window.confirm('Are you sure you want to delete this hour entry? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(hourId);
    try {
      await deleteHourEntry(hourId);
      
      // Remove from local state
      setHoursData(prevData => prevData.filter(hour => hour.id !== hourId));
      
      setSuccessMessage('Hour entry deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete hour entry:', error);
    } finally {
      setIsDeleting(null);
    }
  };

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

  const filteredAndSortedHours = React.useMemo(() => {
    // Filter first
    let filtered = hoursData.filter(hour => getDateFilter(filterBy, hour.date));
    
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
  }, [hoursData, sortBy, filterBy]);

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

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: brandTheme.text.primary }}>My Hours</h2>
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin" style={{ color: brandTheme.primary.navy }} />
          <span className="ml-3" style={{ color: brandTheme.text.secondary }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {successMessage && (
        <div 
          className="mb-4 p-3 rounded-lg flex items-center gap-2 border"
          style={{
            backgroundColor: '#D1FAE5',
            borderColor: brandTheme.status.success,
            color: brandTheme.status.success,
          }}
        >
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>My Hours</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <div className="text-sm font-medium flex items-center gap-2" style={{ color: brandTheme.primary.navy }}>
            <span>{filteredAndSortedHours.length} entries</span>
            <span>•</span>
            <span>{totalHours.toFixed(1)}h</span>
            {filterBy !== 'all' && (
              <span className="text-xs px-2 py-1 rounded" style={{ 
                backgroundColor: brandTheme.primary.paleBlue, 
                color: brandTheme.text.secondary 
              }}>
                {getFilterLabel(filterBy)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div 
          className="p-4 rounded-lg border mb-4"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light
          }}
        >
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
      {filteredAndSortedHours.length === 0 ? (
        <div 
          className="text-center py-12 rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light
          }}
        >
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: brandTheme.text.primary }}>No hours logged yet</h3>
          <p className="text-sm mb-4" style={{ color: brandTheme.text.secondary }}>
            {hoursData.length === 0 
              ? "Start logging your hours to see them here." 
              : "No hours found for the selected filter."}
          </p>
          {hoursData.length > 0 && filterBy !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterBy('all')}
            >
              Show All Hours
            </Button>
          )}
        </div>
      ) : (
        <div 
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light
          }}
        >
          <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
            {filteredAndSortedHours.map((hour) => (
              <div 
                key={hour.id} 
                className="p-4 transition-colors"
                style={{ backgroundColor: brandTheme.background.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandTheme.background.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandTheme.background.primary;
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === hour.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">Editing Entry</span>
                        </div>

                        <div className="space-y-3 bg-blue-50 p-3 rounded-md">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Hours
                              </label>
                              <Input
                                type="number"
                                value={editHours}
                                onChange={(e) => setEditHours(e.target.value)}
                                placeholder="0.00"
                                step="0.25"
                                min="0.25"
                                max="24"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={handleSaveEdit}
                              disabled={isUpdating || !editHours || parseFloat(editHours) <= 0 || !editDate}
                              className="flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              {isUpdating ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={isUpdating}
                              className="flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>

                        {/* Task Info (Read-only during edit) */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
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
                            <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
                          <span>Type: {hour.task.taskType}</span>
                          <span>Status: {hour.task.status.replace('-', ' ')}</span>
                          {hour.task.priority && (
                            <span>Priority: {hour.task.priority}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingId === hour.id ? (
                      // Edit mode - show hours being edited
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Original: {hour.hours}h
                        </div>
                      </div>
                    ) : (
                      // View mode - show hours and actions
                      <>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-blue-600 group">
                            <Clock className="w-4 h-4" />
                            {hour.hours}h
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEditClick(hour)}
                                className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                                title="Edit hours"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600 hover:text-blue-700" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(hour.id)}
                                disabled={isDeleting === hour.id}
                                className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                title="Delete entry"
                              >
                                {isDeleting === hour.id ? (
                                  <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                                ) : (
                                  <Trash2 className="w-3 h-3 text-red-600 hover:text-red-700" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Logged {new Date(hour.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHours;

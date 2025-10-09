import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Mail,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  PlayCircle,
  Eye,
  Search,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { brandTheme } from '../../styles/brandTheme';

interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  request_type: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  submitter_department: string | null;
  status: string;
  assigned_to: string | null;
  reviewed_by: string | null;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  internal_notes: string | null;
  response_notes: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  image_attachment_url: string | null;
  related_project_id: string | null;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

const ProjectsToDiscuss: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { value: 'in_review', label: 'In Review', icon: Eye, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
    { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-gray-100 text-gray-800' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    fetchProjectRequests();
    fetchUsers();
  }, []);

  const fetchProjectRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('PMA_Requests')
        .select('*')
        .eq('request_type', 'project')
        .eq('title', 'Project to Discuss')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching project requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Users')
        .select('id, email, first_name, last_name')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string, assignedTo?: string) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'in_review' && !requests.find((r) => r.id === requestId)?.reviewed_by) {
        updates.reviewed_by = currentUser?.id;
        updates.reviewed_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      if (assignedTo !== undefined) {
        updates.assigned_to = assignedTo;
      }

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      await fetchProjectRequests();
    } catch (err: any) {
      console.error('Error updating request:', err);
      setError(err.message);
    }
  };

  const updateRequestETA = async (requestId: string, etaDate: string) => {
    try {
      const updates: any = {
        expected_completion_date: etaDate || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      await fetchProjectRequests();
    } catch (err: any) {
      console.error('Error updating ETA:', err);
      setError(err.message);
    }
  };

  const updateInternalNotes = async (requestId: string, notes: string) => {
    try {
      const updates: any = {
        internal_notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      await fetchProjectRequests();
      // Clear editing state for this request
      setEditingNotes((prev) => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (err: any) {
      console.error('Error updating internal notes:', err);
      setError(err.message);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority: string) => {
    return priorities.find((p) => p.value === priority) || priorities[1];
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesSearch =
      searchTerm === '' ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatETADate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const toggleCardExpansion = (requestId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Calculate statistics
  const statistics = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === 'submitted').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    overdue: requests.filter(
      (r) =>
        r.expected_completion_date &&
        new Date(r.expected_completion_date) < new Date() &&
        r.status !== 'completed'
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: brandTheme.primary.navy }}
          />
          <p className="mt-4" style={{ color: brandTheme.text.secondary }}>
            Loading project requests...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error loading project requests</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={fetchProjectRequests}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: brandTheme.background.primary }}>
      <div className="max-w-[95%] mx-auto p-6">
        {/* Header */}
        <div
          className="rounded-lg shadow-sm p-6 mb-6"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Projects to Discuss</h1>
              <p className="text-white opacity-90">
                Team requests for new projects submitted to the Product Development team
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-10 h-10 text-white" />
              <button
                onClick={fetchProjectRequests}
                className="flex items-center px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors shadow-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.text.secondary}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Total
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.text.primary }}>
                  {statistics.total}
                </p>
              </div>
              <BarChart3 className="w-8 h-8" style={{ color: brandTheme.text.muted }} />
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.primary.lightBlue}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Submitted
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.primary.navy }}>
                  {statistics.submitted}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: brandTheme.primary.lightBlue }} />
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid #f59e0b`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  In Progress
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#f59e0b' }}>
                  {statistics.inProgress}
                </p>
              </div>
              <PlayCircle className="w-8 h-8" style={{ color: '#f59e0b' }} />
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.status.success}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Completed
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.status.success }}>
                  {statistics.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: brandTheme.status.success }} />
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm p-6"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderLeft: `4px solid ${brandTheme.status.error}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>
                  Overdue
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: brandTheme.status.error }}>
                  {statistics.overdue}
                </p>
              </div>
              <AlertCircle className="w-8 h-8" style={{ color: brandTheme.status.error }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="rounded-lg shadow-sm border p-6 mb-6"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: brandTheme.text.primary }}>
            Filters & Search
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: brandTheme.text.secondary }}
              >
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: brandTheme.border.medium,
                  backgroundColor: brandTheme.background.primary,
                  color: brandTheme.text.primary,
                }}
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: brandTheme.text.secondary }}
              >
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: brandTheme.border.medium,
                  backgroundColor: brandTheme.background.primary,
                  color: brandTheme.text.primary,
                }}
              >
                <option value="all">All Priorities</option>
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: brandTheme.text.secondary }}
              >
                Search
              </label>
              <div className="relative">
                <Search
                  className="w-5 h-5 absolute left-3 top-3"
                  style={{ color: brandTheme.text.muted }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, or submitter..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.primary,
                    color: brandTheme.text.primary,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
              Showing <span className="font-semibold" style={{ color: brandTheme.text.primary }}>{filteredRequests.length}</span> of{' '}
              <span className="font-semibold" style={{ color: brandTheme.text.primary }}>{requests.length}</span> project requests
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSearchTerm('');
              }}
              className="text-sm font-medium transition-colors hover:underline"
              style={{ color: brandTheme.primary.navy }}
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* Project Requests List */}
        <div
          className="rounded-lg shadow-sm border mb-6"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto mb-4" style={{ color: brandTheme.text.muted }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: brandTheme.text.primary }}>
                No project requests found
              </h3>
              <p style={{ color: brandTheme.text.secondary }}>
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No requests match your current filters. Try adjusting your search criteria.'
                  : 'No project requests have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: brandTheme.border.light }}>
              {filteredRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const priorityInfo = getPriorityInfo(request.priority);
                const isExpanded = expandedCards.has(request.id);

                return (
                  <div
                    key={request.id}
                    className="p-6 hover:bg-opacity-50 transition-all duration-200"
                    style={{
                      borderLeft: `4px solid ${brandTheme.primary.navy}`,
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Title and badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap items-center gap-3 flex-1">
                            <h3
                              className="text-xl font-semibold cursor-pointer hover:underline"
                              style={{ color: brandTheme.primary.navy }}
                              onClick={() => toggleCardExpansion(request.id)}
                            >
                              {request.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${priorityInfo.color}`}
                              >
                                {priorityInfo.label}
                              </span>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                              >
                                <statusInfo.icon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCardExpansion(request.id)}
                            className="p-2 rounded hover:bg-blue-100 transition-colors"
                            style={{ color: brandTheme.primary.navy }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                        <p className="mb-4 leading-relaxed" style={{ color: brandTheme.text.primary }}>
                          {request.description}
                        </p>

                        {/* Request metadata */}
                        <div className="space-y-3">
                          {/* Submitter Info Row */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center" style={{ color: brandTheme.text.secondary }}>
                              <User className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: brandTheme.text.muted }} />
                              <span className="font-medium whitespace-nowrap">Submitter:</span>
                              <span className="ml-1" style={{ color: brandTheme.text.primary }}>
                                {request.submitter_name}
                              </span>
                            </div>
                            <div className="flex items-center" style={{ color: brandTheme.text.secondary }}>
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: brandTheme.text.muted }} />
                              <span className="font-medium whitespace-nowrap">Email:</span>
                              <span className="ml-1 truncate" style={{ color: brandTheme.text.primary }}>
                                {request.submitter_email}
                              </span>
                            </div>
                            {request.submitter_department && (
                              <div className="flex items-center" style={{ color: brandTheme.text.secondary }}>
                                <Building className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: brandTheme.text.muted }} />
                                <span className="font-medium whitespace-nowrap">Department:</span>
                                <span className="ml-1" style={{ color: brandTheme.text.primary }}>
                                  {request.submitter_department}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status Info Row */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center" style={{ color: brandTheme.text.secondary }}>
                              <Clock className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: brandTheme.text.muted }} />
                              <span className="font-medium whitespace-nowrap">Created:</span>
                              <span className="ml-1" style={{ color: brandTheme.text.primary }}>
                                {formatDate(request.created_at)}
                              </span>
                            </div>
                            {request.assigned_to && (
                              <div className="flex items-center text-green-600">
                                <User className="w-4 h-4 mr-2 flex-shrink-0 text-green-500" />
                                <span className="font-medium whitespace-nowrap">Assigned to:</span>
                                <span className="ml-1 font-semibold">{getUserName(request.assigned_to)}</span>
                              </div>
                            )}
                            {request.expected_completion_date && (
                              <div className="flex items-center text-orange-600">
                                <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
                                <span className="font-medium whitespace-nowrap">ETA:</span>
                                <span className="ml-1 font-semibold">
                                  {formatETADate(request.expected_completion_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preview indicators when collapsed */}
                        {!isExpanded && request.image_attachment_url && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
                              <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                                Has Attachment
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Controls - Always Visible */}
                      <div className="lg:ml-6 lg:w-80 flex-shrink-0">
                        <div
                          className="rounded-lg p-4 border"
                          style={{
                            backgroundColor: brandTheme.background.brandLight,
                            borderColor: brandTheme.border.medium,
                          }}
                        >
                          <h4
                            className="text-sm font-semibold mb-3"
                            style={{ color: brandTheme.text.primary }}
                          >
                            Actions & Assignment
                          </h4>

                          <div className="space-y-3">
                            {/* Status */}
                            <div>
                              <label
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.secondary }}
                              >
                                Status
                              </label>
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                                style={{
                                  borderColor: brandTheme.border.medium,
                                  backgroundColor: brandTheme.background.primary,
                                  color: brandTheme.text.primary,
                                }}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status.value} value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Assignment */}
                            <div>
                              <label
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.secondary }}
                              >
                                Assign To
                              </label>
                              <select
                                value={request.assigned_to || ''}
                                onChange={(e) =>
                                  updateRequestStatus(request.id, request.status, e.target.value || undefined)
                                }
                                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                                style={{
                                  borderColor: brandTheme.border.medium,
                                  backgroundColor: brandTheme.background.primary,
                                  color: brandTheme.text.primary,
                                }}
                              >
                                <option value="">Unassigned</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* ETA Date */}
                            <div>
                              <label
                                className="block text-xs font-medium mb-1"
                                style={{ color: brandTheme.text.secondary }}
                              >
                                ETA Date
                              </label>
                              <div className="relative">
                                <Calendar
                                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                                  style={{ color: brandTheme.text.muted }}
                                />
                                <input
                                  type="date"
                                  value={formatDateForInput(request.expected_completion_date)}
                                  onChange={(e) => updateRequestETA(request.id, e.target.value)}
                                  className="w-full text-sm border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                                  style={{
                                    borderColor: brandTheme.border.medium,
                                    backgroundColor: brandTheme.background.primary,
                                    color: brandTheme.text.primary,
                                  }}
                                  title="Set expected completion date"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Internal Notes - Separate Container */}
                        <div
                          className="rounded-lg p-4 border mt-4"
                          style={{
                            backgroundColor: brandTheme.background.brandLight,
                            borderColor: brandTheme.border.medium,
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4
                              className="text-sm font-semibold"
                              style={{ color: brandTheme.text.primary }}
                            >
                              Internal Notes
                            </h4>
                            <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                              (Internal only)
                            </span>
                          </div>
                          <textarea
                            value={
                              editingNotes[request.id] !== undefined
                                ? editingNotes[request.id]
                                : request.internal_notes || ''
                            }
                            onChange={(e) =>
                              setEditingNotes((prev) => ({
                                ...prev,
                                [request.id]: e.target.value,
                              }))
                            }
                            placeholder="Add internal notes..."
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-colors resize-y"
                            style={{
                              borderColor: brandTheme.border.medium,
                              backgroundColor: brandTheme.background.primary,
                              color: brandTheme.text.primary,
                            }}
                          />
                          {editingNotes[request.id] !== undefined &&
                            editingNotes[request.id] !== (request.internal_notes || '') && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => updateInternalNotes(request.id, editingNotes[request.id])}
                                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{
                                    backgroundColor: brandTheme.primary.navy,
                                    color: brandTheme.background.primary,
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingNotes((prev) => {
                                      const newState = { ...prev };
                                      delete newState[request.id];
                                      return newState;
                                    })
                                  }
                                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{
                                    backgroundColor: brandTheme.background.secondary,
                                    color: brandTheme.text.primary,
                                    border: `1px solid ${brandTheme.border.medium}`,
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && request.image_attachment_url && (
                      <div
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: brandTheme.border.light }}
                      >
                        {/* Attached Image */}
                        <div
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: brandTheme.background.brandLight,
                            borderColor: brandTheme.border.medium,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
                            <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                              Attached Image
                            </span>
                            <a
                              href={request.image_attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm flex items-center gap-1 ml-auto hover:underline"
                              style={{ color: brandTheme.primary.navy }}
                            >
                              View Full Size
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div
                            className="border rounded-lg overflow-hidden inline-block shadow-sm"
                            style={{ borderColor: brandTheme.border.medium }}
                          >
                            <img
                              src={request.image_attachment_url}
                              alt="Request attachment"
                              className="max-w-xs max-h-40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(request.image_attachment_url!, '_blank')}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsToDiscuss;


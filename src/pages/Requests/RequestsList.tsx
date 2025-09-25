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
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Filter,
  BarChart3,
  Move
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Request {
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
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

const RequestsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View and Filters
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Drag and Drop state
  const [draggedRequest, setDraggedRequest] = useState<Request | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const requestTypes = [
    { value: 'bug', label: 'Bug Report', color: 'bg-red-100 text-red-800' },
    { value: 'task', label: 'Task Request', color: 'bg-blue-100 text-blue-800' },
    { value: 'project', label: 'New Project', color: 'bg-purple-100 text-purple-800' },
    { value: 'question', label: 'Question', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'support', label: 'Technical Support', color: 'bg-orange-100 text-orange-800' },
    { value: 'feature_request', label: 'Feature Request', color: 'bg-green-100 text-green-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { value: 'in_review', label: 'In Review', icon: Eye, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
    { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('PMA_Requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching requests:', err);
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
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'in_review' && !requests.find(r => r.id === requestId)?.reviewed_by) {
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
      
      await fetchRequests();
    } catch (err: any) {
      console.error('Error updating request:', err);
      setError(err.message);
    }
  };

  const updateRequestETA = async (requestId: string, etaDate: string) => {
    try {
      const updates: any = {
        expected_completion_date: etaDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;
      
      await fetchRequests();
    } catch (err: any) {
      console.error('Error updating ETA:', err);
      setError(err.message);
    }
  };

  const getTypeInfo = (type: string) => {
    return requestTypes.find(t => t.value === type) || requestTypes[requestTypes.length - 1];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority: string) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesAssigned = assignedFilter === 'all' || 
      (assignedFilter === 'unassigned' && !request.assigned_to) ||
      (assignedFilter !== 'unassigned' && request.assigned_to === assignedFilter);
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesPriority && matchesAssigned && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatETADate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const toggleCardExpansion = (requestId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, request: Request) => {
    setDraggedRequest(request);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight opacity to the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedRequest(null);
    setDragOverColumn(null);
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedRequest && draggedRequest.status !== newStatus) {
      // Update the request status
      await updateRequestStatus(draggedRequest.id, newStatus, draggedRequest.assigned_to || undefined);
    }
  };

  // Group requests by status for Kanban view
  const groupedRequests = statusOptions.reduce((acc, status) => {
    acc[status.value] = filteredRequests.filter(req => req.status === status.value);
    return acc;
  }, {} as Record<string, Request[]>);

  // Calculate statistics
  const statistics = {
    total: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    overdue: requests.filter(r => r.expected_completion_date && new Date(r.expected_completion_date) < new Date() && r.status !== 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error loading requests</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Requests</h1>
              <p className="text-gray-600">Manage requests submitted to the Product Development team</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewType('kanban')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'kanban' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </button>
              </div>
              <button
                onClick={fetchRequests}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Submitted</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.submitted}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-900">{statistics.inProgress}</p>
                </div>
                <PlayCircle className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">{statistics.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h2>
          
          {/* First row of filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Types</option>
                {requestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, submitter name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredRequests.length}</span> of <span className="font-semibold text-gray-900">{requests.length}</span> requests
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setPriorityFilter('all');
                setAssignedFilter('all');
                setSearchTerm('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>

        {/* Requests Display */}
        {viewType === 'kanban' ? (
          // Kanban View
          <div className="flex gap-6 overflow-x-auto pb-4">
            {statusOptions.map((status) => {
              const columnRequests = groupedRequests[status.value] || [];
              const columnColor = {
                submitted: 'border-blue-300 bg-blue-50',
                in_review: 'border-yellow-300 bg-yellow-50',
                in_progress: 'border-orange-300 bg-orange-50',
                completed: 'border-green-300 bg-green-50',
                rejected: 'border-red-300 bg-red-50',
                on_hold: 'border-gray-300 bg-gray-50'
              }[status.value] || 'border-gray-300 bg-gray-50';

              return (
                <div key={status.value} className="flex-1 min-w-[350px]">
                  <div 
                    className={`rounded-lg border-2 ${columnColor} h-full transition-all duration-200 ${
                      dragOverColumn === status.value ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, status.value)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status.value)}
                  >
                    <div className="p-4 border-b-2 border-opacity-20 border-gray-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <status.icon className="w-5 h-5" />
                          <h3 className="font-semibold text-gray-900">{status.label}</h3>
                        </div>
                        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
                          {columnRequests.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {columnRequests.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No requests</p>
                      ) : (
                        columnRequests.map((request) => {
                          const typeInfo = getTypeInfo(request.request_type);
                          const priorityInfo = getPriorityInfo(request.priority);
                          const isExpanded = expandedCards.has(request.id);

                          return (
                            <div
                              key={request.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, request)}
                              onDragEnd={handleDragEnd}
                              className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move ${
                                draggedRequest?.id === request.id ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 p-4 pb-0">
                                <Move className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex items-start justify-between flex-1" onClick={() => toggleCardExpansion(request.id)}>
                                  <h4 className="font-medium text-gray-900 flex-1 mr-2 cursor-pointer">{request.title}</h4>
                                  <button className="text-gray-400 hover:text-gray-600">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              
                              <div className="px-4 pb-4" onClick={() => toggleCardExpansion(request.id)}>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                                    {priorityInfo.label}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {request.description}
                                </p>
                              
                              {/* Quick info */}
                              <div className="space-y-2 text-xs text-gray-500">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {request.submitter_name}
                                  </div>
                                  {request.expected_completion_date && (
                                    <div className="flex items-center text-orange-600">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {formatETADate(request.expected_completion_date)}
                                    </div>
                                  )}
                                </div>
                                {request.assigned_to && (
                                  <div className="flex items-center text-green-600">
                                    <User className="w-3 h-3 mr-1" />
                                    Assigned to: {getUserName(request.assigned_to)}
                                  </div>
                                )}
                              </div>
                              </div>
                              
                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 px-4 pb-4 border-t border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Change Status</label>
                                      <select
                                        value={request.status}
                                        onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {statusOptions.map(s => (
                                          <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
                                      <select
                                        value={request.assigned_to || ''}
                                        onChange={(e) => updateRequestStatus(request.id, request.status, e.target.value || undefined)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Unassigned</option>
                                        {users.map(user => (
                                          <option key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Set ETA</label>
                                      <input
                                        type="date"
                                        value={formatDateForInput(request.expected_completion_date)}
                                        onChange={(e) => updateRequestETA(request.id, e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  
                                  {request.image_attachment_url && (
                                    <div className="pt-2">
                                      <a
                                        href={request.image_attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        View Attachment
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">No requests match your current filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
              {filteredRequests.map((request) => {
                const typeInfo = getTypeInfo(request.request_type);
                const statusInfo = getStatusInfo(request.status);
                const priorityInfo = getPriorityInfo(request.priority);

                return (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Title and badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 min-w-0 flex-shrink-0">
                            {request.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              <statusInfo.icon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                          {request.description}
                        </p>
                      
                        {/* Attached Image */}
                        {request.image_attachment_url && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Attached Image</span>
                              <a
                                href={request.image_attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 ml-auto"
                              >
                                View Full Size
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="border border-gray-300 rounded-lg overflow-hidden inline-block shadow-sm">
                              <img
                                src={request.image_attachment_url}
                                alt="Request attachment"
                                className="max-w-xs max-h-40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(request.image_attachment_url!, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Request metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Submitter:</span>
                            <span className="ml-1 text-gray-900">{request.submitter_name}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Email:</span>
                            <span className="ml-1 text-gray-900">{request.submitter_email}</span>
                          </div>
                          {request.submitter_department && (
                            <div className="flex items-center text-gray-600">
                              <Building className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">Department:</span>
                              <span className="ml-1 text-gray-900">{request.submitter_department}</span>
                            </div>
                          )}
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Created:</span>
                            <span className="ml-1 text-gray-900">{formatDate(request.created_at)}</span>
                          </div>
                          {request.expected_completion_date && (
                            <div className="flex items-center text-orange-600">
                              <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                              <span className="font-medium">ETA:</span>
                              <span className="ml-1 font-semibold">{formatETADate(request.expected_completion_date)}</span>
                            </div>
                          )}
                          {request.assigned_to && (
                            <div className="flex items-center text-green-600">
                              <User className="w-4 h-4 mr-2 text-green-500" />
                              <span className="font-medium">Assigned to:</span>
                              <span className="ml-1 font-semibold">{getUserName(request.assigned_to)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Controls */}
                      <div className="lg:ml-6 lg:w-80 flex-shrink-0">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions & Assignment</h4>
                          
                          <div className="space-y-3">
                            {/* Status */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                              >
                                {statusOptions.map(status => (
                                  <option key={status.value} value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Assignment */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
                              <select
                                value={request.assigned_to || ''}
                                onChange={(e) => updateRequestStatus(request.id, request.status, e.target.value || undefined)}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                              >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* ETA Date */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">ETA Date</label>
                              <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                <input
                                  type="date"
                                  value={formatDateForInput(request.expected_completion_date)}
                                  onChange={(e) => updateRequestETA(request.id, e.target.value)}
                                  className="w-full text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                  title="Set expected completion date"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default RequestsList;

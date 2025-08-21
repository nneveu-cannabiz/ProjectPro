import React, { useEffect, useState } from 'react';
import { UserX, Calendar, Target } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { fetchFlowChartProjects, updateProjectAssignee, fetchUsersByDepartment } from '../../../../../data/supabase-store';
import { User } from '../../../../../types';
import ProjectUpdateIcon from '../utils/Project Bar/projectupdateicon';
import UpdatesDetailsModal from '../utils/UpdatesDetailsModal';
import UserSelect from '../../../../../components/UserSelect';
import Button from '../../../../../components/ui/Button';

interface ReadyToAssignProject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  progress: number;
}

const UnassignedProjectsSection: React.FC = () => {
  const [readyToAssignProjects, setReadyToAssignProjects] = useState<ReadyToAssignProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningProjectId, setAssigningProjectId] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<Record<string, string>>({});
  
  // Updates modal state
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [selectedUpdatesProjectId, setSelectedUpdatesProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadReadyToAssignData();
  }, []);

  const loadReadyToAssignData = async () => {
    setLoading(true);
    try {
      // Fetch projects from Product Development flow chart
      const [flowChartProjects, departmentUsers] = await Promise.all([
        fetchFlowChartProjects('Product Development'),
        fetchUsersByDepartment('Product Development')
      ]);
      
      // Filter for projects with "Ready to Assign" tag
      const readyToAssign = flowChartProjects.filter((project: any) => {
        const tags = project.tags || [];
        return tags.includes('Ready to Assign');
      });
      
      setReadyToAssignProjects(readyToAssign);
      setUsers(departmentUsers);
    } catch (error) {
      console.error('Error loading ready to assign projects data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update click handlers
  const handleProjectUpdatesClick = (projectId: string) => {
    setSelectedUpdatesProjectId(projectId);
    setShowUpdatesModal(true);
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
    setSelectedUpdatesProjectId(null);
  };

  // Assignment handlers
  const handleAssigneeChange = (projectId: string, userId: string) => {
    setSelectedAssignees(prev => ({
      ...prev,
      [projectId]: userId
    }));
  };

  const handleAssignProject = async (projectId: string) => {
    const selectedUserId = selectedAssignees[projectId];
    if (!selectedUserId) return;

    setAssigningProjectId(projectId);
    try {
      await updateProjectAssignee(projectId, selectedUserId);
      
      // Clear the selected assignee for this project
      setSelectedAssignees(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      
      // Refresh data to remove the assigned project from the list
      await loadReadyToAssignData();
    } catch (error) {
      console.error('Error assigning project:', error);
      alert('Failed to assign project. Please try again.');
    } finally {
      setAssigningProjectId(null);
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
          <p style={{ color: brandTheme.text.secondary }}>Loading ready to assign projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4"
      style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
    >
      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <UserX size={20} className="mr-2" style={{ color: brandTheme.primary.navy }} />
            <h2 
              className="text-xl font-bold"
              style={{ color: brandTheme.primary.navy }}
            >
              Projects Ready to Be Assigned
            </h2>
          </div>
          <p className="text-sm" style={{ color: brandTheme.text.muted }}>
            Projects in Product Development tagged as "Ready to Assign"
          </p>
        </div>

        {/* Ready to Assign Projects List */}
        {readyToAssignProjects.length === 0 ? (
          <div 
            className="text-center py-6 rounded-lg border-2 border-dashed"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <UserX size={32} className="mx-auto mb-2 opacity-50" style={{ color: brandTheme.text.muted }} />
            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
              No projects tagged as "Ready to Assign" found for Product Development.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 
              className="text-md font-semibold mb-3 flex items-center"
              style={{ color: brandTheme.primary.navy }}
            >
              <UserX size={16} className="mr-2" />
              Projects Ready to Be Assigned ({readyToAssignProjects.length})
            </h3>
            <div className="space-y-3">
              {readyToAssignProjects.map((project) => (
                <ReadyToAssignProjectCard
                  key={`project-${project.id}`}
                  project={project}
                  users={users}
                  selectedAssignee={selectedAssignees[project.id] || ''}
                  isAssigning={assigningProjectId === project.id}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  onUpdatesClick={handleProjectUpdatesClick}
                  onAssigneeChange={handleAssigneeChange}
                  onAssignProject={handleAssignProject}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Updates Modal */}
      {showUpdatesModal && selectedUpdatesProjectId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType="project"
          entityId={selectedUpdatesProjectId}
          entityName={readyToAssignProjects.find(p => p.id === selectedUpdatesProjectId)?.name || 'Unknown Project'}
        />
      )}
    </div>
  );
};

interface ReadyToAssignProjectCardProps {
  project: ReadyToAssignProject;
  users: User[];
  selectedAssignee: string;
  isAssigning: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (dateString: string) => string;
  onUpdatesClick: (projectId: string) => void;
  onAssigneeChange: (projectId: string, userId: string) => void;
  onAssignProject: (projectId: string) => void;
}

const ReadyToAssignProjectCard: React.FC<ReadyToAssignProjectCardProps> = ({
  project,
  users,
  selectedAssignee,
  isAssigning,
  getStatusColor,
  getPriorityColor,
  formatDate,
  onUpdatesClick,
  onAssigneeChange,
  onAssignProject
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
            className="text-lg font-semibold mb-2"
            style={{ color: brandTheme.primary.navy }}
          >
            {project.name}
          </h3>
          {project.description && (
            <p 
              className="mb-2 text-sm"
              style={{ color: brandTheme.text.secondary }}
            >
              {project.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mb-2">
            <span 
              className="px-2 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: getStatusColor(project.status) + '20',
                color: getStatusColor(project.status)
              }}
            >
              {project.status}
            </span>
            <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority} Priority
            </span>
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              Category: {project.category}
            </span>
          </div>
          
          {/* Dates */}
          <div className="flex items-center space-x-4 text-sm mb-2">
            {project.start_date && (
              <div className="flex items-center space-x-1">
                <Calendar size={14} style={{ color: brandTheme.text.muted }} />
                <span style={{ color: brandTheme.text.muted }}>
                  {formatDate(project.start_date)}
                  {project.end_date && project.end_date !== project.start_date && 
                    ` - ${formatDate(project.end_date)}`
                  }
                </span>
              </div>
            )}
            
            {project.deadline && (
              <div className="flex items-center space-x-1">
                <Target size={14} style={{ color: brandTheme.status.warning }} />
                <span style={{ color: brandTheme.status.warning }}>
                  Due: {formatDate(project.deadline)}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          {project.progress > 0 && (
            <div className="mb-2">
              <span 
                className="text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                Progress: {project.progress}%
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <ProjectUpdateIcon
            projectId={project.id}
            unreadCount={0} // TODO: Implement actual unread count
            totalCount={0} // TODO: Implement actual total count
            onClick={onUpdatesClick}
          />
          <div className="flex items-center">
            <UserX size={16} className="text-green-600" />
            <span className="ml-1 text-xs font-medium text-green-600">Ready to Assign</span>
          </div>
        </div>
      </div>
      
      {/* Assignment Section */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <UserSelect
              label=""
              selectedUserId={selectedAssignee}
              onChange={(userId) => onAssigneeChange(project.id, userId)}
              users={users}
              placeholder="Select assignee..."
            />
          </div>
          
          <Button
            onClick={() => onAssignProject(project.id)}
            disabled={!selectedAssignee || isAssigning}
            size="sm"
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnassignedProjectsSection;

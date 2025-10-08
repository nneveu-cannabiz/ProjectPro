import React, { useState, useEffect } from 'react';
import { Pencil, FileText, Calendar, Users, Target, ExternalLink } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { Card, CardContent } from '../../../../../components/ui/Card';
import Badge from '../../../../../components/ui/Badge';
import UserAvatar from '../../../../../components/UserAvatar';
import Button from '../../../../../components/ui/Button';
import UpdateForm from '../../../../../components/Update/UpdateForm';
import UpdatesList from '../../../../../components/Update/UpdatesList';
import { useAppContext } from '../../../../../context/AppContext';
import ProjectDetailsModal from '../../Flow Chart/utils/Profiles/ProjectDetailsModal';

interface SprintProjectSummaryProps {
  projectId: string;
}

const SprintProjectSummary: React.FC<SprintProjectSummaryProps> = ({ projectId }) => {
  const { getUsers, getUpdatesForEntity } = useAppContext();
  const users = getUsers();
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('PMA_Projects')
          .select(`
            id,
            name,
            description,
            status,
            priority,
            project_type,
            category,
            assignee_id,
            multi_assignee_id,
            start_date,
            end_date,
            deadline,
            progress,
            tags,
            created_at,
            updated_at
          `)
          .eq('id', projectId)
          .single();

        if (error) {
          console.error('Error fetching project:', error);
          return;
        }

        setProject(data);
      } catch (error) {
        console.error('Error loading project details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleEditDescription = () => {
    setEditedDescription(project?.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!project) return;
    
    try {
      setIsUpdatingDescription(true);
      
      const { error } = await (supabase as any)
        .from('PMA_Projects')
        .update({ description: editedDescription })
        .eq('id', projectId);

      if (error) throw error;

      setProject({ ...project, description: editedDescription });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  // Get updates for this project
  const directUpdates = getUpdatesForEntity('project', projectId);

  // Get project type badge variant
  const getProjectTypeVariant = (type: string) => {
    switch (type) {
      case 'Active':
        return 'success';
      case 'Upcoming':
        return 'primary';
      case 'Future':
        return 'secondary';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.muted }}>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12" style={{ color: brandTheme.text.muted }}>
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold" style={{ color: brandTheme.text.primary }}>
                  {project.name}
                </h2>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                  title="Open full project details"
                  style={{ color: brandTheme.primary.navy }}
                >
                  <ExternalLink size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.project_type && (
                  <Badge variant={getProjectTypeVariant(project.project_type)}>
                    {project.project_type}
                  </Badge>
                )}
                {project.category && (
                  <Badge variant="primary">{project.category}</Badge>
                )}
                {project.status && (
                  <Badge variant={getStatusVariant(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                )}
                {project.priority && (
                  <Badge variant={project.priority === 'high' || project.priority === 'critical' ? 'danger' : 'default'}>
                    {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Project Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mb-4 pb-4 border-b" style={{ borderColor: brandTheme.border.light }}>
              <div className="flex items-center gap-2 flex-wrap">
                <FileText size={16} style={{ color: brandTheme.text.muted }} />
                {project.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: brandTheme.text.primary }}>
                <FileText size={18} />
                Project Description
              </h3>
              {!isEditingDescription && (
                <button
                  onClick={handleEditDescription}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Edit description"
                  style={{ color: brandTheme.text.muted }}
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.secondary,
                    backgroundColor: brandTheme.background.primary
                  }}
                  placeholder="Enter project description..."
                  disabled={isUpdatingDescription}
                />
                <div className="flex justify-end space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelDescription}
                    disabled={isUpdatingDescription}
                    style={{
                      backgroundColor: brandTheme.primary.lightBlue,
                      color: brandTheme.primary.navy,
                      borderColor: brandTheme.primary.navy
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={isUpdatingDescription}
                    style={{
                      backgroundColor: brandTheme.primary.lightBlue,
                      color: brandTheme.primary.navy
                    }}
                  >
                    {isUpdatingDescription ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="whitespace-pre-wrap break-words p-4 rounded-md"
                style={{ 
                  color: brandTheme.text.secondary,
                  backgroundColor: brandTheme.background.secondary,
                  lineHeight: '1.6'
                }}
              >
                {project.description || 'No description provided.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline and Dates */}
        <Card>
          <div 
            className="p-4"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: brandTheme.background.primary }}>
              <Calendar size={18} />
              Timeline & Dates
            </h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Start Date</span>
                <span className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              {project.start_date && (
                <div className="text-xs text-right" style={{ color: brandTheme.text.muted }}>
                  {(() => {
                    const startDate = new Date(project.start_date);
                    const today = new Date();
                    const diffTime = today.getTime() - startDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) return 'Started today';
                    if (diffDays === 1) return '1 day ago';
                    if (diffDays > 0) return `${diffDays} days ago`;
                    if (diffDays === -1) return 'Starts tomorrow';
                    return `Starts in ${Math.abs(diffDays)} days`;
                  })()}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>End Date</span>
                <span className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                  {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              {project.end_date && (
                <div className="text-xs text-right" style={{ color: brandTheme.text.muted }}>
                  {(() => {
                    const endDate = new Date(project.end_date);
                    const today = new Date();
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) return 'Due today';
                    if (diffDays === 1) return '1 day left';
                    if (diffDays > 0) return `${diffDays} days left`;
                    if (diffDays === -1) return '1 day overdue';
                    return `${Math.abs(diffDays)} days overdue`;
                  })()}
                </div>
              )}
            </div>

            {project.start_date && project.end_date && (
              <div className="pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Total Duration</span>
                  <span className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                    {(() => {
                      const startDate = new Date(project.start_date);
                      const endDate = new Date(project.end_date);
                      const diffTime = endDate.getTime() - startDate.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays === 1 ? '1 day' : `${diffDays} days`;
                    })()}
                  </span>
                </div>
              </div>
            )}

            {project.deadline && (
              <div className="pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Deadline</span>
                  <span className="text-sm font-semibold" style={{ color: brandTheme.status.warning }}>
                    {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Created</span>
                <span className="text-sm" style={{ color: brandTheme.text.primary }}>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team and Progress */}
        <Card>
          <div 
            className="p-4"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: brandTheme.background.primary }}>
              <Users size={18} />
              Team & Progress
            </h3>
          </div>
          <CardContent className="p-6 space-y-4">
            {/* Project Assignee */}
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Project Lead</span>
              </div>
              {project.assignee_id ? (
                (() => {
                  const assignee = users.find(user => user.id === project.assignee_id);
                  return assignee ? (
                    <UserAvatar user={assignee} showName size="sm" />
                  ) : (
                    <span className="text-sm" style={{ color: brandTheme.text.muted }}>
                      Assignee not found
                    </span>
                  );
                })()
              ) : (
                <span className="text-sm" style={{ color: brandTheme.text.muted }}>
                  No assignee set
                </span>
              )}
            </div>

            {/* Additional Assignees */}
            {project.multi_assignee_id && project.multi_assignee_id.length > 0 && (
              <div className="pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                <div className="mb-2">
                  <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Team Members</span>
                </div>
                <div className="space-y-2">
                  {project.multi_assignee_id.map((userId: string) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="flex items-center">
                        <UserAvatar user={user} showName size="sm" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Project Progress */}
            {typeof project.progress === 'number' && (
              <div className="pt-3 border-t" style={{ borderColor: brandTheme.border.light }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: brandTheme.text.muted }}>Progress</span>
                  <span className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>
                    {project.progress}%
                  </span>
                </div>
                <div 
                  className="w-full bg-gray-200 rounded-full h-2.5"
                  style={{ backgroundColor: brandTheme.background.secondary }}
                >
                  <div
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.progress === 100 
                        ? brandTheme.status.success 
                        : brandTheme.status.info
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Updates */}
      <Card>
        <div 
          className="p-4"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: brandTheme.background.primary }}>
            <Target size={18} />
            Project Updates
          </h3>
        </div>
        <CardContent className="p-6">
          {directUpdates.length > 0 ? (
            <div className="mb-6">
              <UpdatesList updates={directUpdates.slice(0, 5)} />
              {directUpdates.length > 5 && (
                <div className="text-center mt-4">
                  <span className="text-sm" style={{ color: brandTheme.text.muted }}>
                    Showing 5 of {directUpdates.length} updates
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p 
              className="text-center py-4 mb-6"
              style={{ color: brandTheme.text.muted }}
            >
              No updates yet
            </p>
          )}
          
          <div 
            className="border-t pt-4"
            style={{ borderColor: brandTheme.border.light }}
          >
            <div
              className="px-3 py-2 mb-3 rounded-md"
              style={{ backgroundColor: brandTheme.primary.navy }}
            >
              <h4
                className="text-sm font-medium"
                style={{ color: brandTheme.background.primary }}
              >
                Add Update to Project
              </h4>
            </div>
            <div className="px-3">
              <UpdateForm entityType="project" entityId={projectId} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      {isProjectModalOpen && (
        <ProjectDetailsModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default SprintProjectSummary;

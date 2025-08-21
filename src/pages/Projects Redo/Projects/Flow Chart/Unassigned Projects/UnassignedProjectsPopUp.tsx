import React, { useState } from 'react';
import { Calendar, Target } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { updateProjectAssignee } from '../../../../../data/supabase-store';
import { User as UserType } from '../../../../../types';
import Modal from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import UserSelect from '../../../../../components/UserSelect';

interface FlowProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assigneeId?: string | null;
  multiAssigneeIds?: string[];
  tasks?: any[];
  progress?: number;
  deadline?: Date;
}

interface UnassignedProjectsPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedProjects: FlowProject[];
  users: UserType[];
  onProjectAssigned: () => void; // Callback to refresh data after assignment
}

const UnassignedProjectsPopUp: React.FC<UnassignedProjectsPopUpProps> = ({
  isOpen,
  onClose,
  unassignedProjects,
  users,
  onProjectAssigned
}) => {
  const [assigningProjectId, setAssigningProjectId] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<Record<string, string>>({});

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
      
      // Notify parent to refresh data
      onProjectAssigned();
    } catch (error) {
      console.error('Error assigning project:', error);
      // You could add a toast notification here
      alert('Failed to assign project. Please try again.');
    } finally {
      setAssigningProjectId(null);
    }
  };

  const handleAssigneeChange = (projectId: string, userId: string) => {
    setSelectedAssignees(prev => ({
      ...prev,
      [projectId]: userId
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  // Filter out virtual standalone projects from the list
  const realUnassignedProjects = unassignedProjects.filter(project => 
    !project.id.startsWith('virtual-standalone')
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unassigned Projects"
    >
      <div className="max-h-96 overflow-y-auto">
        {realUnassignedProjects.length === 0 ? (
          <div className="text-center py-8">
            <div 
              className="text-lg font-medium mb-2"
              style={{ color: brandTheme.text.primary }}
            >
              No Unassigned Projects
            </div>
            <p style={{ color: brandTheme.text.muted }}>
              All projects have been assigned to team members.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {realUnassignedProjects.map((project) => (
              <div
                key={project.id}
                className="border rounded-lg p-4"
                style={{ 
                  borderColor: brandTheme.border.light,
                  backgroundColor: brandTheme.background.primary 
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 
                      className="font-semibold text-lg mb-2"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {project.name}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} style={{ color: brandTheme.text.muted }} />
                        <span style={{ color: brandTheme.text.muted }}>
                          {formatDate(project.startDate)}
                          {project.startDate.getTime() !== project.endDate.getTime() && 
                            ` - ${formatDate(project.endDate)}`
                          }
                        </span>
                      </div>
                      
                      {project.deadline && (
                        <div className="flex items-center space-x-1">
                          <Target size={14} style={{ color: brandTheme.status.warning }} />
                          <span style={{ color: brandTheme.status.warning }}>
                            Due: {formatDate(project.deadline)}
                          </span>
                        </div>
                      )}
                    </div>

                    {project.tasks && project.tasks.length > 0 && (
                      <div className="mt-2">
                        <span 
                          className="text-sm"
                          style={{ color: brandTheme.text.muted }}
                        >
                          {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <UserSelect
                      label=""
                      selectedUserId={selectedAssignees[project.id] || ''}
                      onChange={(userId) => handleAssigneeChange(project.id, userId)}
                      users={users}
                      placeholder="Select assignee..."
                    />
                  </div>
                  
                  <Button
                    onClick={() => handleAssignProject(project.id)}
                    disabled={!selectedAssignees[project.id] || assigningProjectId === project.id}
                    size="sm"
                  >
                    {assigningProjectId === project.id ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4 border-t" style={{ borderColor: brandTheme.border.light }}>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default UnassignedProjectsPopUp;

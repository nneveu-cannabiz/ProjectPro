import React, { useEffect, useState } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { 
  fetchFlowChartProjects, 
  updateProjectDates,
  fetchUsersByDepartment
} from '../../../../../data/supabase-store';
import { User } from '../../../../../types';
import ProjectDetailsModal from '../utils/ProjectDetailsModal';
import { useAppContext } from '../../../../../context/AppContext';

interface OutstandingProject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  flow_chart: string | null;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
}

const OutstandingList: React.FC = () => {
  const { refreshData } = useAppContext();
  const [projects, setProjects] = useState<OutstandingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingProject, setUpdatingProject] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<OutstandingProject | null>(null);
  const [finishFormData, setFinishFormData] = useState({
    startDate: '',
    endDate: '',
    deadline: '',
    assigneeId: ''
  });
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<string | null>(null);

  useEffect(() => {
    loadOutstandingProjects();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const departmentUsers = await fetchUsersByDepartment('Product Development');
      setUsers(departmentUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadOutstandingProjects = async () => {
    setLoading(true);
    try {
      // Refresh AppContext data to ensure ProjectDetailsModal has access to projects
      await refreshData();
      
      const flowChartProjects = await fetchFlowChartProjects('Product Development');
      // Filter projects that don't have start_date or end_date
      const outstandingProjects = flowChartProjects.filter(
        (project: OutstandingProject) => !project.start_date || !project.end_date
      );
      setProjects(outstandingProjects);
    } catch (error) {
      console.error('Error loading outstanding projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishInformation = (project: OutstandingProject) => {
    setSelectedProject(project);
    setFinishFormData({
      startDate: project.start_date || '',
      endDate: project.end_date || '',
      deadline: project.deadline || '',
      assigneeId: ''
    });
    setShowFinishModal(true);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectForDetails(projectId);
    setShowProjectDetails(true);
  };

  const handleCloseProjectDetails = () => {
    setShowProjectDetails(false);
    setSelectedProjectForDetails(null);
  };

  const handleFinishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !finishFormData.startDate || !finishFormData.endDate) return;

    setUpdatingProject(selectedProject.id);
    try {
      await updateProjectDates(selectedProject.id, finishFormData.startDate, finishFormData.endDate);
      // TODO: Add assignee update when that functionality is available
      await loadOutstandingProjects();
      setShowFinishModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project information:', error);
    } finally {
      setUpdatingProject(null);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
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

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading outstanding projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4"
      style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 
            className="text-xl font-bold mb-1"
            style={{ color: brandTheme.primary.navy }}
          >
            Outstanding Projects
          </h2>
          <p className="text-sm" style={{ color: brandTheme.text.muted }}>
            Projects that need start and end dates. Click project names to view details.
          </p>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div 
            className="text-center py-6 rounded-lg border-2 border-dashed"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
              No outstanding projects found. All projects have start and end dates assigned.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onFinishInformation={handleFinishInformation}
                onProjectClick={handleProjectClick}
                isUpdating={updatingProject === project.id}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        )}

        {/* Finish Information Modal */}
        {showFinishModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              style={{ borderColor: brandTheme.border.light }}
            >
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: brandTheme.text.primary }}
              >
                Finish Information - {selectedProject.name}
              </h3>
              
              <form onSubmit={handleFinishSubmit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={finishFormData.startDate}
                      onChange={(e) => setFinishFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: brandTheme.border.light,
                        backgroundColor: brandTheme.background.secondary
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: brandTheme.text.primary }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      value={finishFormData.endDate}
                      onChange={(e) => setFinishFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: brandTheme.border.light,
                        backgroundColor: brandTheme.background.secondary
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: brandTheme.text.primary }}
                    >
                      Assignee
                    </label>
                    <select
                      value={finishFormData.assigneeId}
                      onChange={(e) => setFinishFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: brandTheme.border.light,
                        backgroundColor: brandTheme.background.secondary
                      }}
                    >
                      <option value="">Select an assignee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {getUserDisplayName(user)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFinishModal(false);
                      setSelectedProject(null);
                    }}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProject === selectedProject.id || !finishFormData.startDate || !finishFormData.endDate}
                    className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: brandTheme.primary.navy,
                      color: 'white'
                    }}
                  >
                    {updatingProject === selectedProject.id ? 'Updating...' : 'Save Information'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {showProjectDetails && selectedProjectForDetails && (
          <ProjectDetailsModal
            isOpen={showProjectDetails}
            onClose={handleCloseProjectDetails}
            projectId={selectedProjectForDetails}
          />
        )}
      </div>
    </div>
  );
};

interface ProjectCardProps {
  project: OutstandingProject;
  onFinishInformation: (project: OutstandingProject) => void;
  onProjectClick: (projectId: string) => void;
  isUpdating: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onFinishInformation,
  onProjectClick,
  isUpdating,
  getStatusColor,
  getPriorityColor
}) => {

  return (
    <div 
      className="p-6 rounded-lg border"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 
            className="text-xl font-semibold mb-2 cursor-pointer hover:underline transition-all"
            style={{ color: brandTheme.primary.navy }}
            onClick={() => onProjectClick(project.id)}
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
          <div className="flex items-center space-x-4">
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
        </div>
        
        <button
          onClick={() => onFinishInformation(project)}
          disabled={isUpdating}
          className="px-3 py-1 text-sm rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{
            borderColor: brandTheme.border.light,
            color: brandTheme.text.primary
          }}
        >
          {isUpdating ? 'Updating...' : 'Finish Information'}
        </button>
      </div>


    </div>
  );
};

export default OutstandingList;

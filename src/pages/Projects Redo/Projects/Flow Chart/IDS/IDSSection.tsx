import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { fetchIDSProjects, fetchIDSTasks, removeIDSTagFromProject, removeIDSTagFromTask } from '../../../../../data/supabase-store';
import ProjectUpdateIcon from '../utils/Project Bar/projectupdateicon';
import TaskUpdateIcon from '../utils/Project Bar/taskupdateicon';
import UpdatesDetailsModal from '../utils/UpdatesDetailsModal';

interface IDSProject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
}

interface IDSTask {
  id: string;
  name: string;
  description: string | null;
  task_type: string;
  status: string;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  project: {
    id: string;
    name: string;
    flow_chart: string;
  };
}

const IDSSection: React.FC = () => {
  const [idsProjects, setIdsProjects] = useState<IDSProject[]>([]);
  const [idsTasks, setIdsTasks] = useState<IDSTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Updates modal state
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [selectedUpdatesProjectId, setSelectedUpdatesProjectId] = useState<string | null>(null);
  const [showTaskUpdatesModal, setShowTaskUpdatesModal] = useState(false);
  const [selectedUpdatesTaskId, setSelectedUpdatesTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadIDSData();
  }, []);

  const loadIDSData = async () => {
    setLoading(true);
    try {
      // Fetch both projects and tasks with IDS tags
      const [idsProjects, allIdsTasks] = await Promise.all([
        fetchIDSProjects('Product Development'),
        fetchIDSTasks('Product Development')
      ]);
      
      setIdsProjects(idsProjects);
      setIdsTasks(allIdsTasks);
    } catch (error) {
      console.error('Error loading IDS data:', error);
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

  const handleTaskUpdatesClick = (taskId: string) => {
    setSelectedUpdatesTaskId(taskId);
    setShowTaskUpdatesModal(true);
  };

  const handleCloseTaskUpdatesModal = () => {
    setShowTaskUpdatesModal(false);
    setSelectedUpdatesTaskId(null);
  };

  // Remove IDS tag handlers
  const handleRemoveIDSFromProject = async (projectId: string) => {
    try {
      await removeIDSTagFromProject(projectId);
      // Refresh the data to remove the project from the list
      loadIDSData();
    } catch (error) {
      console.error('Error removing IDS tag from project:', error);
      alert('Failed to remove IDS tag from project. Please try again.');
    }
  };

  const handleRemoveIDSFromTask = async (taskId: string) => {
    try {
      await removeIDSTagFromTask(taskId);
      // Refresh the data to remove the task from the list
      loadIDSData();
    } catch (error) {
      console.error('Error removing IDS tag from task:', error);
      alert('Failed to remove IDS tag from task. Please try again.');
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

  if (loading) {
    return (
      <div 
        className="p-4"
        style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading IDS projects...</p>
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
          <div className="flex items-center mb-2">
            <MessageCircle size={20} className="mr-2" style={{ color: brandTheme.primary.navy }} />
            <h2 
              className="text-xl font-bold"
              style={{ color: brandTheme.primary.navy }}
            >
              IDS - Identify, Discuss, Solve
            </h2>
          </div>
          <p className="text-sm" style={{ color: brandTheme.text.muted }}>
            Projects requiring identification, discussion, and solution development
          </p>
        </div>

        {/* IDS Projects and Tasks List */}
        {idsProjects.length === 0 && idsTasks.length === 0 ? (
          <div 
            className="text-center py-6 rounded-lg border-2 border-dashed"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" style={{ color: brandTheme.text.muted }} />
            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
              No IDS projects or tasks found for Product Development.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Projects Section */}
            {idsProjects.length > 0 && (
              <div>
                <h3 
                  className="text-md font-semibold mb-3 flex items-center"
                  style={{ color: brandTheme.primary.navy }}
                >
                  <MessageCircle size={16} className="mr-2" />
                  IDS Projects ({idsProjects.length})
                </h3>
                <div className="space-y-3">
                  {idsProjects.map((project) => (
                    <IDSProjectCard
                      key={`project-${project.id}`}
                      project={project}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                      onUpdatesClick={handleProjectUpdatesClick}
                      onRemoveIDS={handleRemoveIDSFromProject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Section */}
            {idsTasks.length > 0 && (
              <div>
                <h3 
                  className="text-md font-semibold mb-3 flex items-center"
                  style={{ color: brandTheme.primary.navy }}
                >
                  <MessageCircle size={16} className="mr-2" />
                  IDS Tasks ({idsTasks.length})
                </h3>
                <div className="space-y-3">
                  {idsTasks.map((task) => (
                    <IDSTaskCard
                      key={`task-${task.id}`}
                      task={task}
                      getStatusColor={getStatusColor}
                      onUpdatesClick={handleTaskUpdatesClick}
                      onRemoveIDS={handleRemoveIDSFromTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Updates Modals */}
      {showUpdatesModal && selectedUpdatesProjectId && (
        <UpdatesDetailsModal
          isOpen={showUpdatesModal}
          onClose={handleCloseUpdatesModal}
          entityType="project"
          entityId={selectedUpdatesProjectId}
          entityName={idsProjects.find(p => p.id === selectedUpdatesProjectId)?.name || 'Unknown Project'}
        />
      )}
      
      {showTaskUpdatesModal && selectedUpdatesTaskId && (
        <UpdatesDetailsModal
          isOpen={showTaskUpdatesModal}
          onClose={handleCloseTaskUpdatesModal}
          entityType="task"
          entityId={selectedUpdatesTaskId}
          entityName={(() => {
            const task = idsTasks.find(t => t.id === selectedUpdatesTaskId);
            return task ? `${task.name} (${task.project.name})` : 'Unknown Task';
          })()}
        />
      )}
    </div>
  );
};

interface IDSProjectCardProps {
  project: IDSProject;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  onUpdatesClick: (projectId: string) => void;
  onRemoveIDS: (projectId: string) => void;
}

const IDSProjectCard: React.FC<IDSProjectCardProps> = ({
  project,
  getStatusColor,
  getPriorityColor,
  onUpdatesClick,
  onRemoveIDS
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
          {project.start_date && project.end_date && (
            <div className="mt-2 text-sm" style={{ color: brandTheme.text.muted }}>
              <span>Duration: {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
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
            <MessageCircle size={16} className="text-purple-600" />
            <span className="ml-1 text-xs font-medium text-purple-600">IDS</span>
          </div>
        </div>
      </div>
      
      {/* Remove from IDS button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onRemoveIDS(project.id)}
          className="px-3 py-1 text-xs rounded-md border hover:bg-gray-50 transition-colors"
          style={{
            borderColor: brandTheme.status.error,
            color: brandTheme.status.error
          }}
        >
          Remove from IDS
        </button>
      </div>
    </div>
  );
};

interface IDSTaskCardProps {
  task: IDSTask;
  getStatusColor: (status: string) => string;
  onUpdatesClick: (taskId: string) => void;
  onRemoveIDS: (taskId: string) => void;
}

const IDSTaskCard: React.FC<IDSTaskCardProps> = ({
  task,
  getStatusColor,
  onUpdatesClick,
  onRemoveIDS
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
          <h4 
            className="text-lg font-semibold mb-1"
            style={{ color: brandTheme.primary.navy }}
          >
            {task.name}
          </h4>
          <p 
            className="text-sm mb-2 font-medium"
            style={{ color: brandTheme.text.secondary }}
          >
            Project: {task.project.name}
            {task.project.flow_chart && (
              <span 
                className="ml-2 px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: brandTheme.primary.navy + '20',
                  color: brandTheme.primary.navy
                }}
              >
                {task.project.flow_chart}
              </span>
            )}
          </p>
          {task.description && (
            <p 
              className="mb-2 text-sm"
              style={{ color: brandTheme.text.secondary }}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center space-x-4">
            <span 
              className="px-2 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: getStatusColor(task.status) + '20',
                color: getStatusColor(task.status)
              }}
            >
              {task.status}
            </span>
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              Type: {task.task_type}
            </span>
          </div>
          {task.start_date && task.end_date && (
            <div className="mt-2 text-sm" style={{ color: brandTheme.text.muted }}>
              <span>Duration: {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <TaskUpdateIcon
            taskId={task.id}
            unreadCount={0} // TODO: Implement actual unread count
            totalCount={0} // TODO: Implement actual total count
            onClick={onUpdatesClick}
          />
          <div className="flex items-center">
            <MessageCircle size={16} className="text-purple-600" />
            <span className="ml-1 text-xs font-medium text-purple-600">IDS Task</span>
          </div>
        </div>
      </div>
      
      {/* Remove from IDS button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onRemoveIDS(task.id)}
          className="px-3 py-1 text-xs rounded-md border hover:bg-gray-50 transition-colors"
          style={{
            borderColor: brandTheme.status.error,
            color: brandTheme.status.error
          }}
        >
          Remove from IDS
        </button>
      </div>
    </div>
  );
};

export default IDSSection;

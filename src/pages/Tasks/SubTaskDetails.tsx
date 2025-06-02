import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft, MessageSquare, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SubTaskForm from '../../components/SubTask/SubTaskForm';
import UserAvatar from '../../components/UserAvatar';
import { useAppContext } from '../../context/AppContext';
import UpdateForm from '../../components/Update/UpdateForm';
import UpdatesList from '../../components/Update/UpdatesList';
import UpdatesModal from '../../components/Update/UpdatesModal';
import DropdownMenu from '../../components/ui/DropdownMenu';

const SubTaskDetails: React.FC = () => {
  const { projectId, taskId, subTaskId } = useParams<{ projectId: string; taskId: string; subTaskId: string }>();
  const navigate = useNavigate();
  const { projects, tasks, subTasks, deleteSubTask, getUsers, getUpdatesForEntity } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  if (!projectId || !taskId || !subTaskId) {
    navigate('/projects');
    return null;
  }
  
  const project = projects.find((p) => p.id === projectId);
  const task = tasks.find((t) => t.id === taskId);
  const subTask = subTasks.find((st) => st.id === subTaskId);
  
  if (!project || !task || !subTask) {
    navigate(`/projects/${projectId}/tasks/${taskId}`);
    return null;
  }
  
  // Get updates for this subtask
  const updates = getUpdatesForEntity('subtask', subTaskId);
  
  const handleDeleteSubTask = () => {
    deleteSubTask(subTaskId);
    navigate(`/projects/${projectId}/tasks/${taskId}`);
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
  
  // Get task type badge variant
  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'danger';
      case 'Feature':
        return 'primary';
      case 'Discovery':
        return 'secondary';
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
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const handleOpenUpdatesModal = () => {
    setIsUpdatesModalOpen(true);
  };
  
  const users = getUsers();
  const assignee = subTask.assigneeId ? users.find(user => user.id === subTask.assigneeId) : null;
  
  // Dropdown menu items for subtask actions
  const subtaskMenuItems = [
    {
      label: 'View Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Subtask',
      icon: <Edit size={18} />,
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'Delete Subtask',
      icon: <Trash2 size={18} />,
      onClick: () => setIsDeleteModalOpen(true),
      className: 'text-red-500'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-100 flex items-center mb-6 p-4 rounded-lg border border-gray-200">
        <Button 
          variant="ghost" 
          className="mr-4 bg-white" 
          onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}`)}
          size="sm"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Task
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 mr-3">{subTask.name} - Sub Task</h1>
            <Badge variant={getStatusVariant(subTask.status)} className="mr-2">
              {getStatusText(subTask.status)}
            </Badge>
            <Badge variant={getTypeVariant(subTask.taskType)}>
              {subTask.taskType}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Created: {new Date(subTask.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div>
          <DropdownMenu items={subtaskMenuItems} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{subTask.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>SubTask Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Project</h4>
                  <p className="mt-1">{project.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Parent Task</h4>
                  <p className="mt-1">{task.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Type</h4>
                  <p className="mt-1">{subTask.taskType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  <p className="mt-1">{getStatusText(subTask.status)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Assignee</h4>
                  <div className="mt-1">
                    {assignee ? (
                      <UserAvatar user={assignee} showName />
                    ) : (
                      <p className="text-gray-500">Unassigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Created</h4>
                  <p className="mt-1">{new Date(subTask.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Last Updated</h4>
                  <p className="mt-1">{new Date(subTask.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare size={18} className="mr-2" />
                Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length > 0 ? (
                <div className="mb-6">
                  <UpdatesList updates={updates.slice(0, 3)} />
                  {updates.length > 3 && (
                    <div className="mt-3 text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleOpenUpdatesModal}
                      >
                        View All Updates
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 mb-6 text-center py-4">No updates yet</p>
              )}
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update to SubTask</h4>
                <UpdateForm entityType="subtask" entityId={subTaskId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit SubTask Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit SubTask"
      >
        <SubTaskForm 
          taskId={taskId} 
          subTask={subTask} 
          onSubmit={() => setIsEditModalOpen(false)} 
        />
      </Modal>
      
      {/* Delete SubTask Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete SubTask"
      >
        <div>
          <p className="mb-6">Are you sure you want to delete this subtask? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} size="sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubTask} size="sm">
              Delete SubTask
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Updates Modal */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="subtask"
        entityId={subTaskId}
        entityName={subTask.name}
        directUpdates={updates}
      />
    </div>
  );
};

export default SubTaskDetails;
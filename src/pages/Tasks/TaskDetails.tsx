import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft, MessageSquare, PlusCircle, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import TaskForm from '../../components/Task/TaskForm';
import SubTaskItem from '../../components/SubTask/SubTaskItem';
import SubTaskForm from '../../components/SubTask/SubTaskForm';
import UserAvatar from '../../components/UserAvatar';
import { useAppContext } from '../../context/AppContext';
import { SubTask } from '../../types';
import UpdateForm from '../../components/Update/UpdateForm';
import UpdatesList from '../../components/Update/UpdatesList';
import UpdatesModal from '../../components/Update/UpdatesModal';
import DropdownMenu from '../../components/ui/DropdownMenu';

const TaskDetails: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const { 
    projects, 
    tasks, 
    subTasks, 
    deleteTask, 
    getUsers,
    getUpdatesForEntity,
    getRelatedUpdates
  } = useAppContext();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [subTaskToEdit, setSubTaskToEdit] = useState<SubTask | undefined>(undefined);
  
  if (!projectId || !taskId) {
    navigate('/projects');
    return null;
  }
  
  const project = projects.find((p) => p.id === projectId);
  const task = tasks.find((t) => t.id === taskId);
  
  // Debug: Log task data
  console.log('TaskDetails - task found:', task);
  console.log('TaskDetails - task.priority:', task?.priority);
  
  if (!project || !task) {
    navigate(`/projects/${projectId}`);
    return null;
  }
  
  // Get subtasks for this task
  const taskSubTasks = subTasks.filter((st) => st.taskId === taskId);
  
  // Get updates for this task
  const directUpdates = getUpdatesForEntity('task', taskId);
  const allRelatedUpdates = getRelatedUpdates('task', taskId);
  
  const handleDeleteTask = () => {
    deleteTask(taskId);
    navigate(`/projects/${projectId}`);
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

  // Get priority badge styling
  const getPriorityStyle = (priority: string | undefined): { backgroundColor: string; color: string; text: string } => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return { backgroundColor: '#B91C1C', color: 'white', text: 'CRITICAL' };
      case 'high':
        return { backgroundColor: '#DC2626', color: 'white', text: 'HIGH' };
      case 'medium':
        return { backgroundColor: '#F59E0B', color: 'white', text: 'MEDIUM' };
      case 'low':
        return { backgroundColor: '#10B981', color: 'white', text: 'LOW' };
      case 'very low':
        return { backgroundColor: '#6B7280', color: 'white', text: 'VERY LOW' };
      default:
        return { backgroundColor: '#6B7280', color: 'white', text: 'NORMAL' };
    }
  };
  
  const handleEditSubTask = (subTask: SubTask) => {
    setSubTaskToEdit(subTask);
    setIsSubTaskModalOpen(true);
  };
  
  const handleAddSubTask = () => {
    setSubTaskToEdit(undefined);
    setIsSubTaskModalOpen(true);
  };
  
  const handleSubTaskModalClose = () => {
    setIsSubTaskModalOpen(false);
    setSubTaskToEdit(undefined);
  };
  
  const handleOpenUpdatesModal = () => {
    setIsUpdatesModalOpen(true);
  };
  
  const users = getUsers();
  const assignee = task.assigneeId ? users.find(user => user.id === task.assigneeId) : null;
  
  // Dropdown menu items for task actions
  const taskMenuItems = [
    {
      label: 'View Updates',
      icon: <MessageSquare size={18} />,
      onClick: handleOpenUpdatesModal
    },
    {
      label: 'Edit Task',
      icon: <Edit size={18} />,
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'Delete Task',
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
          onClick={() => navigate(`/projects/${projectId}`)}
          size="sm"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Project
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 mr-3">{task.name} - Task</h1>
            <Badge variant={getStatusVariant(task.status)} className="mr-2">
              {getStatusText(task.status)}
            </Badge>
            <Badge variant={getTypeVariant(task.taskType)} className="mr-2">
              {task.taskType}
            </Badge>
            {/* DEBUG: Always show priority info */}
            <span
              className="px-2 py-1 rounded text-xs font-bold mr-2"
              style={{
                backgroundColor: '#FF0000',
                color: 'white',
                border: '2px solid yellow'
              }}
            >
              🚨 PRIORITY DEBUG: {task.priority ? `${task.priority}` : `NULL/UNDEFINED (${typeof task.priority})`} 🚨
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div>
          <DropdownMenu items={taskMenuItems} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{task.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Subtasks</h2>
              <Button onClick={handleAddSubTask} size="sm">
                <PlusCircle size={16} className="mr-1" />
                Add Subtask
              </Button>
            </div>
            
            {taskSubTasks.length > 0 ? (
              <div className="border rounded-md overflow-hidden bg-white border-gray-200">
                {taskSubTasks.map((subTask) => (
                  <SubTaskItem 
                    key={subTask.id} 
                    subTask={subTask} 
                    onEdit={handleEditSubTask}
                    taskId={taskId}
                    projectId={projectId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No subtasks created yet.</p>
                <Button 
                  className="mt-4" 
                  onClick={handleAddSubTask}
                  size="sm"
                >
                  Add Your First Subtask
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Project</h4>
                  <p className="mt-1">{project.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Category</h4>
                  <p className="mt-1">{project.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Type</h4>
                  <p className="mt-1">{task.taskType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  <p className="mt-1">{getStatusText(task.status)}</p>
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
                  <p className="mt-1">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Last Updated</h4>
                  <p className="mt-1">{new Date(task.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Subtasks Summary</h4>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{taskSubTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">
                      {taskSubTasks.filter(subtask => subtask.status === 'done').length}
                    </span>
                  </div>
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
              {directUpdates.length > 0 ? (
                <div className="mb-6">
                  <UpdatesList updates={directUpdates.slice(0, 3)} />
                  {directUpdates.length > 3 && (
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add Update to Task</h4>
                <UpdateForm entityType="task" entityId={taskId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
      >
        <TaskForm 
          projectId={projectId} 
          task={task} 
          onSubmit={() => setIsEditModalOpen(false)} 
        />
      </Modal>
      
      {/* Add/Edit Subtask Modal */}
      <Modal
        isOpen={isSubTaskModalOpen}
        onClose={handleSubTaskModalClose}
        title={subTaskToEdit ? "Edit Subtask" : "Add Subtask"}
      >
        <SubTaskForm 
          taskId={taskId} 
          subTask={subTaskToEdit}
          onSubmit={handleSubTaskModalClose}
        />
      </Modal>
      
      {/* Delete Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Task"
      >
        <div>
          <p className="mb-6">Are you sure you want to delete this task? This action cannot be undone and will also delete all sub-tasks associated with this task.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} size="sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTask} size="sm">
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Updates Modal */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="task"
        entityId={taskId}
        entityName={task.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </div>
  );
};

export default TaskDetails;
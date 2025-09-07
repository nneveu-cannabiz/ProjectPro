import React from 'react';
import Modal from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import TaskForm from '../../../../../../components/Task/TaskForm';
import SubTaskForm from '../../../../../../components/SubTask/SubTaskForm';
import UpdatesModal from '../../../../../../components/Update/UpdatesModal';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface TaskDetailsModalsProps {
  task: any;
  currentSubTask: any;
  isEditModalOpen: boolean;
  isSubTaskModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isUpdatesModalOpen: boolean;
  directUpdates: any[];
  allRelatedUpdates: any[];
  onEditModalClose: () => void;
  onSubTaskModalClose: () => void;
  onDeleteModalClose: () => void;
  onUpdatesModalClose: () => void;
  onDeleteTask: () => void;
}

const TaskDetailsModals: React.FC<TaskDetailsModalsProps> = ({
  task,
  currentSubTask,
  isEditModalOpen,
  isSubTaskModalOpen,
  isDeleteModalOpen,
  isUpdatesModalOpen,
  directUpdates,
  allRelatedUpdates,
  onEditModalClose,
  onSubTaskModalClose,
  onDeleteModalClose,
  onUpdatesModalClose,
  onDeleteTask
}) => {
  return (
    <>
      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        title="Edit Task"
      >
        <TaskForm 
          projectId={task.projectId}
          task={task} 
          onSubmit={onEditModalClose} 
        />
      </Modal>
      
      {/* Add/Edit SubTask Modal */}
      <Modal
        isOpen={isSubTaskModalOpen}
        onClose={onSubTaskModalClose}
        title={currentSubTask ? "Edit Subtask" : "Add New Subtask"}
      >
        <SubTaskForm 
          taskId={task.id} 
          subTask={currentSubTask}
          onSubmit={onSubTaskModalClose} 
        />
      </Modal>
      
      {/* Delete Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        title="Delete Task"
      >
        <div>
          <p className="mb-6">
            Are you sure you want to delete this task? This action cannot be undone and will also delete all subtasks associated with this task.
          </p>
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={onDeleteModalClose} 
              size="sm"
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy,
                borderColor: brandTheme.primary.navy
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={onDeleteTask} 
              size="sm"
              style={{
                backgroundColor: brandTheme.status.error,
                color: brandTheme.background.primary
              }}
            >
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Updates Modal */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={onUpdatesModalClose}
        entityType="task"
        entityId={task.id}
        entityName={task.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </>
  );
};

export default TaskDetailsModals;

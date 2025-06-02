import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import UserSelect from '../UserSelect';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SubTask } from '../../types';

interface SubTaskFormProps {
  taskId: string;
  subTask?: SubTask;
  onSubmit: () => void;
}

const SubTaskForm: React.FC<SubTaskFormProps> = ({ 
  taskId, 
  subTask, 
  onSubmit 
}) => {
  const { taskTypes, addSubTask, updateSubTask, getUsers } = useAppContext();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(subTask?.name || '');
  const [description, setDescription] = useState(subTask?.description || '');
  const [taskType, setTaskType] = useState(subTask?.taskType || '');
  const [status, setStatus] = useState(subTask?.status || 'todo');
  const [assigneeId, setAssigneeId] = useState(subTask?.assigneeId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const users = getUsers();
  
  const taskTypeOptions = taskTypes.map((type) => ({
    value: type.name,
    label: type.name,
  }));
  
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'SubTask name is required';
    }
    
    if (!taskType) {
      newErrors.taskType = 'Task type is required';
    }
    
    if (!status) {
      newErrors.status = 'Status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (subTask) {
      updateSubTask({
        ...subTask,
        name,
        description,
        taskType,
        status: status as 'todo' | 'in-progress' | 'done',
        assigneeId: assigneeId || undefined,
      });
    } else {
      addSubTask({
        taskId,
        name,
        description,
        taskType,
        status: status as 'todo' | 'in-progress' | 'done',
        assigneeId: assigneeId || undefined,
      });
    }
    
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="SubTask Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter subtask name"
      />
      
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder="Enter subtask description"
      />
      
      <Select
        label="Task Type"
        options={taskTypeOptions}
        value={taskType}
        onChange={setTaskType}
        error={errors.taskType}
      />
      
      <Select
        label="Status"
        options={statusOptions}
        value={status}
        onChange={setStatus}
        error={errors.status}
      />
      
      <UserSelect
        label="Assignee"
        selectedUserId={assigneeId}
        onChange={setAssigneeId}
        users={users}
        placeholder="Unassigned"
      />
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button type="button" variant="outline" onClick={onSubmit}>
          Cancel
        </Button>
        <Button type="submit">
          {subTask ? 'Update SubTask' : 'Create SubTask'}
        </Button>
      </div>
    </form>
  );
};

export default SubTaskForm;
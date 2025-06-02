import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import UserSelect from '../UserSelect';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onSubmit: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onSubmit }) => {
  const { taskTypes, addTask, updateTask, getUsers } = useAppContext();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [taskType, setTaskType] = useState(task?.taskType || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
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
      newErrors.name = 'Task name is required';
    }
    
    // Description is now optional, so we removed the validation check here
    
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
    
    if (task) {
      updateTask({
        ...task,
        name,
        description,
        taskType,
        status: status as 'todo' | 'in-progress' | 'done',
        assigneeId: assigneeId || undefined,
      });
    } else {
      addTask({
        projectId,
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
        label="Task Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter task name"
      />
      
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder="Enter task description"
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
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
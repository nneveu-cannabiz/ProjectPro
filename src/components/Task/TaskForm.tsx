import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import UserSelect from '../UserSelect';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Task, Project } from '../../types';

interface TaskFormProps {
  projectId: string;
  task?: Task;
  project?: Project;
  onSubmit: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, project, onSubmit }) => {
  const { taskTypes, addTask, updateTask, getUsers } = useAppContext();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [taskType, setTaskType] = useState(task?.taskType || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [startDate, setStartDate] = useState(task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(task?.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '');
  const [deadline, setDeadline] = useState(task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const users = getUsers();
  
  const taskTypeOptions = taskTypes.map((type) => ({
    value: type.name,
    label: type.name,
  }));
  
  // Helper functions for date constraints
  const getMinDate = () => {
    if (project?.startDate) {
      return new Date(project.startDate).toISOString().split('T')[0];
    }
    return '';
  };
  
  const getMaxDate = () => {
    if (project?.endDate) {
      return new Date(project.endDate).toISOString().split('T')[0];
    }
    return '';
  };
  
  const validateDates = () => {
    const dateErrors: Record<string, string> = {};
    
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        dateErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (deadline && startDate) {
      if (new Date(deadline) < new Date(startDate)) {
        dateErrors.deadline = 'Deadline cannot be before start date';
      }
    }
    
    return dateErrors;
  };
  
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
    { value: 'Very Low', label: 'Very Low' },
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
    
    // Add date validation
    const dateErrors = validateDates();
    Object.assign(newErrors, dateErrors);
    
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
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low',
        assigneeId: assigneeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        deadline: deadline || undefined,
      });
    } else {
      addTask({
        projectId,
        name,
        description,
        taskType,
        status: status as 'todo' | 'in-progress' | 'done',
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low',
        assigneeId: assigneeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        deadline: deadline || undefined,
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
      
      <Select
        label="Priority"
        options={priorityOptions}
        value={priority}
        onChange={setPriority}
      />
      
      <UserSelect
        label="Assignee"
        selectedUserId={assigneeId}
        onChange={setAssigneeId}
        users={users}
        placeholder="Unassigned"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Input
          type="date"
          label="Start Date (optional)"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
          min={getMinDate()}
          max={getMaxDate()}
        />
        
        <Input
          type="date"
          label="End Date (optional)"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.endDate}
          min={startDate || getMinDate()}
          max={getMaxDate()}
        />
        
        <Input
          type="date"
          label="Deadline (optional)"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          error={errors.deadline}
          min={startDate || getMinDate()}
          max={getMaxDate()}
        />
      </div>
      
      {project && (project.startDate || project.endDate) && (
        <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 rounded-md">
          <strong>Project Date Range:</strong> 
          {project.startDate && ` Start: ${new Date(project.startDate).toLocaleDateString()}`}
          {project.startDate && project.endDate && ' • '}
          {project.endDate && ` End: ${new Date(project.endDate).toLocaleDateString()}`}
        </div>
      )}
      
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
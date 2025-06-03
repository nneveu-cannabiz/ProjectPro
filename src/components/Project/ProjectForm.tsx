import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Project } from '../../types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit }) => {
  const { categories, addProject, updateProject } = useAppContext();
  
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [category, setCategory] = useState(project?.category || '');
  const [status, setStatus] = useState(project?.status || 'todo');
  const [projectType, setProjectType] = useState(project?.projectType || 'Active');
  const [priority, setPriority] = useState(project?.priority || 'Medium');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));
  
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];
  
  const projectTypeOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Future', label: 'Future' },
    { value: 'On Hold', label: 'On Hold' },
  ];
  
  const priorityOptions = [
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    // Description is now optional, so we removed the validation check here
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    if (!status) {
      newErrors.status = 'Status is required';
    }
    
    if (!projectType) {
      newErrors.projectType = 'Project type is required';
    }
    
    if (!priority) {
      newErrors.priority = 'Priority is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (project) {
      updateProject({
        ...project,
        name,
        description,
        category,
        status: status as 'todo' | 'in-progress' | 'done',
        projectType: projectType as 'Active' | 'Upcoming' | 'Future' | 'On Hold',
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low',
      });
    } else {
      addProject({
        name,
        description,
        category,
        status: status as 'todo' | 'in-progress' | 'done',
        projectType: projectType as 'Active' | 'Upcoming' | 'Future' | 'On Hold',
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low',
      });
    }
    
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter project name"
      />
      
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder="Enter project description"
      />
      
      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={setCategory}
        error={errors.category}
      />
      
      <Select
        label="Status"
        options={statusOptions}
        value={status}
        onChange={setStatus}
        error={errors.status}
      />
      
      <Select
        label="Project Type"
        options={projectTypeOptions}
        value={projectType}
        onChange={setProjectType}
        error={errors.projectType}
      />
      
      <Select
        label="Priority"
        options={priorityOptions}
        value={priority}
        onChange={setPriority}
        error={errors.priority}
      />
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button type="button" variant="outline" onClick={onSubmit}>
          Cancel
        </Button>
        <Button type="submit">
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
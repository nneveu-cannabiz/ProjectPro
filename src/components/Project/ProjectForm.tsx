import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import UserSelect from '../UserSelect';
import { useAppContext } from '../../context/AppContext';
import { Project } from '../../types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit }) => {
  const { categories, addProject, updateProject, getUsers, getProductDevUsers, projects: allProjects, addCategory } = useAppContext();
  
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [category, setCategory] = useState(project?.category || '');
  const [status, setStatus] = useState(project?.status || 'todo');
  const [projectType, setProjectType] = useState(project?.projectType || 'Active');
  const [assigneeId, setAssigneeId] = useState(project?.assigneeId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const users = getProductDevUsers();
  
  // Get unique categories from existing projects plus database categories
  const getAvailableCategories = () => {
    const projectCategories = new Set(allProjects.map(p => p.category).filter(Boolean));
    const dbCategories = new Set(categories.map(c => c.name));
    
    // Also include the currently selected category if it exists
    if (category) {
      projectCategories.add(category);
    }
    
    // Combine and deduplicate
    const allCategories = Array.from(new Set([...dbCategories, ...projectCategories]));
    return allCategories.sort();
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'ADD_NEW_CATEGORY') {
      setShowAddCategory(true);
    } else {
      setCategory(value);
      setShowAddCategory(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsAddingCategory(true);
      const categoryName = newCategoryName.trim();
      
      await addCategory(categoryName);
      
      // Hide the add form first
      setShowAddCategory(false);
      setNewCategoryName('');
      
      // Use setTimeout to ensure the context has updated before setting the category
      setTimeout(() => {
        setCategory(categoryName);
      }, 0);
      
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategory(false);
    setNewCategoryName('');
  };
  
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
        assigneeId: assigneeId || undefined,
      });
    } else {
      addProject({
        name,
        description,
        category,
        status: status as 'todo' | 'in-progress' | 'done',
        projectType: projectType as 'Active' | 'Upcoming' | 'Future' | 'On Hold',
        assigneeId: assigneeId || undefined,
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
      
      {!showAddCategory ? (
        <Select
          label="Category"
          options={[
            ...getAvailableCategories().map((catName) => ({
              value: catName,
              label: catName,
            })),
            { value: 'ADD_NEW_CATEGORY', label: '+ Add New Category' }
          ]}
          value={category}
          onChange={handleCategoryChange}
          error={errors.category}
        />
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add New Category
          </label>
          <div className="flex space-x-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewCategory();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddNewCategory}
              disabled={!newCategoryName.trim() || isAddingCategory}
              className="whitespace-nowrap"
            >
              {isAddingCategory ? 'Adding...' : 'Add'}
            </Button>
            <Button
              type="button"
              onClick={handleCancelAddCategory}
              variant="outline"
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
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
      
      <UserSelect
        label="Project Assignee"
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
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
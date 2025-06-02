import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Category, TaskType } from '../../types';

interface EditableItemProps {
  item: Category | TaskType;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const EditableItem: React.FC<EditableItemProps> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate(item.id, name);
      setIsEditing(false);
    }
  };
  
  return (
    <div className="p-3 border rounded-md mb-2 bg-white">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="mb-0"
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" size="sm">Save</Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <span>{item.name}</span>
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-red-500"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SettingsFormProps {
  type: 'category' | 'taskType';
}

const SettingsForm: React.FC<SettingsFormProps> = ({ type }) => {
  const { 
    categories, 
    taskTypes, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    addTaskType,
    updateTaskType,
    deleteTaskType
  } = useAppContext();
  
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState('');
  
  const items = type === 'category' ? categories : taskTypes;
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      setError(`${type === 'category' ? 'Category' : 'Task type'} name is required`);
      return;
    }
    
    if (type === 'category') {
      addCategory(newItemName);
    } else {
      addTaskType(newItemName);
    }
    
    setNewItemName('');
    setError('');
  };
  
  const handleUpdateItem = (id: string, name: string) => {
    if (type === 'category') {
      updateCategory({ id, name });
    } else {
      updateTaskType({ id, name });
    }
  };
  
  const handleDeleteItem = (id: string) => {
    if (type === 'category') {
      deleteCategory(id);
    } else {
      deleteTaskType(id);
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {type === 'category' ? 'Categories' : 'Task Types'}
      </h2>
      
      <form onSubmit={handleAddItem} className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder={`Add new ${type === 'category' ? 'category' : 'task type'}`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              error={error}
              className="mb-0"
            />
          </div>
          <Button type="submit">Add</Button>
        </div>
      </form>
      
      <div className="space-y-2">
        {items.map((item) => (
          <EditableItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsForm;
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

interface UpdateFormProps {
  entityType: 'project' | 'task' | 'subtask';
  entityId: string;
  onComplete?: () => void;
}

const UpdateForm: React.FC<UpdateFormProps> = ({ 
  entityType, 
  entityId,
  onComplete 
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { addUpdate } = useAppContext();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Update message is required');
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to add an update');
      return;
    }
    
    addUpdate({
      message: message.trim(),
      userId: currentUser.id,
      entityType,
      entityId,
    });
    
    setMessage('');
    setError('');
    
    if (onComplete) {
      onComplete();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        error={error}
        placeholder="Enter your update message..."
      />
      
      <div className="flex justify-end">
        <Button type="submit">
          Add Update
        </Button>
      </div>
    </form>
  );
};

export default UpdateForm;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import ProjectForm from '../../components/Project/ProjectForm';
import { useAppContext } from '../../context/AppContext';

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const { addProject } = useAppContext();
  
  const handleFormSubmit = () => {
    navigate('/projects');
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/projects')}
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Projects
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm onSubmit={handleFormSubmit} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProject;
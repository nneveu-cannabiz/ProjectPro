import React, { useState } from 'react';
import { PlusCircle, Pencil } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { Card, CardContent } from '../../../../../../components/ui/Card';
import SubTaskItem from '../../../../../../components/SubTask/SubTaskItem';
import TaskDetailsSection from './TaskDetailsSection';
import ProjectDocumentsSection from './ProjectDocumentsSection';
import TaskUpdates from './TaskUpdates';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface TaskDetailsContentProps {
  task: any;
  project?: any;
  taskSubTasks: any[];
  directUpdates: any[];
  activeTab: 'details' | 'documents';
  isEditingDescription: boolean;
  editedDescription: string;
  onSetActiveTab: (tab: 'details' | 'documents') => void;
  onEditDescription: () => void;
  onSaveDescription: () => void;
  onCancelDescription: () => void;
  onSetEditedDescription: (value: string) => void;
  onAddSubTask: () => void;
  onEditSubTask: (subTask: any) => void;
  onOpenUpdatesModal: () => void;
  onUpdateTask: (task: any) => Promise<void>;
  onUpdateProject: (project: any) => Promise<void>;
}

const TaskDetailsContent: React.FC<TaskDetailsContentProps> = ({
  task,
  project,
  taskSubTasks,
  directUpdates,
  activeTab,
  isEditingDescription,
  editedDescription,
  onSetActiveTab,
  onEditDescription,
  onSaveDescription,
  onCancelDescription,
  onSetEditedDescription,
  onAddSubTask,
  onEditSubTask,
  onOpenUpdatesModal,
  onUpdateTask,
  onUpdateProject
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 120px)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          {/* Description Header */}
          <div 
            className="px-4 py-3 mb-4 rounded-md"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: brandTheme.background.primary }}
            >
              Description
            </h2>
          </div>
          
          {/* Description Card */}
          <Card className="mb-6">
            <CardContent className="p-6 relative">
              {!isEditingDescription && (
                <button
                  onClick={onEditDescription}
                  className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Edit description"
                  style={{ color: brandTheme.text.muted }}
                >
                  <Pencil size={16} />
                </button>
              )}
              
              {isEditingDescription ? (
                <div>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => onSetEditedDescription(e.target.value)}
                    className="w-full min-h-[100px] p-3 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.secondary,
                      backgroundColor: brandTheme.background.primary
                    }}
                    placeholder="Enter task description..."
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelDescription}
                      style={{
                        backgroundColor: brandTheme.primary.lightBlue,
                        color: brandTheme.primary.navy,
                        borderColor: brandTheme.primary.navy
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={onSaveDescription}
                      style={{
                        backgroundColor: brandTheme.primary.lightBlue,
                        color: brandTheme.primary.navy
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="whitespace-pre-wrap break-words pr-8"
                  style={{ 
                    color: brandTheme.text.secondary,
                    lineHeight: '1.6',
                    minHeight: 'auto'
                  }}
                >
                  {task.description || 'No description provided.'}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Subtasks Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 mb-4 rounded-md"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h2 
              className="text-xl font-semibold"
              style={{ color: brandTheme.background.primary }}
            >
              Subtasks
            </h2>
            <Button 
              onClick={onAddSubTask} 
              size="sm"
              className="hover:opacity-90"
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy
              }}
            >
              <PlusCircle size={16} className="mr-1" />
              Add Subtask
            </Button>
          </div>
          
          {/* Subtasks List */}
          {taskSubTasks.length > 0 ? (
            <div className="max-h-[500px] overflow-y-auto">
              {taskSubTasks.map((subTask) => (
                <SubTaskItem
                  key={subTask.id}
                  subTask={subTask}
                  onEdit={onEditSubTask}
                  taskId={task.id}
                  projectId={task.projectId}
                />
              ))}
            </div>
          ) : (
            <div 
              className="text-center py-12 rounded-lg border border-gray-200"
              style={{ backgroundColor: brandTheme.background.primary }}
            >
              <p style={{ color: brandTheme.text.muted }}>No subtasks created yet.</p>
              <Button 
                className="mt-4" 
                onClick={onAddSubTask}
                size="sm"
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.primary.navy
                }}
              >
                Add Your First Subtask
              </Button>
            </div>
          )}
          
          {/* Updates Section */}
          <TaskUpdates
            taskId={task.id}
            directUpdates={directUpdates}
            onOpenUpdatesModal={onOpenUpdatesModal}
          />
        </div>
        
        {/* Right Sidebar */}
        <div className="lg:col-span-2">
          <Card>
            {/* Tab Header */}
            <div 
              className="px-6 py-2"
              style={{ 
                backgroundColor: brandTheme.primary.navy,
                color: brandTheme.background.primary 
              }}
            >
              <div className="flex items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onSetActiveTab('details')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'details'
                        ? 'bg-white text-blue-700'
                        : 'text-white hover:text-gray-200'
                    }`}
                  >
                    Task Details
                  </button>
                  <button
                    onClick={() => onSetActiveTab('documents')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'documents'
                        ? 'bg-white text-blue-700'
                        : 'text-white hover:text-gray-200'
                    }`}
                  >
                    Documents/Resources
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tab Content */}
            <CardContent>
              {activeTab === 'details' ? (
                <TaskDetailsSection
                  task={task}
                  taskSubTasks={taskSubTasks}
                  onUpdateTask={onUpdateTask}
                />
              ) : (
                <ProjectDocumentsSection
                  project={project}
                  onUpdateProject={onUpdateProject}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsContent;

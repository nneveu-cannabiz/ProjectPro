import React, { useState } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { X } from 'lucide-react';
import SprintTaskReview from './SprintTaskReview';
import { supabase } from '../../../../../lib/supabase';
import { useAuth } from '../../../../../context/AuthContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  assignee_id?: string;
  status?: string;
}

interface SprintReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSprintGroupCreated?: () => void;
  fromSprintGroup?: boolean; // Optional: indicates modal was opened from sprint group
}

const SprintReviewModal: React.FC<SprintReviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onSprintGroupCreated,
  fromSprintGroup = false
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'summary' | 'reports'>('tasks');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  const handleCreateSprint = async (sprintType: 'Sprint 1' | 'Sprint 2') => {
    if (!currentUser?.id || !project?.id || selectedTaskIds.length === 0) {
      alert('Please select tasks and ensure you are logged in');
      return;
    }

    setIsCreatingSprint(true);
    try {
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .insert({
          project_id: project.id,
          selected_task_ids: selectedTaskIds,
          sprint_type: sprintType,
          status: 'active',
          created_by: currentUser.id,
          name: `${project.name} - ${sprintType}`,
          description: `Sprint created from ${selectedTaskIds.length} selected tasks`
        });

      if (error) {
        console.error('Error creating sprint:', error);
        alert('Failed to create sprint. Please try again.');
        return;
      }

      alert(`${sprintType} created successfully with ${selectedTaskIds.length} tasks!`);
      setShowSprintModal(false);
      setSelectedTaskIds([]);
      
      // Trigger refresh and close modal
      if (onSprintGroupCreated) {
        onSprintGroupCreated();
      }
    } catch (error) {
      console.error('Error creating sprint:', error);
      alert('Failed to create sprint. Please try again.');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleTaskSelectionChange = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  if (!isOpen || !project) return null;

  console.log('SprintReviewModal project data:', project);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-7xl flex flex-col"
        style={{ 
          minHeight: '80vh',
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light 
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.brand 
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">
              Sprint Plan Review
            </h2>
            <p className="text-sm text-white opacity-90 mt-1">
              {project.name}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          className="px-6 py-4 border-b"
          style={{ 
            backgroundColor: brandTheme.background.brandLight,
            borderColor: brandTheme.border.light 
          }}
        >
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'tasks' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'tasks' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Task Review
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'summary' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'summary' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === 'reports' ? brandTheme.primary.navy : 'transparent',
                color: activeTab === 'reports' ? brandTheme.background.primary : brandTheme.text.primary,
              }}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 'calc(80vh - 200px)' }}>
          {activeTab === 'tasks' && (
            <div className="h-full">
              <SprintTaskReview 
                projectId={project.id} 
                onTaskSelectionChange={handleTaskSelectionChange}
                onCreateSprintGroup={() => setShowSprintModal(true)}
                fromSprintGroup={fromSprintGroup}
              />
            </div>
          )}
          
          {activeTab === 'summary' && (
            <div className="p-6">
              <div 
                className="text-center py-12"
                style={{ color: brandTheme.text.muted }}
              >
                <h3 className="text-lg font-semibold mb-2">Sprint Summary</h3>
                <p>Summary view coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="p-6">
              <div 
                className="text-center py-12"
                style={{ color: brandTheme.text.muted }}
              >
                <h3 className="text-lg font-semibold mb-2">Sprint Reports</h3>
                <p>Reports view coming soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="p-6 border-t flex justify-end space-x-3 flex-shrink-0"
          style={{ borderColor: brandTheme.border.light }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.medium,
              color: brandTheme.text.secondary,
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Sprint Selection Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            {/* Modal Header */}
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: brandTheme.primary.navy,
                borderColor: brandTheme.border.light 
              }}
            >
              <h3 className="text-lg font-bold text-white">Create Sprint Group</h3>
              <p className="text-sm text-white opacity-90 mt-1">
                Select which sprint to assign {selectedTaskIds.length} tasks to
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={() => handleCreateSprint('Sprint 1')}
                  disabled={isCreatingSprint}
                  className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors disabled:opacity-50"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                  }}
                >
                  <div className="font-semibold" style={{ color: brandTheme.text.primary }}>
                    Sprint 1
                  </div>
                  <div className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
                    Assign selected tasks to Sprint 1 column
                  </div>
                </button>

                <button
                  onClick={() => handleCreateSprint('Sprint 2')}
                  disabled={isCreatingSprint}
                  className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors disabled:opacity-50"
                  style={{
                    borderColor: brandTheme.border.medium,
                    backgroundColor: brandTheme.background.secondary,
                  }}
                >
                  <div className="font-semibold" style={{ color: brandTheme.text.primary }}>
                    Sprint 2
                  </div>
                  <div className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
                    Assign selected tasks to Sprint 2 column
                  </div>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="p-6 border-t flex justify-end space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={() => setShowSprintModal(false)}
                disabled={isCreatingSprint}
                className="px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.background.primary,
                  borderColor: brandTheme.border.medium,
                  color: brandTheme.text.secondary,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintReviewModal;

import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { X, Edit2, Check } from 'lucide-react';
import SprintTaskReview from './SprintTaskReview';
import { supabase } from '../../../../../lib/supabase';
import { useAuth } from '../../../../../context/AuthContext';
import SprintProjectSummary from './sprintprojectsummary';

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
  const [modalMode, setModalMode] = useState<'create' | 'add'>('create'); // Track modal mode
  const [existingSprints, setExistingSprints] = useState<Array<{ id: string; name: string; sprint_type: string; sprint_id: string }>>([]);
  const [availableSprintGroups, setAvailableSprintGroups] = useState<Array<{ sprint_id: string; name: string; start_date: string; end_date: string }>>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Load existing sprints for this project (for adding to existing)
  useEffect(() => {
    if (project?.id && showSprintModal && modalMode === 'add') {
      loadExistingSprints();
    }
  }, [project?.id, showSprintModal, modalMode]);

  // Load available sprint groups (for creating new epic in a sprint)
  useEffect(() => {
    if (showSprintModal && modalMode === 'create') {
      loadAvailableSprintGroups();
    }
  }, [showSprintModal, modalMode]);

  const loadAvailableSprintGroups = async () => {
    try {
      // Get all unique sprint_id values with their details
      const { data, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('sprint_id, name, start_date, end_date')
        .not('sprint_id', 'is', null)
        .eq('status', 'active')
        .order('sprint_id', { ascending: true });

      if (error) {
        console.error('Error loading available sprint groups:', error);
        return;
      }

      // Group by sprint_id to get unique sprints
      const uniqueSprints = new Map<string, any>();
      (data || []).forEach((item: any) => {
        if (!uniqueSprints.has(item.sprint_id)) {
          uniqueSprints.set(item.sprint_id, item);
        }
      });

      setAvailableSprintGroups(Array.from(uniqueSprints.values()));
    } catch (error) {
      console.error('Error loading available sprint groups:', error);
    }
  };

  const loadExistingSprints = async () => {
    if (!project?.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('id, name, sprint_type, sprint_id')
        .eq('project_id', project.id)
        .eq('status', 'active')
        .order('sprint_id', { ascending: true });

      if (error) {
        console.error('Error loading existing sprints:', error);
        return;
      }

      setExistingSprints(data || []);
    } catch (error) {
      console.error('Error loading existing sprints:', error);
    }
  };

  const handleCreateSprintInGroup = async (sprintGroup: { sprint_id: string; start_date: string; end_date: string }) => {
    if (!currentUser?.id || !project?.id || selectedTaskIds.length === 0) {
      alert('Please select tasks and ensure you are logged in');
      return;
    }

    setIsCreatingSprint(true);
    try {
      const sprintKey = `Sprint ${sprintGroup.sprint_id}`;
      
      // Get the highest ranking for this specific sprint to assign next available rank
      const { data: existingSprintsData, error: rankingError } = await (supabase as any)
        .from('PMA_Sprints')
        .select('ranking')
        .eq('status', 'active')
        .eq('sprint_id', sprintGroup.sprint_id);

      if (rankingError) {
        console.error('Error fetching existing sprint rankings:', rankingError);
      }

      // Determine the next ranking for this sprint
      let nextRanking = 1;
      if (existingSprintsData && existingSprintsData.length > 0) {
        const rankings = existingSprintsData
          .map((s: any) => s.ranking?.[sprintKey])
          .filter((r: any) => typeof r === 'number');
        
        if (rankings.length > 0) {
          nextRanking = Math.max(...rankings) + 1;
        }
      }

      console.log(`Creating epic in Sprint ${sprintGroup.sprint_id} with ranking:`, nextRanking);

      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .insert({
          project_id: project.id,
          selected_task_ids: selectedTaskIds,
          sprint_type: 'Sprint 1', // Default type
          sprint_id: sprintGroup.sprint_id,
          start_date: sprintGroup.start_date,
          end_date: sprintGroup.end_date,
          status: 'active',
          created_by: currentUser.id,
          name: `${project.name} - Sprint ${sprintGroup.sprint_id}`,
          description: `Epic created from ${selectedTaskIds.length} selected tasks`,
          ranking: {
            [sprintKey]: nextRanking
          }
        });

      if (error) {
        console.error('Error creating sprint:', error);
        alert('Failed to create epic. Please try again.');
        return;
      }

      alert(`Epic created successfully in Sprint ${sprintGroup.sprint_id} with ${selectedTaskIds.length} tasks!`);
      setShowSprintModal(false);
      setSelectedTaskIds([]);
      setModalMode('create');
      
      // Trigger refresh and close modal
      if (onSprintGroupCreated) {
        onSprintGroupCreated();
      }
    } catch (error) {
      console.error('Error creating sprint:', error);
      alert('Failed to create epic. Please try again.');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleAddToExistingSprint = async (sprintId: string) => {
    if (!currentUser?.id || !project?.id || selectedTaskIds.length === 0) {
      alert('Please select tasks and ensure you are logged in');
      return;
    }

    setIsCreatingSprint(true);
    try {
      // Get the existing sprint to merge task IDs and fetch its dates and sprint_id
      const { data: existingSprint, error: fetchError } = await (supabase as any)
        .from('PMA_Sprints')
        .select('selected_task_ids, name, start_date, end_date, sprint_id')
        .eq('id', sprintId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing sprint:', fetchError);
        alert('Failed to fetch sprint. Please try again.');
        return;
      }

      // Merge existing task IDs with new ones (avoid duplicates)
      const existingTaskIds = existingSprint.selected_task_ids || [];
      const mergedTaskIds = [...new Set([...existingTaskIds, ...selectedTaskIds])];

      // Update the sprint with merged task IDs, maintaining dates and sprint_id
      const updateData: any = {
        selected_task_ids: mergedTaskIds
      };

      // Ensure start_date, end_date, and sprint_id are maintained
      if (existingSprint.start_date) {
        updateData.start_date = existingSprint.start_date;
      }
      if (existingSprint.end_date) {
        updateData.end_date = existingSprint.end_date;
      }
      if (existingSprint.sprint_id) {
        updateData.sprint_id = existingSprint.sprint_id;
      }

      const { error: updateError } = await (supabase as any)
        .from('PMA_Sprints')
        .update(updateData)
        .eq('id', sprintId);

      if (updateError) {
        console.error('Error updating sprint:', updateError);
        alert('Failed to add tasks to sprint. Please try again.');
        return;
      }

      alert(`${selectedTaskIds.length} tasks added to "${existingSprint.name}" successfully!`);
      setShowSprintModal(false);
      setSelectedTaskIds([]);
      setModalMode('create');
      
      // Trigger refresh and close modal
      if (onSprintGroupCreated) {
        onSprintGroupCreated();
      }
    } catch (error) {
      console.error('Error adding tasks to sprint:', error);
      alert('Failed to add tasks to sprint. Please try again.');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleTaskSelectionChange = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const handleEditName = () => {
    setEditedProjectName(project?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!project?.id || !editedProjectName.trim()) {
      alert('Please enter a valid project name');
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await (supabase as any)
        .from('PMA_Projects')
        .update({ name: editedProjectName.trim() })
        .eq('id', project.id);

      if (error) {
        console.error('Error updating project name:', error);
        alert('Failed to update project name. Please try again.');
        return;
      }

      // Update local project object
      if (project) {
        project.name = editedProjectName.trim();
      }
      
      setIsEditingName(false);
      
      // Trigger refresh if callback is provided
      if (onSprintGroupCreated) {
        onSprintGroupCreated();
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      alert('Failed to update project name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedProjectName('');
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
          className="px-6 py-4 border-b relative"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.brand 
          }}
        >
          <div className="flex items-center justify-between w-full relative">
            {/* Left: Epic Review */}
            <div className="flex items-center gap-3 flex-shrink-0 z-10">
              <span className="text-sm font-semibold text-white opacity-90">
                Epic Review
              </span>
            </div>

            {/* Center: Epic Name (Absolutely centered) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedProjectName}
                    onChange={(e) => setEditedProjectName(e.target.value)}
                    className="px-3 py-2 text-xl font-bold rounded-lg text-center"
                    style={{
                      backgroundColor: 'white',
                      color: brandTheme.text.primary,
                      border: `2px solid ${brandTheme.primary.lightBlue}`,
                      minWidth: '300px',
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingName}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancel"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3 className="text-xl font-bold text-white text-center whitespace-nowrap">
                    {project.name}
                  </h3>
                  <button
                    onClick={handleEditName}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-all"
                    title="Edit project name"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Dates + Sprint Number + Close Button */}
            <div className="flex items-center gap-4 flex-shrink-0 z-10">
              <span className="text-sm font-medium text-white opacity-90">
                Oct 5, 2025 - Oct 16, 2025
              </span>
              <span className="text-lg font-bold text-white">
                Sprint 000
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
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
                onCreateSprintGroup={() => {
                  setModalMode('create');
                  setShowSprintModal(true);
                }}
                onAddToSprintGroup={() => {
                  setModalMode('add');
                  setShowSprintModal(true);
                }}
                fromSprintGroup={fromSprintGroup}
              />
            </div>
          )}
          
          {activeTab === 'summary' && (
            <div className="p-6">
              {project && project.id ? (
                <SprintProjectSummary projectId={project.id} />
              ) : (
                <div 
                  className="text-center py-12"
                  style={{ color: brandTheme.text.muted }}
                >
                  <h3 className="text-lg font-semibold mb-2">No Project Found</h3>
                  <p>This sprint has no associated project.</p>
                </div>
              )}
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
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'create' ? 'Create New Epic' : 'Add to Existing Epic'}
              </h3>
              <p className="text-sm text-white opacity-90 mt-1">
                {modalMode === 'create' 
                  ? `Create a new epic with ${selectedTaskIds.length} selected tasks`
                  : `Add ${selectedTaskIds.length} tasks to an existing epic`
                }
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalMode === 'create' ? (
                <div className="space-y-4">
                  {availableSprintGroups.length > 0 ? (
                    <>
                      <p className="text-sm mb-3" style={{ color: brandTheme.text.secondary }}>
                        Select a Sprint to add this epic to:
                      </p>
                      {availableSprintGroups.map((sprintGroup) => (
                        <button
                          key={sprintGroup.sprint_id}
                          onClick={() => handleCreateSprintInGroup(sprintGroup)}
                          disabled={isCreatingSprint}
                          className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors disabled:opacity-50"
                          style={{
                            borderColor: brandTheme.border.medium,
                            backgroundColor: brandTheme.background.secondary,
                          }}
                        >
                          <div className="font-semibold" style={{ color: brandTheme.text.primary }}>
                            Sprint {sprintGroup.sprint_id}
                          </div>
                          <div className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
                            {sprintGroup.start_date && sprintGroup.end_date ? (
                              <>
                                {new Date(sprintGroup.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' - '}
                                {new Date(sprintGroup.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </>
                            ) : (
                              'No dates set'
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8" style={{ color: brandTheme.text.muted }}>
                      <p>No Sprint groups available.</p>
                      <p className="text-sm mt-2">Create a Sprint group first in Sprint Planning.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {existingSprints.length > 0 ? (
                    existingSprints.map((sprint) => (
                      <button
                        key={sprint.id}
                        onClick={() => handleAddToExistingSprint(sprint.id)}
                        disabled={isCreatingSprint}
                        className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors disabled:opacity-50"
                        style={{
                          borderColor: brandTheme.border.medium,
                          backgroundColor: brandTheme.background.secondary,
                        }}
                      >
                        <div className="font-semibold" style={{ color: brandTheme.text.primary }}>
                          {sprint.name}
                        </div>
                        <div className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
                          {sprint.sprint_id ? `Sprint ${sprint.sprint_id}` : sprint.sprint_type}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8" style={{ color: brandTheme.text.muted }}>
                      <p>No existing epics found for this project.</p>
                      <p className="text-sm mt-2">Create a new epic instead.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="p-6 border-t flex justify-between space-x-3"
              style={{ borderColor: brandTheme.border.light }}
            >
              <button
                onClick={() => {
                  if (modalMode === 'create') {
                    setModalMode('add');
                  } else {
                    setModalMode('create');
                  }
                }}
                disabled={isCreatingSprint}
                className="px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: brandTheme.primary.lightBlue,
                  borderColor: brandTheme.primary.navy,
                  color: brandTheme.primary.navy,
                }}
              >
                {modalMode === 'create' ? 'Add to Existing Epic' : 'Create New Epic'}
              </button>
              <button
                onClick={() => {
                  setShowSprintModal(false);
                  setModalMode('create');
                }}
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

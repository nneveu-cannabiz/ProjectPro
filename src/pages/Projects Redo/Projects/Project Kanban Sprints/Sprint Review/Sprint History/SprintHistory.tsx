import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar } from 'lucide-react';
import { supabase } from '../../../../../../lib/supabase';
import { useSprintData } from './useSprintData';
import { getSprintProgress, getSprintStoryPoints, formatDateForInput } from './sprintHelpers';
import { HistoricalSprint } from './types';
import UngroupedSprintsSection from './UngroupedSprintsSection';
import GanttChart from './Gantchart';
import PastSprintsSection from './PastSprintsSection';
import ScheduledSprintsSection from './ScheduledSprintsSection';
import Button from '../../../../../../components/ui/Button';
import { fetchAllSprintProjects } from '../../utils/sprintColumnUtils';
import SprintReviewModal from '../SprintReviewModal';
import InSprintReviewModal from '../InSprintReviewModal';
import Modal from '../../../../../../components/ui/Modal';
import { useAuth } from '../../../../../../context/AuthContext';

const SprintHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    historicalSprints,
    ungroupedSprints,
    allTasks,
    subtasksMap,
    storyPointsMap,
    refreshData,
  } = useSprintData();

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  
  // Load expanded states from localStorage
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sprintHistory_expandedSprints');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const [collapsedSprintCards, setCollapsedSprintCards] = useState<Set<string>>(new Set());
  const [showParkingLot, setShowParkingLot] = useState(false);
  const [parkingLotProjects, setParkingLotProjects] = useState<any[]>([]);
  
  // Sprint Review Modal state
  const [selectedSprintProject, setSelectedSprintProject] = useState<any>(null);
  const [isSprintReviewModalOpen, setIsSprintReviewModalOpen] = useState(false);
  
  // InSprintReview Modal state
  const [selectedSprintGroup, setSelectedSprintGroup] = useState<any>(null);
  const [isInSprintReviewModalOpen, setIsInSprintReviewModalOpen] = useState(false);
  
  // Create New Sprint Modal state
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [newSprintId, setNewSprintId] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState('');
  const [newSprintEndDate, setNewSprintEndDate] = useState('');
  const [createSprinting, setCreateSprinting] = useState(false);

  // Persist expanded states to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('sprintHistory_expandedSprints', JSON.stringify(Array.from(expandedSprints)));
    } catch (error) {
      console.error('Error saving expanded states:', error);
    }
  }, [expandedSprints]);

  // Initialize all sprints as collapsed by default (only on first load)
  const [hasInitialized, setHasInitialized] = React.useState(false);
  React.useEffect(() => {
    if (historicalSprints.length > 0 && !hasInitialized) {
      const allSprintIds = new Set(historicalSprints.map(sprint => sprint.sprint_id));
      setCollapsedSprintCards(allSprintIds);
      setHasInitialized(true);
    }
  }, [historicalSprints, hasInitialized]);

  // Fetch parking lot projects
  React.useEffect(() => {
    if (showParkingLot) {
      fetchParkingLotProjects();
    }
  }, [showParkingLot]);

  const fetchParkingLotProjects = async () => {
    try {
      const allProjects = await fetchAllSprintProjects();
      setParkingLotProjects(allProjects.parkinglot || []);
    } catch (error) {
      console.error('Error fetching parking lot projects:', error);
      setParkingLotProjects([]);
    }
  };

  const handleSprintReviewClick = (project: any) => {
    setSelectedSprintProject(project);
    setIsSprintReviewModalOpen(true);
  };

  const handleCloseSprintReviewModal = () => {
    setIsSprintReviewModalOpen(false);
    setSelectedSprintProject(null);
  };

  const handleSprintGroupCreated = async () => {
    // Refresh the parking lot data and sprint data
    await refreshData();
    if (showParkingLot) {
      await fetchParkingLotProjects();
    }
    handleCloseSprintReviewModal();
  };

  const handleSprintGroupClick = (group: any) => {
    setSelectedSprintGroup(group);
    setIsInSprintReviewModalOpen(true);
  };

  const handleCloseInSprintReviewModal = () => {
    setIsInSprintReviewModalOpen(false);
    setSelectedSprintGroup(null);
    // Refresh data to show any updates
    refreshData();
  };

  const handleCreateNewSprint = async () => {
    if (!newSprintId || !newSprintStartDate || !newSprintEndDate) {
      alert('Please fill in all fields');
      return;
    }

    if (!currentUser?.id) {
      alert('User not authenticated');
      return;
    }

    setCreateSprinting(true);
    try {
      // Create a new sprint group entry
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .insert({
          sprint_id: newSprintId,
          start_date: newSprintStartDate,
          end_date: newSprintEndDate,
          name: `Sprint ${newSprintId}`,
          sprint_type: 'Sprint 1', // Default type
          status: 'active',
          created_by: currentUser.id,
          project_id: null, // No project assigned yet
          selected_task_ids: null, // No tasks assigned yet
        });

      if (error) {
        console.error('Error creating sprint:', error);
        alert(`Failed to create sprint: ${error.message}`);
        return;
      }

      // Reset form and close modal
      setIsCreateSprintModalOpen(false);
      setNewSprintId('');
      setNewSprintStartDate('');
      setNewSprintEndDate('');
      
      // Refresh data
      await refreshData();
    } catch (error) {
      console.error('Error creating sprint:', error);
      alert(`Failed to create sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreateSprinting(false);
    }
  };

  const toggleSprintCardCollapse = (sprintId: string) => {
    setCollapsedSprintCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sprintId)) {
        newSet.delete(sprintId);
      } else {
        newSet.add(sprintId);
      }
      return newSet;
    });
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleCreateSprintGroup = () => {
    // This is called when the user clicks the "Schedule Sprint" button
    // The form will handle the actual creation
  };

  const handleSaveSprintGroup = async (sprintId: string, startDate: string, endDate: string) => {
    setSaving(true);
    try {
      // Update all selected groups with the same sprint_id and dates
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .update({
          sprint_id: sprintId,
          start_date: startDate,
          end_date: endDate,
        })
        .in('id', selectedGroupIds);

      if (error) {
        console.error('Error updating sprint groups:', error);
        alert('Failed to create sprint group');
        return;
      }

      // Reset form and reload data
      setSelectedGroupIds([]);
      await refreshData();
    } catch (error) {
      console.error('Error saving sprint group:', error);
      alert('Failed to create sprint group');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setSelectedGroupIds([]);
  };

  const handleEditSprint = (sprint: HistoricalSprint) => {
    setEditingSprintId(sprint.sprint_id);
    setEditStartDate(formatDateForInput(sprint.start_date));
    setEditEndDate(formatDateForInput(sprint.end_date));
  };

  const handleCancelEdit = () => {
    setEditingSprintId(null);
    setEditStartDate('');
    setEditEndDate('');
  };

  const handleSaveSprintDates = async (sprintId: string) => {
    if (!editStartDate || !editEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    setSaving(true);
    try {
      // Update all sprint groups with this sprint_id with the new dates
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .update({
          start_date: editStartDate,
          end_date: editEndDate,
        })
        .eq('sprint_id', sprintId);

      if (error) {
        console.error('Error updating sprint dates:', error);
        alert('Failed to update sprint dates');
        return;
      }

      // Reset form and reload data
      setEditingSprintId(null);
      setEditStartDate('');
      setEditEndDate('');
      await refreshData();
    } catch (error) {
      console.error('Error saving sprint dates:', error);
      alert('Failed to update sprint dates');
    } finally {
      setSaving(false);
    }
  };

  const toggleSprintExpansion = (sprintId: string, groupId: string) => {
    const key = `${sprintId}-${groupId}`;
    setExpandedSprints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Separate active/upcoming sprints from completed sprints
  const getSprintStatus = (sprint: HistoricalSprint): 'active' | 'upcoming' | 'completed' => {
    if (!sprint.start_date || !sprint.end_date) return 'upcoming';
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const start = new Date(sprint.start_date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(sprint.end_date);
    end.setHours(0, 0, 0, 0);
    
    if (now >= start && now <= end) return 'active';
    if (now < start) return 'upcoming';
    return 'completed';
  };

  const scheduledSprints = historicalSprints.filter(
    sprint => getSprintStatus(sprint) !== 'completed'
  );
  
  const pastSprints = historicalSprints.filter(
    sprint => getSprintStatus(sprint) === 'completed'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4" style={{ color: brandTheme.text.muted }}>
            Loading Sprint Planning...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: brandTheme.background.primary }}>
      <div className="max-w-[95%] mx-auto p-6">
        {/* Header */}
        <div
          className="rounded-lg shadow-sm p-4 mb-6"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Sprint Planning</h1>
              <p className="text-sm text-white opacity-90">
                Schedule and manage sprints across all time periods
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Ungrouped Sprint Groups Section */}
        <UngroupedSprintsSection
          ungroupedSprints={ungroupedSprints}
          selectedGroupIds={selectedGroupIds}
          onToggleSelection={toggleGroupSelection}
          onCreateSprintGroup={handleCreateSprintGroup}
          onSaveSprintGroup={handleSaveSprintGroup}
          onCancelCreate={handleCancelCreateGroup}
        />

        {/* Scheduled Sprints Section */}
        <ScheduledSprintsSection
          scheduledSprints={scheduledSprints}
          allTasks={allTasks}
          subtasksMap={subtasksMap}
          storyPointsMap={storyPointsMap}
          expandedSprints={expandedSprints}
          onToggleExpansion={toggleSprintExpansion}
          onEditSprint={handleEditSprint}
          editingSprintId={editingSprintId}
          editStartDate={editStartDate}
          editEndDate={editEndDate}
          setEditStartDate={setEditStartDate}
          setEditEndDate={setEditEndDate}
          onSaveSprintDates={handleSaveSprintDates}
          onCancelEdit={handleCancelEdit}
          saving={saving}
          collapsedSprintCards={collapsedSprintCards}
          onToggleCollapse={toggleSprintCardCollapse}
          onSprintGroupClick={handleSprintGroupClick}
          getSprintProgress={getSprintProgress}
          getSprintStoryPoints={getSprintStoryPoints}
          showParkingLot={showParkingLot}
          setShowParkingLot={setShowParkingLot}
          parkingLotProjects={parkingLotProjects}
          onParkingLotRefresh={fetchParkingLotProjects}
          onSprintReviewClick={handleSprintReviewClick}
          onCreateNewSprint={() => setIsCreateSprintModalOpen(true)}
          onRefreshData={refreshData}
        />

        {/* Gantt Chart */}
        {scheduledSprints.length > 0 && (
          <div className="mt-6">
            <GanttChart sprints={scheduledSprints} />
          </div>
        )}

        {/* Past Sprints Section */}
        <PastSprintsSection
          pastSprints={pastSprints}
          allTasks={allTasks}
          subtasksMap={subtasksMap}
          expandedSprints={expandedSprints}
          onToggleExpansion={toggleSprintExpansion}
          onEditSprint={handleEditSprint}
          editingSprintId={editingSprintId}
          editStartDate={editStartDate}
          editEndDate={editEndDate}
          setEditStartDate={setEditStartDate}
          setEditEndDate={setEditEndDate}
          onSaveSprintDates={handleSaveSprintDates}
          onCancelEdit={handleCancelEdit}
          saving={saving}
          getSprintProgress={getSprintProgress}
          getSprintStoryPoints={getSprintStoryPoints}
          storyPointsMap={storyPointsMap}
          onSprintGroupClick={handleSprintGroupClick}
        />
      </div>

      {/* Sprint Review Modal */}
      <SprintReviewModal
        isOpen={isSprintReviewModalOpen}
        onClose={handleCloseSprintReviewModal}
        project={selectedSprintProject}
        onSprintGroupCreated={handleSprintGroupCreated}
        fromSprintGroup={false}
      />

      {/* InSprint Review Modal */}
      <InSprintReviewModal
        isOpen={isInSprintReviewModalOpen}
        onClose={handleCloseInSprintReviewModal}
        sprintGroup={selectedSprintGroup}
      />

      {/* Create New Sprint Modal */}
      <Modal
        isOpen={isCreateSprintModalOpen}
        onClose={() => setIsCreateSprintModalOpen(false)}
        title="Create New Sprint"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
              Sprint Number
            </label>
            <input
              type="text"
              value={newSprintId}
              onChange={(e) => setNewSprintId(e.target.value)}
              placeholder="e.g., 002"
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
              Start Date
            </label>
            <input
              type="date"
              value={newSprintStartDate}
              onChange={(e) => setNewSprintStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
              End Date
            </label>
            <input
              type="date"
              value={newSprintEndDate}
              onChange={(e) => setNewSprintEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
              }}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setIsCreateSprintModalOpen(false)}
              style={{
                backgroundColor: brandTheme.background.secondary,
                color: brandTheme.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewSprint}
              disabled={createSprinting}
              style={{
                backgroundColor: brandTheme.status.success,
                color: 'white',
              }}
            >
              {createSprinting ? 'Creating...' : 'Create Sprint'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SprintHistory;

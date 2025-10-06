import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { History, Calendar, Plus, Save, X } from 'lucide-react';
import { supabase } from '../../../../../../lib/supabase';
import Button from '../../../../../../components/ui/Button';
import Input from '../../../../../../components/ui/Input';

interface SprintGroup {
  id: string;
  name: string;
  sprint_type: string;
  created_at: string;
  sprint_id: string | null;
  start_date: string | null;
  end_date: string | null;
  selected_task_ids: string[];
}

interface HistoricalSprint {
  sprint_id: string;
  groups: SprintGroup[];
  start_date: string | null;
  end_date: string | null;
}

const SprintHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [historicalSprints, setHistoricalSprints] = useState<HistoricalSprint[]>([]);
  const [ungroupedSprints, setUngroupedSprints] = useState<SprintGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newSprintId, setNewSprintId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSprintData();
  }, []);

  const loadSprintData = async () => {
    setLoading(true);
    try {
      // Fetch all sprint groups
      const { data: sprintGroups, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('id, name, sprint_type, created_at, sprint_id, start_date, end_date, selected_task_ids')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sprint groups:', error);
        return;
      }

      if (!sprintGroups) {
        setHistoricalSprints([]);
        setUngroupedSprints([]);
        return;
      }

      // Separate groups with sprint_id from those without
      const grouped: SprintGroup[] = [];
      const ungrouped: SprintGroup[] = [];

      sprintGroups.forEach((group: SprintGroup) => {
        if (group.sprint_id) {
          grouped.push(group);
        } else {
          ungrouped.push(group);
        }
      });

      // Group by sprint_id
      const sprintMap = new Map<string, HistoricalSprint>();
      grouped.forEach((group) => {
        if (!sprintMap.has(group.sprint_id!)) {
          sprintMap.set(group.sprint_id!, {
            sprint_id: group.sprint_id!,
            groups: [],
            start_date: group.start_date,
            end_date: group.end_date,
          });
        }
        sprintMap.get(group.sprint_id!)!.groups.push(group);
      });

      setHistoricalSprints(Array.from(sprintMap.values()).sort((a, b) => {
        // Sort by start date, most recent first
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }));
      setUngroupedSprints(ungrouped);
    } catch (error) {
      console.error('Error loading sprint data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleCreateSprintGroup = () => {
    if (selectedGroupIds.length === 0) {
      alert('Please select at least one sprint group');
      return;
    }
    setIsCreatingGroup(true);
  };

  const handleSaveSprintGroup = async () => {
    if (!newSprintId.trim()) {
      alert('Please enter a Sprint ID');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    setSaving(true);
    try {
      // Update all selected groups with the same sprint_id and dates
      const { error } = await (supabase as any)
        .from('PMA_Sprints')
        .update({
          sprint_id: newSprintId.trim(),
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
      setNewSprintId('');
      setStartDate('');
      setEndDate('');
      setSelectedGroupIds([]);
      setIsCreatingGroup(false);
      await loadSprintData();
    } catch (error) {
      console.error('Error saving sprint group:', error);
      alert('Failed to create sprint group');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setIsCreatingGroup(false);
    setNewSprintId('');
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    // Parse ISO date string to avoid timezone shift
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4" style={{ color: brandTheme.text.muted }}>
            Loading Sprint History...
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
          className="rounded-lg shadow-sm p-6 mb-6"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sprint History</h1>
              <p className="text-white opacity-90">
                View historical sprints and group sprint groups over time
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <History className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Ungrouped Sprint Groups Section */}
        {ungroupedSprints.length > 0 && (
          <div
            className="rounded-lg shadow-sm p-6 mb-6"
            style={{ backgroundColor: brandTheme.background.secondary }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
                Ungrouped Sprint Groups ({ungroupedSprints.length})
              </h2>
              <Button
                onClick={handleCreateSprintGroup}
                disabled={selectedGroupIds.length === 0}
                style={{
                  backgroundColor: selectedGroupIds.length > 0 ? brandTheme.primary.navy : brandTheme.gray[300],
                  color: 'white',
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Historical Sprint ({selectedGroupIds.length})
              </Button>
            </div>

            {/* Create Sprint Group Form */}
            {isCreatingGroup && (
              <div
                className="mb-6 p-4 rounded-lg border-2"
                style={{
                  backgroundColor: brandTheme.primary.paleBlue,
                  borderColor: brandTheme.primary.lightBlue,
                }}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: brandTheme.primary.navy }}>
                  Create Historical Sprint
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>
                      Sprint ID
                    </label>
                    <Input
                      type="text"
                      value={newSprintId}
                      onChange={(e) => setNewSprintId(e.target.value)}
                      placeholder="e.g., Sprint 2024-W01-W02"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveSprintGroup}
                    disabled={saving}
                    style={{ backgroundColor: brandTheme.status.success, color: 'white' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Sprint'}
                  </Button>
                  <Button
                    onClick={handleCancelCreateGroup}
                    disabled={saving}
                    style={{ backgroundColor: brandTheme.gray[400], color: 'white' }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Ungrouped Sprints List */}
            <div className="space-y-2">
              {ungroupedSprints.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedGroupIds.includes(group.id) ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedGroupIds.includes(group.id)
                      ? brandTheme.primary.paleBlue
                      : 'white',
                  }}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => toggleGroupSelection(group.id)}
                        className="w-5 h-5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: brandTheme.text.primary }}>
                          {group.name}
                        </h3>
                        <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                          Type: {group.sprint_type} • Created: {formatDate(group.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: brandTheme.text.muted }}>
                      {group.selected_task_ids?.length || 0} tasks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical Sprints Section */}
        <div
          className="rounded-lg shadow-sm p-6"
          style={{ backgroundColor: brandTheme.background.secondary }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: brandTheme.text.primary }}>
            Historical Sprints ({historicalSprints.length})
          </h2>

          {historicalSprints.length === 0 ? (
            <div className="text-center py-12">
              <History
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: brandTheme.text.muted }}
              />
              <p style={{ color: brandTheme.text.muted }}>No historical sprints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicalSprints.map((sprint) => (
                <div
                  key={sprint.sprint_id}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: 'white',
                    borderColor: brandTheme.border.light,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: brandTheme.primary.navy }}>
                        {sprint.sprint_id}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
                          <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
                            {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                          </span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: brandTheme.primary.paleBlue,
                            color: brandTheme.primary.navy,
                          }}
                        >
                          {sprint.groups.length} groups
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sprint Groups in this historical sprint */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {sprint.groups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: brandTheme.background.primary,
                          borderColor: brandTheme.border.light,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm" style={{ color: brandTheme.text.primary }}>
                              {group.name}
                            </p>
                            <p className="text-xs" style={{ color: brandTheme.text.muted }}>
                              {group.sprint_type}
                            </p>
                          </div>
                          <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
                            {group.selected_task_ids?.length || 0} tasks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintHistory;


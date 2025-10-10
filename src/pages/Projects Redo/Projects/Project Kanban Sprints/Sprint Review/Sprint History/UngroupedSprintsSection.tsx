import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Plus } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { SprintGroup } from './types';
import { formatDate } from './sprintHelpers';
import CreateSprintForm from './CreateSprintForm';

interface UngroupedSprintsSectionProps {
  ungroupedSprints: SprintGroup[];
  selectedGroupIds: string[];
  onToggleSelection: (groupId: string) => void;
  onCreateSprintGroup: () => void;
  onSaveSprintGroup: (sprintId: string, startDate: string, endDate: string) => Promise<void>;
  onCancelCreate: () => void;
}

const UngroupedSprintsSection: React.FC<UngroupedSprintsSectionProps> = ({
  ungroupedSprints,
  selectedGroupIds,
  onToggleSelection,
  onCreateSprintGroup,
  onSaveSprintGroup,
  onCancelCreate,
}) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleCreateClick = () => {
    if (selectedGroupIds.length === 0) {
      alert('Please select at least one sprint group');
      return;
    }
    setIsCreatingGroup(true);
    onCreateSprintGroup();
  };

  const handleSave = async (sprintId: string, startDate: string, endDate: string) => {
    await onSaveSprintGroup(sprintId, startDate, endDate);
    setIsCreatingGroup(false);
  };

  const handleCancel = () => {
    setIsCreatingGroup(false);
    onCancelCreate();
  };

  if (ungroupedSprints.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg shadow-sm p-6 mb-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
          Ungrouped Sprint Groups ({ungroupedSprints.length})
        </h2>
        <Button
          onClick={handleCreateClick}
          disabled={selectedGroupIds.length === 0}
          style={{
            backgroundColor: selectedGroupIds.length > 0 ? brandTheme.primary.navy : brandTheme.gray[300],
            color: 'white',
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Sprint ({selectedGroupIds.length})
        </Button>
      </div>

      {/* Create Sprint Group Form */}
      {isCreatingGroup && (
        <CreateSprintForm
          onSave={handleSave}
          onCancel={handleCancel}
        />
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
            onClick={() => onToggleSelection(group.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => onToggleSelection(group.id)}
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
  );
};

export default UngroupedSprintsSection;


import React, { useState } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Save, X } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import Input from '../../../../../../components/ui/Input';

interface CreateSprintFormProps {
  onSave: (sprintId: string, startDate: string, endDate: string) => Promise<void>;
  onCancel: () => void;
}

const CreateSprintForm: React.FC<CreateSprintFormProps> = ({ onSave, onCancel }) => {
  const [newSprintId, setNewSprintId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
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
      await onSave(newSprintId.trim(), startDate, endDate);
      setNewSprintId('');
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to create sprint group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="mb-6 p-4 rounded-lg border-2"
      style={{
        backgroundColor: brandTheme.primary.paleBlue,
        borderColor: brandTheme.primary.lightBlue,
      }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: brandTheme.primary.navy }}>
        Schedule Sprint
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
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: brandTheme.status.success, color: 'white' }}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Sprint'}
        </Button>
        <Button
          onClick={onCancel}
          disabled={saving}
          style={{ backgroundColor: brandTheme.gray[400], color: 'white' }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CreateSprintForm;


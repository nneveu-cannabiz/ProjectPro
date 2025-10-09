import React, { useState, useEffect } from 'react';
import { X, Plus, User, Clock, Edit2, Save } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import { useAuth } from '../../../../../context/AuthContext';

interface PlannedHour {
  id: string;
  user_id: string;
  hours: number;
  user_name: string;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface HoursPlannedModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  onHoursUpdated: () => void;
}

const HoursPlannedModal: React.FC<HoursPlannedModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskName,
  onHoursUpdated
}) => {
  const { currentUser } = useAuth();
  const [plannedHours, setPlannedHours] = useState<PlannedHour[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newHours, setNewHours] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string>('');
  const [editUserId, setEditUserId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPlannedHours();
      loadUsers();
      // Default to current user
      if (currentUser?.id) {
        setSelectedUserId(currentUser.id);
      }
    }
  }, [isOpen, taskId, currentUser]);

  const loadPlannedHours = async () => {
    console.log('Loading planned hours for task:', taskId);
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Hours')
        .select(`
          id,
          user_id,
          hours,
          PMA_Users!inner (
            id,
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .eq('is_planning_hours', true);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw planned hours data:', data);

      const formattedHours: PlannedHour[] = data?.map((hour: any) => ({
        id: hour.id,
        user_id: hour.user_id,
        hours: Number(hour.hours),
        user_name: `${hour.PMA_Users.first_name || ''} ${hour.PMA_Users.last_name || ''}`.trim()
      })) || [];

      console.log('Formatted planned hours:', formattedHours);
      setPlannedHours(formattedHours);
    } catch (error) {
      console.error('Error loading planned hours:', error);
      setPlannedHours([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    console.log('Loading users...');
    try {
      const { data, error } = await supabase
        .from('PMA_Users')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) {
        console.error('Users query error:', error);
        throw error;
      }

      console.log('Users loaded:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddPlannedHours = async () => {
    console.log('Add button clicked', { newHours, selectedUserId, taskId });
    
    if (!newHours || !selectedUserId || parseFloat(newHours) <= 0) {
      console.log('Validation failed:', { 
        hasNewHours: !!newHours, 
        hasSelectedUser: !!selectedUserId, 
        hoursValue: parseFloat(newHours || '0') 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Inserting planned hours:', {
        user_id: selectedUserId,
        task_id: taskId,
        hours: parseFloat(newHours),
        date: new Date().toISOString().split('T')[0],
        is_planning_hours: true
      });

      // Ensure we have a current user for RLS
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Ensure we're using the exact value entered
      const hoursValue = parseFloat(newHours);
      
      console.log('Adding story points:', {
        input: newHours,
        parsed: hoursValue,
        type: typeof hoursValue
      });

      const insertData = {
        user_id: selectedUserId, // This is the ASSIGNEE who the hours are planned FOR
        task_id: taskId,
        hours: hoursValue,
        date: new Date().toISOString().split('T')[0],
        is_planning_hours: true
        // Note: The current authenticated user (who is LOGGING these hours) is tracked via RLS/session context
      };

      console.log('Inserting planned hours:', {
        ...insertData,
        logged_by: currentUser.id, // This is who is LOGGING the hours (current user)
        planned_for: selectedUserId // This is who the hours are PLANNED FOR (assignee)
      });

      const { data, error } = await (supabase as any)
        .from('PMA_Hours')
        .insert(insertData);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Insert successful:', data);

      // Reset form
      setNewHours('');
      setSelectedUserId('');
      
      // Reload data
      await loadPlannedHours();
      onHoursUpdated();
    } catch (error) {
      console.error('Error adding planned hours:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlannedHours = async (hoursId: string) => {
    try {
      // Ensure we have a current user for RLS
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await (supabase as any)
        .from('PMA_Hours')
        .delete()
        .eq('id', hoursId);

      if (error) throw error;

      await loadPlannedHours();
      onHoursUpdated();
    } catch (error) {
      console.error('Error deleting planned hours:', error);
    }
  };

  const handleEditStart = (hour: PlannedHour) => {
    setEditingRowId(hour.id);
    setEditHours(hour.hours.toString());
    setEditUserId(hour.user_id);
  };

  const handleEditCancel = () => {
    setEditingRowId(null);
    setEditHours('');
    setEditUserId('');
  };

  const handleEditSave = async (hoursId: string) => {
    if (!editHours || !editUserId || parseFloat(editHours) <= 0) {
      return;
    }

    try {
      // Ensure we have a current user for RLS
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const hoursValue = parseFloat(editHours);
      
      console.log('Updating story points:', {
        input: editHours,
        parsed: hoursValue,
        type: typeof hoursValue
      });

      const { error } = await (supabase as any)
        .from('PMA_Hours')
        .update({
          hours: hoursValue,
          user_id: editUserId // This is the ASSIGNEE who the hours are planned FOR
        })
        .eq('id', hoursId);

      if (error) throw error;

      // Reset editing state
      setEditingRowId(null);
      setEditHours('');
      setEditUserId('');
      
      // Reload data
      await loadPlannedHours();
      onHoursUpdated();
    } catch (error) {
      console.error('Error updating planned hours:', error);
    }
  };

  const getTotalPlannedHours = () => {
    return plannedHours.reduce((sum, hour) => sum + hour.hours, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: brandTheme.background.primary }}
      >
        {/* Modal Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.light 
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">
              Story Points
            </h2>
            <p className="text-sm text-white opacity-90 mt-1">
              {taskName}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: brandTheme.background.brandLight }}
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
              <div>
                <p className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                  Total Story Points
                </p>
                <p className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
                  {getTotalPlannedHours().toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Planned Hours by Assignee */}
          <div className="mb-6">
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: brandTheme.text.primary }}
            >
              Story Points by Assignee
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                  style={{ borderColor: brandTheme.primary.navy }}
                />
                <p style={{ color: brandTheme.text.secondary }}>Loading story points...</p>
              </div>
            ) : plannedHours.length > 0 ? (
              <div className="space-y-3">
                {plannedHours.map((hour) => (
                  <div 
                    key={hour.id}
                    className="p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: brandTheme.background.secondary,
                      borderColor: brandTheme.border.light 
                    }}
                  >
                    {editingRowId === hour.id ? (
                      // Editing Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label 
                              className="block text-xs font-medium mb-1"
                              style={{ color: brandTheme.text.secondary }}
                            >
                              Story Points
                            </label>
                            <input
                              type="number"
                              value={editHours}
                              onChange={(e) => setEditHours(e.target.value)}
                              min="0"
                              step="0.1"
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ 
                                borderColor: brandTheme.border.medium,
                                backgroundColor: brandTheme.background.primary 
                              }}
                            />
                          </div>
                          
                          <div>
                            <label 
                              className="block text-xs font-medium mb-1"
                              style={{ color: brandTheme.text.secondary }}
                            >
                              Assign Points To
                            </label>
                            <select
                              value={editUserId}
                              onChange={(e) => setEditUserId(e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ 
                                borderColor: brandTheme.border.medium,
                                backgroundColor: brandTheme.background.primary 
                              }}
                            >
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSave(hour.id)}
                            disabled={!editHours || !editUserId || parseFloat(editHours) <= 0}
                            className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: brandTheme.status.success,
                              color: brandTheme.background.primary,
                            }}
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          
                          <button
                            onClick={handleEditCancel}
                            className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: brandTheme.text.muted,
                              color: brandTheme.background.primary,
                            }}
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
                          <div>
                            <p 
                              className="font-medium text-sm"
                              style={{ color: brandTheme.text.primary }}
                            >
                              {hour.user_name}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: brandTheme.text.secondary }}
                            >
                              {hour.hours} points
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditStart(hour)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                            title="Edit story points"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeletePlannedHours(hour.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                            title="Remove story points"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8"
                style={{ color: brandTheme.text.muted }}
              >
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No story points assigned for this task yet.</p>
              </div>
            )}
          </div>

          {/* Add New Planned Hours */}
          <div 
            className="border-t pt-6"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h4 
              className="text-md font-semibold mb-2"
              style={{ color: brandTheme.text.primary }}
            >
              Add Story Points
            </h4>
            <p className="text-sm mb-4" style={{ color: brandTheme.text.muted }}>
              You can assign story points to any team member. The system tracks who logged the points (you) separately from who the points are assigned to.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: brandTheme.text.secondary }}
                  >
                    Story Points
                  </label>
                  <input
                    type="number"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      borderColor: brandTheme.border.medium,
                      backgroundColor: brandTheme.background.primary 
                    }}
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: brandTheme.text.secondary }}
                  >
                    Assign Points To (Assignee)
                  </label>
                  <p className="text-xs mb-2" style={{ color: brandTheme.text.muted }}>
                    Who should these points be assigned to?
                  </p>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      borderColor: brandTheme.border.medium,
                      backgroundColor: brandTheme.background.primary 
                    }}
                  >
                    <option value="">Select team member...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleAddPlannedHours}
                disabled={!newHours || !selectedUserId || parseFloat(newHours) <= 0 || isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: brandTheme.primary.navy,
                  color: brandTheme.background.primary,
                }}
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Adding...' : 'Add Story Points'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoursPlannedModal;

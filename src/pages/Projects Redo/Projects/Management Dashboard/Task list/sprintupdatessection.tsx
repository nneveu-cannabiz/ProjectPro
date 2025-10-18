import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { Update } from '../../../../../types';
import UpdatesList from '../../../../../components/Update/UpdatesList';

interface TaskWithSprintInfo {
  id: string;
  name: string;
}

interface SprintUpdatesSectionProps {
  tasks: TaskWithSprintInfo[];
}

const SprintUpdatesSection: React.FC<SprintUpdatesSectionProps> = ({ tasks }) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, [tasks]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      if (tasks.length === 0) {
        setUpdates([]);
        setLoading(false);
        return;
      }

      const taskIds = tasks.map(t => t.id);

      // Fetch all subtasks for these tasks
      const { data: subtasksData } = await supabase
        .from('PMA_SubTasks')
        .select('id')
        .in('task_id', taskIds);

      const subtaskIds = subtasksData?.map(st => st.id) || [];

      // Combine task IDs and subtask IDs
      const allEntityIds = [...taskIds, ...subtaskIds];

      if (allEntityIds.length === 0) {
        setUpdates([]);
        setLoading(false);
        return;
      }

      // Fetch updates for all tasks and subtasks
      const { data: updatesData, error } = await supabase
        .from('PMA_Updates')
        .select('*')
        .in('entity_id', allEntityIds)
        .in('entity_type', ['task', 'subtask'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        setUpdates([]);
      } else {
        const formattedUpdates: Update[] = (updatesData || []).map((update: any) => ({
          id: update.id,
          message: update.message,
          userId: update.user_id,
          createdAt: update.created_at,
          entityType: update.entity_type,
          entityId: update.entity_id,
          isReadBy: update.is_read_by || [],
          commentTo: update.comment_to,
          taggedUserIds: update.tagged_user_id || [],
          isRequest: update.is_request,
        }));
        setUpdates(formattedUpdates);
      }
    } catch (error) {
      console.error('Error fetching sprint updates:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Sprint Updates</h2>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
              }}
            >
              {updates.length}
            </span>
            <button
              onClick={fetchUpdates}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Refresh updates"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4" style={{ color: brandTheme.text.muted }}>
                  Loading updates...
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <UpdatesList 
                updates={updates} 
                showEntity={true}
                emptyMessage="No updates in this sprint yet"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintUpdatesSection;



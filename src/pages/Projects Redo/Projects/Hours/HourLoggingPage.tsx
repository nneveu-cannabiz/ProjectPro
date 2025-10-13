import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchAllTasks, fetchHoursWithTaskDetails, logHours } from '../../../../data/supabase-store';
import { Task, Hour, Project } from '../../../../types';
import Input from '../../../../components/ui/Input';
import AssignedProjectsTasksList from './AssignedProjectsTasksList';
import LoggedHours from './LoggedHours';
import { Clock, Calendar, CheckCircle, X } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';

interface HourLoggingPageProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HourLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSubmit: (hours: number, date: string) => Promise<void>;
}

const HourLogModal: React.FC<HourLogModalProps> = ({ isOpen, onClose, task, onSubmit }) => {
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Use a slight delay to prevent immediate closing due to the click that opened the modal
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(hours), date);
      setHours('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error) {
      console.error('Failed to log hours:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        ref={modalRef} 
        className="rounded-lg shadow-xl w-full max-w-md"
        style={{ backgroundColor: brandTheme.background.primary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderColor: brandTheme.border.light 
          }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">Log Hours</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Task Info */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: brandTheme.text.primary }}>
              Task
            </label>
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: brandTheme.background.secondary }}
            >
              <p className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>{task.name}</p>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold mb-1" style={{ color: brandTheme.text.primary }}>
              Date
            </label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Hours Input */}
          <div>
            <label htmlFor="hours" className="block text-sm font-semibold mb-1" style={{ color: brandTheme.text.primary }}>
              Hours
            </label>
            <Input
              type="number"
              id="hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.00"
              step="0.25"
              min="0.25"
              max="24"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border font-medium transition-all"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.medium,
                color: brandTheme.text.secondary,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hours || parseFloat(hours) <= 0}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: brandTheme.primary.navy,
                color: '#FFFFFF',
              }}
            >
              {isSubmitting ? 'Logging...' : 'Log Hours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HourLoggingPage: React.FC<HourLoggingPageProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [allTasks, setAllTasks] = useState<(Task & { project: Project })[]>([]);
  const [loggedHours, setLoggedHours] = useState<(Hour & { task: Task; project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showHourLogModal, setShowHourLogModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const [tasks, hours] = await Promise.all([
        fetchAllTasks(),
        fetchHoursWithTaskDetails(currentUser.id)
      ]);

      // Filter to only show active tasks (todo or in-progress)
      const activeTasks = tasks.filter(
        task => task.status === 'todo' || task.status === 'in-progress'
      );

      setAllTasks(activeTasks);
      setLoggedHours(hours);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser?.id]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowHourLogModal(true);
  };

  const handleLogHours = async (hours: number, date: string) => {
    if (!currentUser?.id || !selectedTask) return;

    try {
      await logHours(currentUser.id, selectedTask.id, hours, date);
      setSuccessMessage(`Successfully logged ${hours} hours for ${selectedTask.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload data to show the new entry
      await loadData();
    } catch (error) {
      console.error('Failed to log hours:', error);
      throw error;
    }
  };

  // Create a custom onClose handler that prevents closing when the hour log modal is open
  const handleMainModalClose = () => {
    if (!showHourLogModal) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleMainModalClose}
      >
        <div 
          className="rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          style={{ 
            backgroundColor: brandTheme.background.primary,
            maxWidth: '95vw',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ 
              backgroundColor: brandTheme.primary.navy,
              borderColor: brandTheme.border.light 
            }}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Hour Logging</h2>
            </div>
            <button
              onClick={handleMainModalClose}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {successMessage && (
              <div 
                className="mb-4 p-3 rounded-lg flex items-center gap-2 border"
                style={{
                  backgroundColor: '#D1FAE5',
                  borderColor: brandTheme.status.success,
                  color: brandTheme.status.success,
                }}
              >
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="w-8 h-8 animate-spin" style={{ color: brandTheme.primary.navy }} />
                <span className="ml-3 text-lg" style={{ color: brandTheme.text.secondary }}>Loading...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* All Tasks Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: brandTheme.border.light }}>
                    <Clock className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
                    <h3 className="text-lg font-bold" style={{ color: brandTheme.text.primary }}>
                      Select Task to Log Hours
                    </h3>
                  </div>
                  <AssignedProjectsTasksList
                    tasks={allTasks}
                    onTaskClick={handleTaskClick}
                  />
                </div>

                {/* Logged Hours Section */}
                {loggedHours.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: brandTheme.border.light }}>
                      <Calendar className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
                      <h3 className="text-lg font-bold" style={{ color: brandTheme.text.primary }}>
                        Recent Hours
                      </h3>
                    </div>
                    <LoggedHours hours={loggedHours} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hour Log Modal */}
      {selectedTask && (
        <HourLogModal
          isOpen={showHourLogModal}
          onClose={() => {
            setShowHourLogModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSubmit={handleLogHours}
        />
      )}
    </>
  );
};

export default HourLoggingPage;

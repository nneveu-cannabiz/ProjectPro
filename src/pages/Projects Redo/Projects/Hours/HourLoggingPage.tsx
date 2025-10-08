import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchAllTasks, fetchHoursWithTaskDetails, logHours } from '../../../../data/supabase-store';
import { Task, Hour, Project } from '../../../../types';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import AssignedProjectsTasksList from './AssignedProjectsTasksList';
import LoggedHours from './LoggedHours';
import { Clock, Calendar, CheckCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Log Hours</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900">{task.name}</p>
              <p className="text-xs text-gray-500">{task.description}</p>
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
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
            <p className="text-xs text-gray-500 mt-1">Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !hours || parseFloat(hours) <= 0}
              className="flex-1"
            >
              {isSubmitting ? 'Logging...' : 'Log Hours'}
            </Button>
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

  if (!isOpen) return null;

  // Create a custom onClose handler that prevents closing when the hour log modal is open
  const handleMainModalClose = () => {
    if (!showHourLogModal) {
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleMainModalClose} title="Hour Logging">
        <div className="max-h-[80vh] overflow-y-auto">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* All Tasks Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Log Hours for Tasks
                  </h3>
                </div>
                <AssignedProjectsTasksList
                  tasks={allTasks}
                  onTaskClick={handleTaskClick}
                />
              </div>

              {/* Logged Hours Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Previously Logged Hours
                  </h3>
                </div>
                <LoggedHours hours={loggedHours} />
              </div>
            </div>
          )}
        </div>
      </Modal>

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

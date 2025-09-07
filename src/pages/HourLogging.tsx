import React, { useState } from 'react';
import { Clock, Calendar, TrendingUp, Users } from 'lucide-react';
import HourLoggingPage from './Projects Redo/Projects/Hours/HourLoggingPage';
import Button from '../components/ui/Button';

const HourLogging: React.FC = () => {
  const [showHourLoggingModal, setShowHourLoggingModal] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Hour Logging</h1>
        </div>
        <p className="text-gray-600">
          Track time spent on your assigned tasks and view your logging history.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Time Tracking</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Log hours spent on tasks with precise date and time tracking.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Decimal hour format (e.g., 1.5 hours)</li>
            <li>• Date-specific entries</li>
            <li>• Task-specific logging</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">History & Reports</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            View and filter your logged hours with detailed reporting.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Filter by date ranges</li>
            <li>• Sort by various criteria</li>
            <li>• Project and task context</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Assigned Tasks</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Only log hours for tasks that are currently assigned to you.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Active tasks only</li>
            <li>• Grouped by projects</li>
            <li>• Priority indicators</li>
          </ul>
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Log Your Hours?
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Click below to open the hour logging interface where you can select tasks and record your time.
          </p>
        </div>

        <Button
          onClick={() => setShowHourLoggingModal(true)}
          variant="primary"
          className="px-8 py-3 text-lg"
        >
          <Clock className="w-5 h-5 mr-2" />
          Open Hour Logging
        </Button>
      </div>

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Smart Filtering</h3>
              <p className="text-sm text-gray-600">
                Filter your logged hours by this week, this month, or custom date ranges to analyze your productivity patterns.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Date Validation</h3>
              <p className="text-sm text-gray-600">
                Each task can only have one time entry per date, ensuring accurate and consistent time tracking.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Task Context</h3>
              <p className="text-sm text-gray-600">
                See full project and task details when logging hours, including priority levels and descriptions.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Flexible Hours</h3>
              <p className="text-sm text-gray-600">
                Log hours in decimal format with quarter-hour increments (0.25, 0.5, 0.75, etc.) for precise tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hour Logging Modal */}
      <HourLoggingPage
        isOpen={showHourLoggingModal}
        onClose={() => setShowHourLoggingModal(false)}
      />
    </div>
  );
};

export default HourLogging;

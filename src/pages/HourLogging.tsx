import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import HourLoggingPage from './Projects Redo/Projects/Hours/HourLoggingPage';
import MyHours from './Projects Redo/Projects/Hours/Myhours';
import { brandTheme } from '../styles/brandTheme';

const HourLogging: React.FC = () => {
  const [showHourLoggingModal, setShowHourLoggingModal] = useState(false);

  return (
    <div className="p-6" style={{ backgroundColor: brandTheme.background.secondary }}>
      {/* Page Header with Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8" style={{ color: brandTheme.primary.navy }} />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: brandTheme.text.primary }}>Hour Logging</h1>
            <p className="text-sm mt-1" style={{ color: brandTheme.text.secondary }}>
              Track time spent on your assigned tasks and view your logging history.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowHourLoggingModal(true)}
          className="px-6 py-3 rounded-lg font-bold transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          style={{
            backgroundColor: brandTheme.primary.navy,
            color: '#FFFFFF',
          }}
        >
          <Clock className="w-5 h-5" />
          Open Hour Logging
        </button>
      </div>

      {/* My Hours Section */}
      <div>
        <MyHours />
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

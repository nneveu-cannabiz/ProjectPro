import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

const TwoWeekSprintPlanHelpTips: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current && 
        iconRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Info Icon */}
      <div
        ref={iconRef}
        className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-opacity-80"
        style={{
          backgroundColor: brandTheme.primary.navy,
          color: brandTheme.background.primary
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        title="Help & Tips"
      >
        <Info className="w-4 h-4" />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 left-0 mt-2 w-96 p-4 rounded-lg shadow-lg border"
          style={{
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Arrow */}
          <div
            className="absolute -top-2 left-3 w-4 h-4 rotate-45 border-l border-t"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.light
            }}
          />

          <div className="space-y-4">
            {/* How do I add a Project? */}
            <div>
              <h4 
                className="font-semibold text-sm mb-2"
                style={{ color: brandTheme.primary.navy }}
              >
                How do I add a Project?
              </h4>
              <p 
                className="text-xs leading-relaxed"
                style={{ color: brandTheme.text.secondary }}
              >
                You can add a project that exists for Product Dev by expanding the "Parking Lot" column below, 
                and then selecting "Add Project". This will add it to the parking lot, where you can then review 
                it for a sprint plan.
              </p>
            </div>

            {/* How do I create a Sprint Group? */}
            <div>
              <h4 
                className="font-semibold text-sm mb-2"
                style={{ color: brandTheme.primary.navy }}
              >
                How do I create a Sprint Group?
              </h4>
              <p 
                className="text-xs leading-relaxed"
                style={{ color: brandTheme.text.secondary }}
              >
                Click "Sprint Review" from Parking Lot and select tasks to include in the sprint group, 
                and then click "Create Sprint Group".
              </p>
            </div>

            {/* How do I adjust planned hours? */}
            <div>
              <h4 
                className="font-semibold text-sm mb-2"
                style={{ color: brandTheme.primary.navy }}
              >
                How do I adjust planned hours?
              </h4>
              <p 
                className="text-xs leading-relaxed"
                style={{ color: brandTheme.text.secondary }}
              >
                Click "Sprint Review" for the project and you can edit planned hours by task there.
              </p>
            </div>

            {/* What are planned hours? */}
            <div>
              <h4 
                className="font-semibold text-sm mb-2"
                style={{ color: brandTheme.primary.navy }}
              >
                What are planned hours?
              </h4>
              <p 
                className="text-xs leading-relaxed"
                style={{ color: brandTheme.text.secondary }}
              >
                These are the total expected hours each person is planned to spend in total on each task. 
                Spent hours should total the same as planned hours when the task is completed.
              </p>
            </div>

            {/* How are spent hours tracked? */}
            <div>
              <h4 
                className="font-semibold text-sm mb-2"
                style={{ color: brandTheme.primary.navy }}
              >
                How are spent hours tracked?
              </h4>
              <p 
                className="text-xs leading-relaxed"
                style={{ color: brandTheme.text.secondary }}
              >
                Based on the hours logged individually by the users. Logged hours are by task level only, not project.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoWeekSprintPlanHelpTips;

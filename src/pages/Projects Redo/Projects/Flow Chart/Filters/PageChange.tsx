import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

interface PageChangeProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onJumpToCurrentWeek: () => void;
  currentWeekLabel: string;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isCurrentWeek?: boolean;
}

const PageChange: React.FC<PageChangeProps> = ({
  onPreviousWeek,
  onNextWeek,
  onJumpToCurrentWeek,
  currentWeekLabel,
  canGoPrevious = true,
  canGoNext = true,
  isCurrentWeek = false
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4">
      {/* Previous Week Button */}
      <button
        onClick={onPreviousWeek}
        disabled={!canGoPrevious}
        className={`flex items-center justify-center w-10 h-10 rounded transition-all duration-200 ${
          canGoPrevious 
            ? 'hover:opacity-80 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{ backgroundColor: brandTheme.primary.navy }}
      >
        <ChevronLeft 
          size={20} 
          color="white" 
        />
      </button>

             {/* Current Week Label */}
       <div className="relative">
         <div 
           className="px-4 py-2 rounded-lg font-medium"
           style={{ 
             backgroundColor: brandTheme.background.primary,
             color: brandTheme.text.primary,
             borderColor: brandTheme.border.light
           }}
         >
           {currentWeekLabel}
         </div>
         
         {/* Jump to Current Week Button */}
         {!isCurrentWeek && (
           <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                           <button
                onClick={onJumpToCurrentWeek}
                className="px-4 py-1 text-xs rounded transition-all duration-200 hover:opacity-80 whitespace-nowrap min-w-[140px]"
                style={{ 
                  backgroundColor: brandTheme.primary.lightBlue,
                  color: brandTheme.text.primary
                }}
              >
                Jump to Current Week
              </button>
           </div>
         )}
       </div>
       


      {/* Next Week Button */}
      <button
        onClick={onNextWeek}
        disabled={!canGoNext}
        className={`flex items-center justify-center w-10 h-10 rounded transition-all duration-200 ${
          canGoNext 
            ? 'hover:opacity-80 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{ backgroundColor: brandTheme.primary.navy }}
      >
        <ChevronRight 
          size={20} 
          color="white" 
        />
      </button>
    </div>
  );
};

export default PageChange;

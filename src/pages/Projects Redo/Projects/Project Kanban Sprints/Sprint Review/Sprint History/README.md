# Sprint History Module

This module has been refactored into smaller, manageable components for better maintainability and code organization.

## File Structure

### Core Files

- **SprintHistory.tsx** (233 lines) - Main component that orchestrates all functionality
  - Manages state
  - Coordinates data flow between components
  - Handles user interactions

### Data & Logic

- **useSprintData.ts** - Custom hook for data fetching
  - Fetches sprint groups, tasks, subtasks, and story points
  - Manages loading state
  - Provides data refresh function
  
- **types.ts** - TypeScript interfaces and types
  - SprintGroup
  - HistoricalSprint
  - TaskWithSprintInfo
  - SprintProgress
  - StoryPoints

- **sprintHelpers.ts** - Helper functions
  - `calculateBusinessDays()` - Calculates business days excluding weekends
  - `getSprintProgress()` - Calculates days completed/remaining
  - `getSprintStatus()` - Determines sprint status (Active/Upcoming/Completed)
  - `getSprintStoryPoints()` - Calculates total and completed story points
  - `getSprintTypeColor()` - Returns color scheme for sprint types
  - `formatDate()` - Formats dates for display
  - `formatDateForInput()` - Formats dates for input fields

### UI Components

- **SprintCard.tsx** - Individual sprint display
  - Shows sprint header with progress and story points
  - Displays sprint groups in expandable sections
  - Shows tasks and subtasks organized by status (To Do, In Progress, Done)
  - Includes edit functionality for sprint dates

- **UngroupedSprintsSection.tsx** - Ungrouped sprints management
  - Displays sprints without a sprint_id
  - Allows selection of multiple sprints
  - Provides interface to schedule selected sprints

- **CreateSprintForm.tsx** - Form for creating new sprints
  - Input fields for Sprint ID, Start Date, End Date
  - Form validation
  - Save/Cancel actions

### Other Files

- **Gantchart.tsx** - Gantt chart visualization (existing file)

## Benefits of Refactoring

1. **Reduced Complexity**: Main file reduced from ~1200 lines to ~233 lines
2. **Better Separation of Concerns**: Each file has a single, clear responsibility
3. **Easier Testing**: Components can be tested in isolation
4. **Improved Maintainability**: Changes to one component don't affect others
5. **Better Reusability**: Helper functions and hooks can be used in other parts of the app
6. **Clearer Code Organization**: Easy to find specific functionality

## Data Flow

```
SprintHistory (Main Component)
    ↓
useSprintData (Custom Hook) → Fetches all data
    ↓
SprintCard (Component) → Displays individual sprint
    ↓
sprintHelpers (Utilities) → Format and calculate data
```

## Key Features

- **Business Days Calculation**: Excludes weekends from day counting
- **Sprint Progress Tracking**: Shows days completed and remaining
- **Story Points Tracking**: Displays completed vs. total story points
- **Expandable Groups**: Click to show tasks and subtasks by status
- **Live Editing**: Edit sprint dates inline
- **Sprint Scheduling**: Convert ungrouped sprints into scheduled sprints

## Usage

The main `SprintHistory.tsx` file is automatically used when navigating to the Sprint Tracking page. All other files are internal dependencies and should not be imported elsewhere unless specifically needed.


import { UserPlus, FolderOpen, LucideIcon } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
}

export const createMenuItems = (
  onAssignUser: () => void,
  onPullInProject: () => void
): MenuItem[] => [
  {
    id: 'assign-user',
    label: 'Assign a user to Product Development',
    icon: UserPlus,
    action: onAssignUser
  },
  {
    id: 'pull-project',
    label: 'Pull in Project',
    icon: FolderOpen,
    action: onPullInProject
  }
];

export const getMenuButtonStyle = () => ({
  color: brandTheme.text.primary
});

export const getMenuDropdownStyle = () => ({
  backgroundColor: brandTheme.background.primary,
  borderColor: brandTheme.border.light
});

export const getMenuItemStyle = () => ({
  color: brandTheme.text.primary
});

// Brand Theme Colors and Design System
export const brandTheme = {
  // Primary Brand Colors
  primary: {
    navy: '#0B3B6B',      // Deep navy blue - primary brand color
    lightBlue: '#ACC4E2',  // Light blue - secondary brand color
    paleBlue: '#EEF3F9',   // Very light blue - background/subtle
    offWhite: '#F6F9FC',   // Off-white - lightest background
  },

  // Complementary Colors for UI Elements
  secondary: {
    slate: '#475569',      // Dark slate for text
    slateLight: '#64748B', // Medium slate for secondary text
    slatePale: '#94A3B8',  // Light slate for muted text
  },

  // Status & State Colors
  status: {
    success: '#059669',    // Green for success/complete
    successLight: '#D1FAE5', // Light green background
    warning: '#D97706',    // Orange for warning/pending
    warningLight: '#FEF3C7', // Light orange background
    error: '#DC2626',      // Red for error/incomplete
    errorLight: '#FEE2E2', // Light red background
    info: '#2563EB',       // Blue for info
    infoLight: '#DBEAFE',  // Light blue background
  },

  // Neutral Grays
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Semantic Color Mappings
  text: {
    primary: '#0B3B6B',    // Almost black for primary text
    secondary: '#475569',  // Dark slate for secondary text
    muted: '#64748B',      // Medium slate for muted text
    light: '#94A3B8',      // Light slate for very light text
    fieldLabel: '#0B3B6B', // Dark blue for main field labels
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',    // Pure white
    secondary: '#F8FAFC',  // Very light gray
    tertiary: '#F1F5F9',   // Light gray
    brand: '#F6F9FC',      // Brand off-white
    brandLight: '#EEF3F9', // Brand pale blue
  },

  // Border Colors
  border: {
    light: '#E2E8F0',     // Light border
    medium: '#CBD5E1',    // Medium border
    dark: '#94A3B8',      // Dark border
    brand: '#ACC4E2',     // Brand light blue border
  },

  // Table-specific styling
  table: {
    header: {
      background: '#0B3B6B',    // Dark blue header background
      text: '#FFFFFF',          // White text for headers
      border: '#0B3B6B',        // Dark blue border
    },
    row: {
      background: '#EEF3F9',    // Light blue row background
      backgroundHover: '#E0ECFA', // Slightly darker on hover
      backgroundAlt: '#F6F9FC',  // Alternating row background
      border: '#ACC4E2',        // Light blue border
    },
    cell: {
      labelText: '#0B3B6B',     // Dark blue for field labels
      valueText: '#475569',     // Slate for values
      mutedText: '#64748B',     // Muted text
    }
  },

  // Interactive States
  interactive: {
    hover: '#1E40AF',     // Darker blue for hover
    focus: '#2563EB',     // Blue for focus
    active: '#1D4ED8',    // Active blue
    disabled: '#9CA3AF',  // Gray for disabled
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Typography Scale
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },

  // Spacing Scale
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
  },

  // Border Radius
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',  // Full rounded
  }
}

// Utility functions for theme usage
export const getStatusColor = (type: 'success' | 'warning' | 'error' | 'info') => {
  return {
    text: brandTheme.status[type],
    background: brandTheme.status[`${type}Light` as keyof typeof brandTheme.status],
  }
}

export const getBrandGradient = () => {
  return `linear-gradient(135deg, ${brandTheme.primary.navy} 0%, ${brandTheme.primary.lightBlue} 100%)`
}

export const getTextColor = (variant: 'primary' | 'secondary' | 'muted' | 'light' | 'fieldLabel') => {
  return brandTheme.text[variant]
}

// Table styling utilities
export const getTableHeaderStyle = () => {
  return {
    backgroundColor: brandTheme.table.header.background,
    color: brandTheme.table.header.text,
    borderColor: brandTheme.table.header.border,
  }
}

export const getTableRowStyle = (isHover: boolean = false) => {
  return {
    backgroundColor: isHover ? brandTheme.table.row.backgroundHover : brandTheme.table.row.background,
    borderColor: brandTheme.table.row.border,
  }
}

export const getTableCellStyle = (type: 'label' | 'value' | 'muted' = 'value') => {
  const colorMap = {
    label: brandTheme.table.cell.labelText,
    value: brandTheme.table.cell.valueText,
    muted: brandTheme.table.cell.mutedText,
  }
  return { color: colorMap[type] }
} 
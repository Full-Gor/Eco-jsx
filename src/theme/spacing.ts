/**
 * Spacing system for the application
 */

/** Spacing scale (in pixels) */
export const spacing = {
  /** 0px */
  none: 0,
  /** 2px */
  '2xs': 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
  /** 64px */
  '6xl': 64,
  /** 80px */
  '7xl': 80,
  /** 96px */
  '8xl': 96,
} as const;

/** Border radius scale */
export const borderRadius = {
  /** 0px */
  none: 0,
  /** 2px */
  xs: 2,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** Full rounded (9999px) */
  full: 9999,
} as const;

/** Shadow definitions */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

/** Screen padding constants */
export const screenPadding = {
  horizontal: spacing.lg,
  vertical: spacing.lg,
  top: spacing.lg,
  bottom: spacing['5xl'], // Extra space for bottom navigation
};

/** Component sizing */
export const sizing = {
  /** Button heights */
  button: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },
  /** Input heights */
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  /** Icon sizes */
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  /** Avatar sizes */
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
    '2xl': 96,
  },
  /** Tab bar height */
  tabBar: 60,
  /** Header height */
  header: 56,
  /** Bottom sheet handle height */
  bottomSheetHandle: 24,
};

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  inputHeight: 52,
  buttonHeight: 56,
  iconSize: {
    sm: 16,
    md: 20,
    base: 24,
    lg: 28,
    xl: 32,
  },
} as const;

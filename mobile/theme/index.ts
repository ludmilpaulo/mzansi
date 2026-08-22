export const colors = {
  primary: "#FF6B21",
  primaryDark: "#E05510",
  white: "#FFFFFF",
  charcoal: "#1A1A1A",
  navy: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  card: "#FFFFFF",
  danger: "#DC2626",
  warning: "#D97706",
  success: "#15803D",
  info: "#1D4ED8",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  heading: 22,
  subtitle: 18,
  body: 16,
  caption: 13,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
} as const;

export type Theme = typeof theme;

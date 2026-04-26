export const Colors = {
  background: {
    dark: ['#0D1219', '#0F1720', '#0A0F17'] as const,
    light: ['#EBF5FD', '#DBF2F5', '#F2F7FD'] as const,
  },

  glow: {
    cyan: 'rgba(0,212,255,0.18)',
    teal: 'rgba(0,180,180,0.16)',
    blue: 'rgba(30,80,200,0.16)',
  },

  surface: {
    dark: 'rgba(255,255,255,0.07)',
    light: 'rgba(255,255,255,0.55)',
    border: {
      dark: 'rgba(255,255,255,0.10)',
      light: 'rgba(255,255,255,0.25)',
    },
  },

  accent: {
    gradient: ['rgba(0,212,255,0.65)', 'rgba(0,180,160,0.70)', 'rgba(30,80,200,0.60)'] as const,
  },

  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.55)',
    positive: '#34C759',
    negative: '#FF3B30',
    warning: '#FF9500',
  },

  chart: {
    line: 'rgba(0,212,255,0.85)',
    area: 'rgba(0,212,255,0.10)',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 24,
} as const;

export const FontSize = {
  caption2: 11,
  caption: 12,
  subheadline: 15,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title: 28,
  largeTitle: 34,
} as const;

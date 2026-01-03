/**
 * Design Tokens - Centralized design system for Rora
 * Includes colors, typography, spacing, border radius, shadows, and animations
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  // Primary Brand
  primary: '#00BE3C', // Evergreen
  primaryLight: '#1FD455',
  primaryDark: '#008F2F',
  accent: '#008F2F',

  // Backgrounds
  canvasMist: '#F9F9F9', // App background
  cardWhite: '#FFFFFF', // Cards, inputs, sheets

  // Text
  textSlate: '#262626', // Primary text
  neutralStone: '#5C5F62', // Secondary text, placeholders, disabled

  // Functional
  success: '#00BE3C', // Success, confirmation
  error: '#D14343', // Errors, blocking states
  warning: '#E9A63A', // Warnings, inline alerts
  info: '#2F89FC', // Informational

  // Dividers & Borders
  dividerMist: '#E3E6E3',
  link: '#00BE3C',

  // Aliases for semantic use
  background: '#F9F9F9',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#5C5F62',
  border: '#E3E6E3',
  tint: '#00BE3C',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Font Families
  fonts: {
    sans: "Suisse, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Symbol', system-ui, -apple-system, sans-serif",
    grotesk: "Suisse, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Symbol', system-ui, -apple-system, sans-serif",
  },

  // Font Sizes
  sizes: {
    // Headings
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16,
    // Body
    body: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 11,
  },

  // Font Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights (multipliers)
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  // 4px base unit
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Larger
  space2xl: 40,
  space3xl: 48,
  space4xl: 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999, // Pill-shaped
  // Specific use cases
  button: 12, // Pill-shaped buttons
  card: 16,
  sheet: 24, // Bottom sheets
  input: 12,
  chip: 24, // Category chips
};

// ============================================================================
// SHADOWS & ELEVATION
// ============================================================================

export const Shadows = {
  // Subtle shadows for cards
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const Animations = {
  fast: 100, // Quick interactions
  normal: 200, // Standard animations
  slow: 300, // Deliberate, calm animations
  verySlow: 500, // Extended animations
};

// ============================================================================
// Z-INDEX
// ============================================================================

export const ZIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

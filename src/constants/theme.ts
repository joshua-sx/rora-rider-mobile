/**
 * Rora Design System
 * Color palette and typography for light and dark modes
 */

import { Platform } from 'react-native';
import { Colors, Typography } from './design-tokens';

// ============================================================================
// SEMANTIC COLORS FOR LIGHT AND DARK MODES
// ============================================================================

export const ThemeColors = {
  light: {
    text: Colors.textSlate,
    textSecondary: Colors.neutralStone,
    background: Colors.canvasMist,
    surface: Colors.cardWhite,
    tint: Colors.primary,
    icon: '#8C9390',
    border: Colors.dividerMist,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
    info: Colors.info,
    link: Colors.primary,
    tabIconDefault: '#8C9390',
    tabIconSelected: Colors.primary,
  },
  dark: {
    text: '#E5E7EA', // Light neutral
    textSecondary: '#A0A5AA', // Muted neutral
    background: '#0E0F0F', // Deep charcoal
    surface: '#161616', // Card surfaces
    tint: Colors.primary,
    icon: '#A0A5AA',
    border: '#2F3237',
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
    info: Colors.info,
    link: Colors.primary,
    tabIconDefault: '#7C8086',
    tabIconSelected: Colors.primary,
  },
};

export const Colors_compat = ThemeColors;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Fonts = Platform.select({
  ios: {
    /** iOS - Body */
    sans: 'Suisse',
    /** iOS - Serif */
    serif: 'ui-serif',
    /** iOS - Rounded (for headings) */
    rounded: 'ui-rounded',
    /** iOS - Monospaced */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Suisse',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Suisse, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Symbol', system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export { Typography };

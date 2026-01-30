/**
 * Color System
 * Rora Mobile Design System
 *
 * Primary: Rora Black #000000
 * Neutrals do the heavy lifting. One strong accent.
 */

export const colors = {
  // ============================================================================
  // BRAND COLORS
  // ============================================================================
  primary: "#000000", // Rora Black - CTAs, highlights
  primaryLight: "#E5E5E5", // Light gray backgrounds
  primaryDark: "#333333", // Pressed states

  // ============================================================================
  // NEUTRAL PALETTE
  // ============================================================================
  background: "#F9F9F9", // Screen background
  surface: "#FFFFFF", // Cards, sheets
  text: "#262626", // Primary text
  textSecondary: "#5C5F62", // Secondary text, captions
  textMuted: "#8C9390", // Placeholders, disabled
  border: "#E3E6E3", // Dividers, card borders

  // ============================================================================
  // FUNCTIONAL COLORS
  // ============================================================================
  success: "#22C55E", // Confirmations (distinct from primary)
  successLight: "#DCFCE7",
  danger: "#D14343", // Destructive actions, errors
  dangerLight: "#FEE2E2",
  warning: "#E9A63A", // Cautions
  warningLight: "#FEF3C7",
  info: "#3B82F6", // Informational
  infoLight: "#DBEAFE",

  // ============================================================================
  // PRICE LABELS
  // ============================================================================
  goodDeal: "#22C55E",
  goodDealBg: "#DCFCE7",
  pricier: "#F59E0B",
  pricierBg: "#FEF3C7",

  // ============================================================================
  // BADGES
  // ============================================================================
  proBg: "#000000",
  proText: "#FFFFFF",
  verifiedBg: "#DBEAFE",
  verifiedText: "#1D4ED8",

  // ============================================================================
  // SYSTEM
  // ============================================================================
  overlay: "rgba(0,0,0,0.4)",
  overlayLight: "rgba(0,0,0,0.3)",
  skeleton: "#E5E7EB",

  // ============================================================================
  // SEMANTIC COLORS (for component states)
  // ============================================================================
  primaryMuted: "#F5F5F5", // Muted primary backgrounds
  successMuted: "#DCFCE7", // Alias for successLight
  onPrimary: "#FFFFFF", // Text on primary background
  backgroundAlt: "#F3F4F6", // Alternative background for sections

  // ============================================================================
  // LEGACY ALIASES (for backward compatibility - deprecate over time)
  // ============================================================================
  bg: "#FFFFFF", // Use surface instead
  muted: "#5C5F62", // Use textSecondary instead
  card: "#FFFFFF", // Use surface instead
  primaryText: "#FFFFFF", // Use white directly
} as const;

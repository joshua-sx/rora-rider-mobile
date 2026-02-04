/**
 * Typography System
 * Rora Mobile Design System
 *
 * Scale based on DesignMe mobile UI guidelines:
 * - Display (28px): Hero moments, impact screens
 * - Title (24px): Page titles, section headers
 * - Headline (16px): Card titles, buttons, nav titles
 * - Body (16px): Primary content
 * - Caption (14px): Secondary text, list item titles
 * - Small (13px): List descriptions, helper text
 * - Footnote (12px): Timestamps, tertiary info
 * - Overline (11px): Labels, badges, tab bar
 *
 * Never use more than 2-3 font weights on a single screen.
 */

export const type = {
  // ============================================================================
  // PRIMARY SCALE (use these)
  // ============================================================================

  // Display - Hero moments, impact screens, confirmations (28px Bold)
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },

  // Title - Page titles, section headers (24px Bold)
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },

  // Headline - Card titles, button labels, nav titles (16px SemiBold)
  headline: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },

  // Body - Primary content, descriptions (16px Regular)
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },

  // Caption - Secondary text, list item titles (14px Regular)
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },

  // Small - List descriptions, helper text (13px Regular)
  small: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },

  // Footnote - Timestamps, tertiary info, metadata (12px Regular)
  footnote: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },

  // Overline - Labels, badges, tab bar labels (11px Medium)
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const, letterSpacing: 0.5 },

  // ============================================================================
  // PRICE TYPOGRAPHY (special use)
  // ============================================================================

  // Price Display - Hero prices, fare display (32px Bold)
  priceDisplay: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },

  // Price Card - Prices on offer cards (24px Bold)
  priceCard: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },

  // Price List - Prices in list items (18px SemiBold)
  priceList: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },

  // ============================================================================
  // LEGACY ALIASES (for backward compatibility - deprecate over time)
  // ============================================================================

  // Map old names to new scale
  title1: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const }, // Use title
  title2: { fontSize: 24, lineHeight: 30, fontWeight: "600" as const }, // Use title
  title3: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const }, // Use headline
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const }, // Use caption
  h2: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const }, // Use headline
  sub: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const }, // Use caption
  cap: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const }, // Use footnote
} as const;

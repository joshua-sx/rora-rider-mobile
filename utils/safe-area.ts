import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/**
 * Calculates header top padding based on industry standards:
 * - iOS: 44-47pt safe area (52-56px) + 16-20px content spacing
 * - Android: 16-24dp safe area + 16-20px content spacing
 * - Enforces minimum values to prevent header cutoff
 */
export function getHeaderTopPadding(
  insets: EdgeInsets,
  contentSpacing: number = 16
): number {
  const safeAreaTop = insets.top;
  
  // iOS minimum: 44pt ≈ 52px (at @2x) or 44pt ≈ 44px (at @1x)
  // Use 52px as conservative minimum for @2x/@3x displays
  const iosMinimum = 52;
  
  // Android minimum: 24dp (standard status bar height)
  const androidMinimum = 24;
  
  // Calculate total padding: safe area + content spacing
  const calculatedPadding = safeAreaTop + contentSpacing;
  
  // Enforce platform-specific minimums
  const minimumPadding = Platform.OS === 'ios' ? iosMinimum : androidMinimum;
  
  // Return the larger of calculated or minimum padding
  return Math.max(calculatedPadding, minimumPadding);
}


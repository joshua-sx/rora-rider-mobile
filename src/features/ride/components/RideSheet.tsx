import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type BottomSheet from '@gorhom/bottom-sheet';
import { useSharedValue } from 'react-native-reanimated';

import { Sheet } from '@/src/ui/components/Sheet';
import { useRideSheetStore, type RideSheetState } from '../store/ride-sheet-store';
import { RideSheetIdle } from './sheets/RideSheetIdle';
import { RideSheetFareSummary } from './sheets/RideSheetFareSummary';
import { RideSheetQR } from './sheets/RideSheetQR';
import { RideSheetDiscovery } from './sheets/RideSheetDiscovery';
import { RideSheetOffers } from './sheets/RideSheetOffers';
import { RideSheetConfirm } from './sheets/RideSheetConfirm';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

// Sheet spacing constants
const HANDLE_HEIGHT = 12;
const CONTENT_PADDING = space[4];
const CONTENT_GAP = space[4];

type Props = {
  /** Tab bar height for bottom inset calculation */
  bottomInset: number;
};

/**
 * RideSheet - State-driven bottom sheet for the ride request flow
 *
 * Orchestrates content based on RideSheetState:
 * - IDLE: Search pill + popular destinations
 * - ROUTE_SET: Fare summary + "Look for drivers" CTA
 * - QR_READY: QR code display + "Look for drivers"
 * - DISCOVERING: Animated status messages
 * - OFFERS_RECEIVED: Driver offer cards
 * - CONFIRMING: Modal confirmation overlay (rendered separately)
 * - MATCHED: Transitions to active ride flow
 *
 * Each state has appropriate snap points for collapsed/peek/expanded.
 */
export function RideSheet({ bottomInset }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { height: screenHeight } = useWindowDimensions();
  const animatedIndex = useSharedValue(1);

  const state = useRideSheetStore((s) => s.state);

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);

  // Snap points vary by state
  const snapPoints = useMemo(() => {
    const bottomSpace = CONTENT_GAP + bottomInset;

    switch (state) {
      case 'IDLE': {
        // Collapsed: pill only, Expanded: pill + carousel
        //
        // Layout from bottom to top:
        // - bottomInset: space below tab bar to screen edge
        // - We want the SAME space (bottomInset) between content and tab bar top
        // - So total bottom spacing = bottomInset * 2 (symmetric above/below tab bar)
        //
        // Sheet extends to screen bottom (bottomInset=0 on Sheet component)
        // Content padding handles the spacing via contentContainerStyle.paddingBottom
        const symmetricBottomSpace = bottomInset * 2;
        const collapsedHeight = HANDLE_HEIGHT + CONTENT_PADDING + 60 + CONTENT_GAP + symmetricBottomSpace;
        const expandedHeight = HANDLE_HEIGHT + CONTENT_PADDING + 60 + CONTENT_GAP + 240 + CONTENT_GAP + symmetricBottomSpace;
        return [collapsedHeight, expandedHeight];
      }

      case 'ROUTE_SET': {
        // Collapsed: summary, Peek: route + fare, Expanded: + CTA
        const collapsedHeight = HANDLE_HEIGHT + CONTENT_PADDING + 50 + bottomSpace;
        const peekHeight = HANDLE_HEIGHT + CONTENT_PADDING + 280 + bottomSpace;
        const expandedHeight = Math.min(
          HANDLE_HEIGHT + CONTENT_PADDING + 420 + bottomSpace,
          screenHeight * 0.65
        );
        return [collapsedHeight, peekHeight, expandedHeight];
      }

      case 'QR_READY': {
        // Peek: QR code, Expanded: + CTA
        const peekHeight = HANDLE_HEIGHT + CONTENT_PADDING + 320 + bottomSpace;
        const expandedHeight = Math.min(
          HANDLE_HEIGHT + CONTENT_PADDING + 480 + bottomSpace,
          screenHeight * 0.55
        );
        return [peekHeight, expandedHeight];
      }

      case 'DISCOVERING': {
        // Collapsed: spinner + status, Peek: + route, Expanded: + info
        const collapsedHeight = HANDLE_HEIGHT + CONTENT_PADDING + 120 + bottomSpace;
        const peekHeight = HANDLE_HEIGHT + CONTENT_PADDING + 220 + bottomSpace;
        const expandedHeight = Math.min(
          HANDLE_HEIGHT + CONTENT_PADDING + 360 + bottomSpace,
          screenHeight * 0.45
        );
        return [collapsedHeight, peekHeight, expandedHeight];
      }

      case 'OFFERS_RECEIVED': {
        // Collapsed: count + price, Peek: top offers, Expanded: all offers
        const collapsedHeight = HANDLE_HEIGHT + CONTENT_PADDING + 60 + bottomSpace;
        const peekHeight = Math.min(
          HANDLE_HEIGHT + CONTENT_PADDING + 380 + bottomSpace,
          screenHeight * 0.45
        );
        const expandedHeight = Math.min(
          HANDLE_HEIGHT + CONTENT_PADDING + 600 + bottomSpace,
          screenHeight * 0.75
        );
        return [collapsedHeight, peekHeight, expandedHeight];
      }

      case 'CONFIRMING':
      case 'MATCHED':
        // Keep last snap points (confirmation is a modal overlay)
        return ['45%'];

      default:
        return ['20%', '55%'];
    }
  }, [state, screenHeight, bottomInset]);

  // Default snap point index per state
  // Clamped to valid range to prevent race conditions during state transitions
  const defaultIndex = useMemo(() => {
    const maxIndex = snapPoints.length - 1;
    let targetIndex: number;

    switch (state) {
      case 'IDLE':
        targetIndex = 1; // Expanded (show carousel)
        break;
      case 'ROUTE_SET':
        targetIndex = 2; // Expanded (show CTA)
        break;
      case 'QR_READY':
        targetIndex = 0; // Peek (show QR)
        break;
      case 'DISCOVERING':
        targetIndex = 1; // Peek (show status)
        break;
      case 'OFFERS_RECEIVED':
        targetIndex = 1; // Peek (show top offers)
        break;
      default:
        targetIndex = 0;
    }

    // Clamp to valid range
    return Math.min(targetIndex, maxIndex);
  }, [state, snapPoints.length]);

  // Snap to default index when state changes
  useEffect(() => {
    if (bottomSheetRef.current && defaultIndex >= 0 && defaultIndex < snapPoints.length) {
      bottomSheetRef.current.snapToIndex(defaultIndex);
    }
  }, [state, defaultIndex, snapPoints.length]);

  const handleSheetChange = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsExpanded(index === snapPoints.length - 1);
  }, [snapPoints.length]);

  // Render content based on state
  const renderContent = () => {
    switch (state) {
      case 'IDLE':
        return (
          <RideSheetIdle
            animatedIndex={animatedIndex}
            isExpanded={isExpanded}
          />
        );

      case 'ROUTE_SET':
        return (
          <RideSheetFareSummary
            animatedIndex={animatedIndex}
            currentIndex={currentIndex}
          />
        );

      case 'QR_READY':
        return (
          <RideSheetQR
            animatedIndex={animatedIndex}
            currentIndex={currentIndex}
          />
        );

      case 'DISCOVERING':
        return (
          <RideSheetDiscovery
            animatedIndex={animatedIndex}
            currentIndex={currentIndex}
          />
        );

      case 'OFFERS_RECEIVED':
        return (
          <RideSheetOffers
            animatedIndex={animatedIndex}
            currentIndex={currentIndex}
          />
        );

      case 'CONFIRMING':
      case 'MATCHED':
        // Show offers in background, confirmation is modal overlay
        return (
          <RideSheetOffers
            animatedIndex={animatedIndex}
            currentIndex={currentIndex}
          />
        );

      default:
        return null;
    }
  };

  // Ensure index is always valid for current snap points to prevent race conditions
  const safeIndex = Math.min(Math.max(defaultIndex, 0), snapPoints.length - 1);

  return (
    <>
      <Sheet
        ref={bottomSheetRef}
        index={safeIndex}
        snapPoints={snapPoints}
        animatedIndex={animatedIndex}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
        onChange={handleSheetChange}
        animateOnMount={false}
        enableOverDrag={false}
        overDragResistanceFactor={0}
        enableDynamicSizing={false}
        bottomInset={0}
        activeOffsetY={[-15, 15]}
        failOffsetX={[-5, 5]}
        contentContainerStyle={{
          paddingTop: CONTENT_PADDING,
          paddingHorizontal: CONTENT_PADDING,
          // Symmetric spacing: same distance above tab bar as below it
          paddingBottom: bottomInset * 2,
        }}
      >
        {renderContent()}
      </Sheet>

      {/* Modal overlay for confirmation */}
      {state === 'CONFIRMING' && <RideSheetConfirm />}
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  handleIndicator: {},
});

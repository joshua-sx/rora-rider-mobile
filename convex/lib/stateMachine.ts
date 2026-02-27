/**
 * Ride State Machine
 *
 * Valid transitions:
 *   created    -> discovery (start looking for drivers)
 *   created    -> canceled  (rider cancels before discovery)
 *   discovery  -> hold      (rider selects an offer)
 *   discovery  -> expired   (no offers after all waves)
 *   discovery  -> canceled  (rider cancels during discovery)
 *   hold       -> confirmed (driver scans QR / confirms)
 *   hold       -> discovery (hold times out, fallback to next offer)
 *   hold       -> canceled  (rider cancels during hold)
 *   confirmed  -> active    (ride begins)
 *   confirmed  -> canceled  (rider/driver cancels before start)
 *   active     -> completed (ride ends successfully)
 *   active     -> canceled  (emergency cancellation)
 */

import { Doc } from "../_generated/dataModel";

export type RideState = Doc<"rides">["state"];

// Define valid state transitions
const VALID_TRANSITIONS: Record<RideState, RideState[]> = {
  created: ["discovery", "canceled"],
  discovery: ["hold", "expired", "canceled"],
  hold: ["confirmed", "discovery", "canceled"],
  confirmed: ["active", "canceled"],
  active: ["completed", "canceled"],
  completed: [],
  canceled: [],
  expired: [],
};

// States where ride can be canceled
const CANCELABLE_STATES: RideState[] = [
  "created",
  "discovery",
  "hold",
  "confirmed",
  "active",
];

// States considered "active" (ride in progress)
export const ACTIVE_STATES: RideState[] = [
  "created",
  "discovery",
  "hold",
  "confirmed",
  "active",
];

// Terminal states (ride is done)
export const TERMINAL_STATES: RideState[] = ["completed", "canceled", "expired"];

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromState: RideState,
  toState: RideState
): boolean {
  return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

/**
 * Check if a ride can be canceled from its current state
 */
export function canCancel(state: RideState): boolean {
  return CANCELABLE_STATES.includes(state);
}

/**
 * Validate a state transition, throwing if invalid
 */
export function validateTransition(
  fromState: RideState,
  toState: RideState
): void {
  if (!isValidTransition(fromState, toState)) {
    throw new Error(
      `Invalid state transition: ${fromState} -> ${toState}. ` +
        `Valid transitions from ${fromState}: ${VALID_TRANSITIONS[fromState]?.join(", ") || "none"}`
    );
  }
}

/**
 * Get human-readable state label
 */
export function getStateLabel(state: RideState): string {
  const labels: Record<RideState, string> = {
    created: "Ride Created",
    discovery: "Finding Drivers",
    hold: "Driver Selected",
    confirmed: "Ride Confirmed",
    active: "Ride In Progress",
    completed: "Ride Completed",
    canceled: "Ride Canceled",
    expired: "No Drivers Available",
  };
  return labels[state];
}

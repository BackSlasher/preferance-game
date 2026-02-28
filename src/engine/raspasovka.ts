import { type Card, Suit } from './types';
import { MAX_RASPASOVKA_MULTIPLIER } from './constants';

/**
 * In raspasovka, the talon cards determine the suit for the first two tricks.
 * Returns the suit that must be led for the given trick number (0-indexed).
 * Returns null for trick 3+ (free lead).
 */
export function raspasovkaLeadSuit(
  talonCards: Card[],
  trickIndex: number,
): Suit | null {
  if (trickIndex < talonCards.length) {
    return talonCards[trickIndex].suit;
  }
  return null;
}

/** Get the next raspasovka multiplier */
export function nextRaspasovkaMultiplier(currentStreak: number): number {
  return Math.min(currentStreak + 1, MAX_RASPASOVKA_MULTIPLIER);
}

/** Check if a raspasovka streak should be reset */
export function shouldResetRaspasovka(
  isRaspasovka: boolean,
  wasSuccessfulContract: boolean,
  wasSuccessfulWhist: boolean,
): boolean {
  // Reset on any non-raspasovka hand
  if (!isRaspasovka) return true;
  // Exit: successful contract of 6+ resets
  if (wasSuccessfulContract) return true;
  // Interrupt: successful whisted game resets
  if (wasSuccessfulWhist) return true;
  return false;
}

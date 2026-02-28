import { type Card, type GameState, type PlayerSeat } from '../engine/types';
import { getLegalPlays } from '../engine/game-state';

/**
 * AI play for raspasovka is handled by trick-ai.ts raspasovkaPlay.
 * This module provides the raspasovka-specific lead suit selection
 * when the leader must follow a forced suit from the talon.
 *
 * The main logic for raspasovka card play is in trick-ai.ts.
 */
export function chooseRaspasovkaCard(state: GameState, seat: PlayerSeat): Card {
  // Delegated to trick-ai.ts which handles raspasovka as a special case
  const legal = getLegalPlays(state);
  if (legal.length === 1) return legal[0];

  // Lead lowest card to avoid winning tricks
  return legal.sort((a, b) => a.rank - b.rank)[0];
}

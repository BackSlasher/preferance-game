import {
  type Card,
  type GameState,
  type PlayerSeat,
  GamePhase,
  Suit,
  Rank,
} from '../engine/types';
import { getLegalPlays } from '../engine/game-state';

/**
 * AI chooses a card to play from legal options.
 */
export function chooseCard(state: GameState, seat: PlayerSeat): Card {
  const legal = getLegalPlays(state);
  if (legal.length === 1) return legal[0];

  if (state.phase === GamePhase.RaspasovkaTrickPlay) {
    return raspasovkaPlay(legal, state, seat);
  }

  if (state.contract && seat === state.contract.declarer) {
    return declarerPlay(legal, state, seat);
  }

  return defenderPlay(legal, state, seat);
}

/**
 * Declarer strategy:
 * - Leading: play from longest suit or draw trumps
 * - Following: win with minimum winning card
 */
function declarerPlay(legal: Card[], state: GameState, seat: PlayerSeat): Card {
  const trick = state.currentTrick;
  if (!trick || trick.plays.length === 0) {
    // Leading: prefer trump to draw out opponents' trumps
    const trump = state.contract?.trump;
    if (trump !== null && trump !== undefined) {
      const trumpCards = legal.filter(c => c.suit === trump);
      if (trumpCards.length > 0) {
        // Lead highest trump
        return trumpCards.sort((a, b) => b.rank - a.rank)[0];
      }
    }
    // Lead from longest suit, highest card
    return leadFromLongest(legal, state.hands[seat]);
  }

  // Following: try to win with minimum winning card
  return playToWin(legal, trick.plays, state.contract?.trump ?? null);
}

/**
 * Defender strategy:
 * - Second hand low, third hand high
 * - Lead through declarer's weak suits
 */
function defenderPlay(legal: Card[], state: GameState, seat: PlayerSeat): Card {
  const trick = state.currentTrick;
  if (!trick || trick.plays.length === 0) {
    // Leading: play lowest card of longest non-trump suit
    return leadDefensive(legal, state);
  }

  if (trick.plays.length === 1) {
    // Second hand: play low
    return legal.sort((a, b) => a.rank - b.rank)[0];
  }

  // Third hand: play high to try to win
  return playToWin(legal, trick.plays, state.contract?.trump ?? null);
}

/**
 * Raspasovka: try to AVOID taking tricks
 * - Lead lowest card
 * - Follow with highest to avoid being stuck on lead
 */
function raspasovkaPlay(legal: Card[], state: GameState, seat: PlayerSeat): Card {
  const trick = state.currentTrick;
  if (!trick || trick.plays.length === 0) {
    // Leading: play lowest card
    return legal.sort((a, b) => a.rank - b.rank)[0];
  }

  // Following: try to lose. Play highest card that still loses.
  const leadCard = trick.plays[0].card;
  const leadSuit = leadCard.suit;

  // Cards that follow suit
  const suitCards = legal.filter(c => c.suit === leadSuit);
  if (suitCards.length > 0) {
    // Play highest card below the current winner, or lowest if all are above
    const currentWinnerRank = Math.max(...trick.plays.map(p => p.card.suit === leadSuit ? p.card.rank : 0));
    const below = suitCards.filter(c => c.rank < currentWinnerRank);
    if (below.length > 0) {
      return below.sort((a, b) => b.rank - a.rank)[0]; // Highest below winner
    }
    // All above: play lowest (minimize damage)
    return suitCards.sort((a, b) => a.rank - b.rank)[0];
  }

  // Off-suit: dump highest card
  return legal.sort((a, b) => b.rank - a.rank)[0];
}

/** Defensive lead: lowest card from longest non-trump suit */
function leadDefensive(legal: Card[], state: GameState): Card {
  const trump = state.contract?.trump ?? null;
  const seat = state.activePlayer;
  const hand = state.hands[seat];

  // Count suit lengths, prefer non-trump suits
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const c of hand) counts[c.suit]++;

  // Sort: longest non-trump suit first, then lowest rank
  return [...legal].sort((a, b) => {
    const aIsTrump = trump !== null && a.suit === trump;
    const bIsTrump = trump !== null && b.suit === trump;
    // Prefer non-trump leads
    if (aIsTrump !== bIsTrump) return aIsTrump ? 1 : -1;
    // Then longest suit
    const lenDiff = counts[b.suit] - counts[a.suit];
    if (lenDiff !== 0) return lenDiff;
    // Then lowest rank
    return a.rank - b.rank;
  })[0];
}

/** Lead from longest suit, highest card */
function leadFromLongest(legal: Card[], hand: Card[]): Card {
  // Count suit lengths in full hand
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const c of hand) counts[c.suit]++;

  // Sort legal plays by suit length (desc) then rank (desc)
  return [...legal].sort((a, b) => {
    const lenDiff = counts[b.suit] - counts[a.suit];
    if (lenDiff !== 0) return lenDiff;
    return b.rank - a.rank;
  })[0];
}

/** Try to win the trick with minimum winning card */
function playToWin(
  legal: Card[],
  plays: { seat: PlayerSeat; card: Card }[],
  trump: Suit | null,
): Card {
  const leadSuit = plays[0].card.suit;

  // Find current best card in the trick
  let bestRank = 0;
  let bestIsTrump = false;
  for (const p of plays) {
    const isTrump = trump !== null && p.card.suit === trump;
    if (isTrump && !bestIsTrump) {
      bestRank = p.card.rank;
      bestIsTrump = true;
    } else if (isTrump === bestIsTrump) {
      if (p.card.suit === leadSuit || isTrump) {
        if (p.card.rank > bestRank) bestRank = p.card.rank;
      }
    }
  }

  // Try to beat it with minimum winning card
  const winners = legal.filter(c => {
    const isTrump = trump !== null && c.suit === trump;
    if (isTrump && !bestIsTrump) return true; // Trump beats non-trump
    if (isTrump && bestIsTrump) return c.rank > bestRank;
    if (c.suit === leadSuit && !bestIsTrump) return c.rank > bestRank;
    return false;
  });

  if (winners.length > 0) {
    // Play lowest winner
    return winners.sort((a, b) => a.rank - b.rank)[0];
  }

  // Can't win: play lowest card
  return legal.sort((a, b) => a.rank - b.rank)[0];
}

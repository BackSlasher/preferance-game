import { Suit, type Card, type PlayerSeat, type Trick } from './types';

/**
 * Get the legal cards a player can play from their hand.
 *
 * Preferance rules:
 * 1. Must follow suit if possible.
 * 2. Must trump if can't follow suit and have trumps.
 * 3. Free discard only when holding neither led suit nor trumps.
 */
export function legalPlays(
  hand: Card[],
  leadSuit: Suit | null,
  trump: Suit | null,
): Card[] {
  // Leading: any card
  if (leadSuit === null) return [...hand];

  // Must follow suit
  const follows = hand.filter(c => c.suit === leadSuit);
  if (follows.length > 0) return follows;

  // Must trump if can't follow
  if (trump !== null) {
    const trumps = hand.filter(c => c.suit === trump);
    if (trumps.length > 0) return trumps;
  }

  // Free discard
  return [...hand];
}

/**
 * Determine the winner of a completed trick.
 */
export function trickWinner(
  plays: { seat: PlayerSeat; card: Card }[],
  trump: Suit | null,
): PlayerSeat {
  if (plays.length === 0) throw new Error('Empty trick');

  const leadSuit = plays[0].card.suit;
  let best = plays[0];

  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const card = play.card;
    const bestCard = best.card;

    // Trump beats non-trump
    if (trump !== null) {
      if (card.suit === trump && bestCard.suit !== trump) {
        best = play;
        continue;
      }
      if (card.suit !== trump && bestCard.suit === trump) {
        continue;
      }
      // Both trumps: higher rank wins
      if (card.suit === trump && bestCard.suit === trump) {
        if (card.rank > bestCard.rank) best = play;
        continue;
      }
    }

    // Same suit as lead: higher rank wins
    if (card.suit === leadSuit && bestCard.suit === leadSuit) {
      if (card.rank > bestCard.rank) best = play;
    }
    // Off-suit (not trump) never wins
  }

  return best.seat;
}

/** Create a new empty trick */
export function createTrick(leader: PlayerSeat): Trick {
  return { leader, plays: [] };
}

/** Check if a trick is complete (3 plays) */
export function isTrickComplete(trick: Trick): boolean {
  return trick.plays.length === 3;
}

/** Get the lead suit of the current trick, or null if no cards played */
export function getLeadSuit(trick: Trick | null): Suit | null {
  if (!trick || trick.plays.length === 0) return null;
  return trick.plays[0].card.suit;
}

/**
 * Explain why only certain cards are playable.
 * Returns a human-readable hint, or null if all cards are playable.
 */
export function explainLegalPlays(
  hand: Card[],
  leadSuit: Suit | null,
  trump: Suit | null,
): string | null {
  // Leading: any card is fine
  if (leadSuit === null) return null;

  const suitNames = ['Spades', 'Clubs', 'Diamonds', 'Hearts'];
  const suitSymbols = ['♠', '♣', '♦', '♥'];
  const leadName = suitSymbols[leadSuit];

  // Must follow suit
  const follows = hand.filter(c => c.suit === leadSuit);
  if (follows.length > 0) {
    return `Must follow suit — play a ${leadName}`;
  }

  // Must trump if can't follow
  if (trump !== null) {
    const trumps = hand.filter(c => c.suit === trump);
    if (trumps.length > 0) {
      const trumpName = suitSymbols[trump];
      return `No ${leadName} — must trump with ${trumpName}`;
    }
  }

  // Free discard
  return null;
}

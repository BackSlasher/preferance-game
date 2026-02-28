import { type Card, type PlayerSeat, ALL_SEATS } from './types';
import { ALL_SUITS, ALL_RANKS, createCard } from './card';

/** Create the 32-card Piquet deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push(createCard(suit, rank));
    }
  }
  return deck;
}

/** Fisher-Yates shuffle (returns new array) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deal cards in the Preferance pattern: 2-talon-2-2-2-2
 * Starting from eldest hand (left of dealer).
 *
 * Returns hands for each player and the 2-card talon.
 */
export function deal(
  deck: Card[],
  dealer: PlayerSeat,
): { hands: Record<PlayerSeat, Card[]>; talon: Card[] } {
  if (deck.length !== 32) {
    throw new Error(`Deck must have 32 cards, got ${deck.length}`);
  }

  const hands: Record<PlayerSeat, Card[]> = {
    0: [], 1: [], 2: [],
  };
  const talon: Card[] = [];

  // Eldest hand = (dealer + 1) % 3
  const order: PlayerSeat[] = [];
  for (let i = 1; i <= 3; i++) {
    order.push(((dealer + i) % 3) as PlayerSeat);
  }

  let idx = 0;

  // Round 1: 2 cards to each player
  for (const seat of order) {
    hands[seat].push(deck[idx++], deck[idx++]);
  }

  // Talon: 2 cards
  talon.push(deck[idx++], deck[idx++]);

  // Rounds 2–5: 2 cards to each player (4 more rounds)
  for (let round = 0; round < 4; round++) {
    for (const seat of order) {
      hands[seat].push(deck[idx++], deck[idx++]);
    }
  }

  // Verify: each player should have 10 cards, talon should have 2
  for (const seat of ALL_SEATS) {
    if (hands[seat].length !== 10) {
      throw new Error(`Player ${seat} has ${hands[seat].length} cards, expected 10`);
    }
  }

  return { hands, talon };
}

/** Eldest hand: the player to the left of the dealer */
export function eldestHand(dealer: PlayerSeat): PlayerSeat {
  return ((dealer + 1) % 3) as PlayerSeat;
}

/** Next player clockwise */
export function nextPlayer(seat: PlayerSeat): PlayerSeat {
  return ((seat + 1) % 3) as PlayerSeat;
}

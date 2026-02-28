import { describe, it, expect } from 'vitest';
import { PlayerSeat, ALL_SEATS } from '../../src/engine/types';
import { createDeck, shuffle, deal, eldestHand, nextPlayer } from '../../src/engine/deck';

describe('deck', () => {
  it('creates a 32-card deck', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(32);
    // No duplicates
    const keys = deck.map(c => `${c.suit}-${c.rank}`);
    expect(new Set(keys).size).toBe(32);
  });

  it('shuffles without losing cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(32);
    // Same cards, possibly different order
    const origKeys = new Set(deck.map(c => `${c.suit}-${c.rank}`));
    const shuffKeys = new Set(shuffled.map(c => `${c.suit}-${c.rank}`));
    expect(shuffKeys).toEqual(origKeys);
  });

  it('deals 10 cards to each player and 2 to talon', () => {
    const deck = shuffle(createDeck());
    const { hands, talon } = deal(deck, PlayerSeat.East);

    for (const seat of ALL_SEATS) {
      expect(hands[seat]).toHaveLength(10);
    }
    expect(talon).toHaveLength(2);

    // Total cards = 32
    const total = ALL_SEATS.reduce((sum, s) => sum + hands[s].length, 0) + talon.length;
    expect(total).toBe(32);

    // No duplicates across all hands and talon
    const all = [...hands[0], ...hands[1], ...hands[2], ...talon];
    const keys = all.map(c => `${c.suit}-${c.rank}`);
    expect(new Set(keys).size).toBe(32);
  });

  it('computes eldest hand correctly', () => {
    expect(eldestHand(PlayerSeat.South)).toBe(PlayerSeat.West);
    expect(eldestHand(PlayerSeat.West)).toBe(PlayerSeat.East);
    expect(eldestHand(PlayerSeat.East)).toBe(PlayerSeat.South);
  });

  it('cycles players clockwise', () => {
    expect(nextPlayer(PlayerSeat.South)).toBe(PlayerSeat.West);
    expect(nextPlayer(PlayerSeat.West)).toBe(PlayerSeat.East);
    expect(nextPlayer(PlayerSeat.East)).toBe(PlayerSeat.South);
  });
});

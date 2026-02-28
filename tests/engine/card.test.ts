import { describe, it, expect } from 'vitest';
import { Suit, Rank } from '../../src/engine/types';
import {
  createCard,
  cardEquals,
  cardSortKey,
  sortHand,
  suitSymbol,
  rankName,
  cardName,
  isRedSuit,
} from '../../src/engine/card';

describe('card', () => {
  it('creates a card', () => {
    const card = createCard(Suit.Hearts, Rank.Ace);
    expect(card.suit).toBe(Suit.Hearts);
    expect(card.rank).toBe(Rank.Ace);
  });

  it('compares cards for equality', () => {
    const a = createCard(Suit.Spades, Rank.Seven);
    const b = createCard(Suit.Spades, Rank.Seven);
    const c = createCard(Suit.Spades, Rank.Eight);
    expect(cardEquals(a, b)).toBe(true);
    expect(cardEquals(a, c)).toBe(false);
  });

  it('sorts cards by suit then rank descending', () => {
    const hand = [
      createCard(Suit.Hearts, Rank.Seven),
      createCard(Suit.Spades, Rank.Ace),
      createCard(Suit.Diamonds, Rank.King),
      createCard(Suit.Spades, Rank.Seven),
    ];
    const sorted = sortHand(hand);
    // Spades first (suit 0), then diamonds (2), then hearts (3)
    expect(sorted[0]).toEqual(createCard(Suit.Spades, Rank.Ace));
    expect(sorted[1]).toEqual(createCard(Suit.Spades, Rank.Seven));
    expect(sorted[2]).toEqual(createCard(Suit.Diamonds, Rank.King));
    expect(sorted[3]).toEqual(createCard(Suit.Hearts, Rank.Seven));
  });

  it('displays suit symbols', () => {
    expect(suitSymbol(Suit.Spades)).toBe('♠');
    expect(suitSymbol(Suit.Clubs)).toBe('♣');
    expect(suitSymbol(Suit.Diamonds)).toBe('♦');
    expect(suitSymbol(Suit.Hearts)).toBe('♥');
  });

  it('displays rank names', () => {
    expect(rankName(Rank.Seven)).toBe('7');
    expect(rankName(Rank.Ten)).toBe('10');
    expect(rankName(Rank.Jack)).toBe('J');
    expect(rankName(Rank.Ace)).toBe('A');
  });

  it('displays card names', () => {
    expect(cardName(createCard(Suit.Hearts, Rank.Ace))).toBe('A♥');
    expect(cardName(createCard(Suit.Spades, Rank.Ten))).toBe('10♠');
  });

  it('identifies red suits', () => {
    expect(isRedSuit(Suit.Diamonds)).toBe(true);
    expect(isRedSuit(Suit.Hearts)).toBe(true);
    expect(isRedSuit(Suit.Spades)).toBe(false);
    expect(isRedSuit(Suit.Clubs)).toBe(false);
  });
});

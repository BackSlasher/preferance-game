import { describe, it, expect } from 'vitest';
import { Suit, Rank, PlayerSeat } from '../../src/engine/types';
import { createCard } from '../../src/engine/card';
import { legalPlays, trickWinner } from '../../src/engine/trick';

const c = createCard;

describe('trick', () => {
  describe('legalPlays', () => {
    it('allows any card when leading', () => {
      const hand = [
        c(Suit.Spades, Rank.Ace),
        c(Suit.Hearts, Rank.Seven),
        c(Suit.Diamonds, Rank.King),
      ];
      expect(legalPlays(hand, null, Suit.Spades)).toHaveLength(3);
    });

    it('must follow suit', () => {
      const hand = [
        c(Suit.Spades, Rank.Ace),
        c(Suit.Spades, Rank.Seven),
        c(Suit.Hearts, Rank.King),
      ];
      const plays = legalPlays(hand, Suit.Spades, Suit.Hearts);
      expect(plays).toHaveLength(2);
      expect(plays.every(p => p.suit === Suit.Spades)).toBe(true);
    });

    it('must trump when void in led suit', () => {
      const hand = [
        c(Suit.Hearts, Rank.Ace),
        c(Suit.Hearts, Rank.Seven),
        c(Suit.Diamonds, Rank.King),
      ];
      const plays = legalPlays(hand, Suit.Spades, Suit.Hearts);
      expect(plays).toHaveLength(2);
      expect(plays.every(p => p.suit === Suit.Hearts)).toBe(true);
    });

    it('free discard when void in both led suit and trump', () => {
      const hand = [
        c(Suit.Diamonds, Rank.Ace),
        c(Suit.Diamonds, Rank.Seven),
      ];
      const plays = legalPlays(hand, Suit.Spades, Suit.Hearts);
      expect(plays).toHaveLength(2);
    });

    it('free discard in no-trump when void in led suit', () => {
      const hand = [
        c(Suit.Diamonds, Rank.Ace),
        c(Suit.Hearts, Rank.Seven),
      ];
      const plays = legalPlays(hand, Suit.Spades, null);
      expect(plays).toHaveLength(2);
    });
  });

  describe('trickWinner', () => {
    it('highest card of led suit wins (no trump)', () => {
      const plays = [
        { seat: PlayerSeat.South, card: c(Suit.Spades, Rank.Ten) },
        { seat: PlayerSeat.West, card: c(Suit.Spades, Rank.Ace) },
        { seat: PlayerSeat.East, card: c(Suit.Spades, Rank.Seven) },
      ];
      expect(trickWinner(plays, null)).toBe(PlayerSeat.West);
    });

    it('trump beats higher non-trump', () => {
      const plays = [
        { seat: PlayerSeat.South, card: c(Suit.Spades, Rank.Ace) },
        { seat: PlayerSeat.West, card: c(Suit.Hearts, Rank.Seven) }, // Trump
        { seat: PlayerSeat.East, card: c(Suit.Spades, Rank.King) },
      ];
      expect(trickWinner(plays, Suit.Hearts)).toBe(PlayerSeat.West);
    });

    it('higher trump beats lower trump', () => {
      const plays = [
        { seat: PlayerSeat.South, card: c(Suit.Diamonds, Rank.Ace) },
        { seat: PlayerSeat.West, card: c(Suit.Hearts, Rank.Seven) },
        { seat: PlayerSeat.East, card: c(Suit.Hearts, Rank.Jack) },
      ];
      expect(trickWinner(plays, Suit.Hearts)).toBe(PlayerSeat.East);
    });

    it('off-suit discard never wins', () => {
      const plays = [
        { seat: PlayerSeat.South, card: c(Suit.Spades, Rank.Seven) },
        { seat: PlayerSeat.West, card: c(Suit.Diamonds, Rank.Ace) },
        { seat: PlayerSeat.East, card: c(Suit.Spades, Rank.Eight) },
      ];
      // Diamonds ace is off-suit (not trump, not led suit)
      expect(trickWinner(plays, Suit.Clubs)).toBe(PlayerSeat.East);
    });
  });
});

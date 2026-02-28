import { describe, it, expect } from 'vitest';
import { PlayerSeat, BidSuit, type SuitBid, type MisereBid } from '../../src/engine/types';
import { isValidBid, getValidBids, isBiddingComplete } from '../../src/engine/bidding';
import { bidIndex, BID_LADDER } from '../../src/engine/constants';

function suitBid(tricks: number, suit: BidSuit): SuitBid {
  return { type: 'suit', tricks, suit };
}

const misere: MisereBid = { type: 'misere' };

describe('bidding', () => {
  describe('bid ladder', () => {
    it('has 26 entries (5 suits × 5 levels + misere)', () => {
      expect(BID_LADDER).toHaveLength(26);
    });

    it('starts with 6♠ and ends with 10NT', () => {
      const first = BID_LADDER[0];
      expect(first).toEqual(suitBid(6, BidSuit.Spades));

      const last = BID_LADDER[BID_LADDER.length - 1];
      expect(last).toEqual(suitBid(10, BidSuit.NoTrumps));
    });

    it('places misere between 8NT and 9♠', () => {
      const misereIdx = bidIndex(misere);
      const eightNT = bidIndex(suitBid(8, BidSuit.NoTrumps));
      const nineSpades = bidIndex(suitBid(9, BidSuit.Spades));

      expect(misereIdx).toBeGreaterThan(eightNT);
      expect(misereIdx).toBeLessThan(nineSpades);
    });

    it('orders suits correctly within a level', () => {
      expect(bidIndex(suitBid(7, BidSuit.Spades))).toBeLessThan(bidIndex(suitBid(7, BidSuit.Clubs)));
      expect(bidIndex(suitBid(7, BidSuit.Clubs))).toBeLessThan(bidIndex(suitBid(7, BidSuit.Diamonds)));
      expect(bidIndex(suitBid(7, BidSuit.Diamonds))).toBeLessThan(bidIndex(suitBid(7, BidSuit.Hearts)));
      expect(bidIndex(suitBid(7, BidSuit.Hearts))).toBeLessThan(bidIndex(suitBid(7, BidSuit.NoTrumps)));
    });
  });

  describe('isValidBid', () => {
    // Dealer = East(2), so eldest = South(0)
    const dealer = PlayerSeat.East;

    it('accepts any first bid', () => {
      expect(isValidBid(suitBid(6, BidSuit.Spades), null, PlayerSeat.South, dealer)).toBe(true);
      expect(isValidBid(suitBid(10, BidSuit.NoTrumps), null, PlayerSeat.South, dealer)).toBe(true);
    });

    it('eldest hand can match the current bid', () => {
      // South is eldest (dealer=East)
      expect(isValidBid(
        suitBid(7, BidSuit.Clubs),
        suitBid(7, BidSuit.Clubs),
        PlayerSeat.South,
        dealer,
      )).toBe(true);
    });

    it('younger hand must strictly raise', () => {
      // West is not eldest
      expect(isValidBid(
        suitBid(7, BidSuit.Clubs),
        suitBid(7, BidSuit.Clubs),
        PlayerSeat.West,
        dealer,
      )).toBe(false);

      expect(isValidBid(
        suitBid(7, BidSuit.Diamonds),
        suitBid(7, BidSuit.Clubs),
        PlayerSeat.West,
        dealer,
      )).toBe(true);
    });

    it('pass is always valid', () => {
      expect(isValidBid({ type: 'pass' }, suitBid(10, BidSuit.NoTrumps), PlayerSeat.South, dealer)).toBe(true);
    });
  });

  describe('isBiddingComplete', () => {
    it('completes when all three pass', () => {
      expect(isBiddingComplete(
        [PlayerSeat.South, PlayerSeat.West, PlayerSeat.East],
        null,
      )).toBe(true);
    });

    it('completes when two pass with a high bid', () => {
      expect(isBiddingComplete(
        [PlayerSeat.West, PlayerSeat.East],
        suitBid(7, BidSuit.Hearts),
      )).toBe(true);
    });

    it('does not complete with only one pass', () => {
      expect(isBiddingComplete(
        [PlayerSeat.West],
        suitBid(6, BidSuit.Spades),
      )).toBe(false);
    });
  });
});

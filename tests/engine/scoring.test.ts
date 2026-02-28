import { describe, it, expect } from 'vitest';
import { PlayerSeat, BidSuit, type SuitBid, type MisereBid, ALL_SEATS } from '../../src/engine/types';
import {
  contractValue,
  requiredTricks,
  whistObligation,
  createScores,
  scoreContract,
  scoreRaspasovka,
  finalSettlement,
  isGameOver,
} from '../../src/engine/scoring';

function suitBid(tricks: number, suit: BidSuit): SuitBid {
  return { type: 'suit', tricks, suit };
}

const misere: MisereBid = { type: 'misere' };

describe('scoring', () => {
  describe('contractValue', () => {
    it('returns correct values', () => {
      expect(contractValue(suitBid(6, BidSuit.Spades))).toBe(2);
      expect(contractValue(suitBid(7, BidSuit.Hearts))).toBe(4);
      expect(contractValue(suitBid(8, BidSuit.Diamonds))).toBe(6);
      expect(contractValue(suitBid(9, BidSuit.Clubs))).toBe(8);
      expect(contractValue(suitBid(10, BidSuit.NoTrumps))).toBe(10);
      expect(contractValue(misere)).toBe(10);
    });
  });

  describe('whistObligation', () => {
    it('returns correct obligations', () => {
      expect(whistObligation(suitBid(6, BidSuit.Spades))).toBe(4);
      expect(whistObligation(suitBid(7, BidSuit.Hearts))).toBe(2);
      expect(whistObligation(suitBid(8, BidSuit.Diamonds))).toBe(1);
      expect(whistObligation(suitBid(9, BidSuit.Clubs))).toBe(1);
      expect(whistObligation(suitBid(10, BidSuit.NoTrumps))).toBe(0);
    });
  });

  describe('scoreContract', () => {
    it('awards pool points on declarer success', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.South,
        bid: suitBid(7, BidSuit.Hearts),
        trump: 3 as any, // Hearts
      };
      const trickCounts = { 0: 8, 1: 1, 2: 1 }; // South took 8 (needed 7)
      const whistDecisions = { 1: 'whist', 2: 'pass' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      expect(scores[PlayerSeat.South].pool).toBe(4); // 7-contract = 4 pool
    });

    it('applies dump and whist compensation on declarer failure', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.South,
        bid: suitBid(7, BidSuit.Hearts),
        trump: 3 as any,
      };
      const trickCounts = { 0: 5, 1: 3, 2: 2 }; // South took 5 (needed 7), 2 undertricks
      const whistDecisions = { 1: 'whist', 2: 'pass' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      expect(scores[PlayerSeat.South].dump).toBe(8); // 4 × 2 undertricks
      expect(scores[PlayerSeat.West].whists[PlayerSeat.South]).toBe(8); // 4 × 2
      expect(scores[PlayerSeat.East].whists[PlayerSeat.South]).toBe(8); // 4 × 2
    });

    it('greedy whist: single whister gets all defensive tricks', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.South,
        bid: suitBid(6, BidSuit.Spades),
        trump: 0 as any,
      };
      // South took 6, West took 2, East took 2
      const trickCounts = { 0: 6, 1: 2, 2: 2 };
      const whistDecisions = { 1: 'whist', 2: 'pass' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      // West (sole whister) gets all 4 defensive tricks × value 2 = 8 whists
      expect(scores[PlayerSeat.West].whists[PlayerSeat.South]).toBe(8);
      // East (passer) gets nothing from whist
      expect(scores[PlayerSeat.East].whists[PlayerSeat.South]).toBe(0);
    });

    it('both whist: each gets their own tricks', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.South,
        bid: suitBid(6, BidSuit.Spades),
        trump: 0 as any,
      };
      const trickCounts = { 0: 6, 1: 3, 2: 1 };
      const whistDecisions = { 1: 'whist', 2: 'whist' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      expect(scores[PlayerSeat.West].whists[PlayerSeat.South]).toBe(6); // 3 × 2
      expect(scores[PlayerSeat.East].whists[PlayerSeat.South]).toBe(2); // 1 × 2
    });

    it('misere success gives 10 pool', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.West,
        bid: misere,
        trump: null,
      };
      const trickCounts = { 0: 5, 1: 0, 2: 5 };
      const whistDecisions = { 0: 'whist', 2: 'whist' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      expect(scores[PlayerSeat.West].pool).toBe(10);
      expect(scores[PlayerSeat.West].dump).toBe(0);
    });

    it('misere failure gives 10 × tricks dump', () => {
      const scores = createScores();
      const contract = {
        declarer: PlayerSeat.West,
        bid: misere,
        trump: null,
      };
      const trickCounts = { 0: 4, 1: 3, 2: 3 };
      const whistDecisions = { 0: 'whist', 2: 'whist' };

      scoreContract(scores, contract, trickCounts, whistDecisions, 20);

      expect(scores[PlayerSeat.West].dump).toBe(30); // 10 × 3 tricks
    });
  });

  describe('scoreRaspasovka', () => {
    it('gives 1 dump per trick at ×1', () => {
      const scores = createScores();
      const trickCounts = { 0: 4, 1: 3, 2: 3 };

      scoreRaspasovka(scores, trickCounts, 1);

      expect(scores[PlayerSeat.South].dump).toBe(4);
      expect(scores[PlayerSeat.West].dump).toBe(3);
      expect(scores[PlayerSeat.East].dump).toBe(3);
    });

    it('gives 1 pool point for 0 tricks', () => {
      const scores = createScores();
      const trickCounts = { 0: 0, 1: 5, 2: 5 };

      scoreRaspasovka(scores, trickCounts, 1);

      expect(scores[PlayerSeat.South].pool).toBe(1);
      expect(scores[PlayerSeat.South].dump).toBe(0);
    });

    it('applies multiplier for consecutive raspasovkas', () => {
      const scores = createScores();
      const trickCounts = { 0: 3, 1: 4, 2: 3 };

      scoreRaspasovka(scores, trickCounts, 3);

      expect(scores[PlayerSeat.South].dump).toBe(9);  // 3 × 3
      expect(scores[PlayerSeat.West].dump).toBe(12);   // 4 × 3
    });
  });

  describe('finalSettlement', () => {
    it('produces zero-sum results', () => {
      const scores = createScores();
      scores[PlayerSeat.South].pool = 20;
      scores[PlayerSeat.West].pool = 15;
      scores[PlayerSeat.East].pool = 20;
      scores[PlayerSeat.South].dump = 5;
      scores[PlayerSeat.West].dump = 12;
      scores[PlayerSeat.East].dump = 3;
      scores[PlayerSeat.South].whists[PlayerSeat.West] = 20;
      scores[PlayerSeat.West].whists[PlayerSeat.South] = 10;

      const result = finalSettlement(scores, 20);
      const sum = ALL_SEATS.reduce((s, seat) => s + result[seat], 0);
      expect(Math.abs(sum)).toBeLessThan(0.001); // Zero-sum within floating point
    });

    it('penalizes unfilled pools', () => {
      const scores = createScores();
      // Everyone at 20 except West at 10
      scores[0].pool = 20;
      scores[1].pool = 10;
      scores[2].pool = 20;

      const result = finalSettlement(scores, 20);

      // West should have the worst score (10 missing pool = 10 extra dump)
      expect(result[PlayerSeat.West]).toBeLessThan(result[PlayerSeat.South]);
      expect(result[PlayerSeat.West]).toBeLessThan(result[PlayerSeat.East]);
    });
  });

  describe('isGameOver', () => {
    it('returns false when not all players at target', () => {
      const scores = createScores();
      scores[0].pool = 20;
      scores[1].pool = 15;
      scores[2].pool = 20;
      expect(isGameOver(scores, 20)).toBe(false);
    });

    it('returns true when all at target', () => {
      const scores = createScores();
      scores[0].pool = 20;
      scores[1].pool = 22;
      scores[2].pool = 20;
      expect(isGameOver(scores, 20)).toBe(true);
    });
  });
});

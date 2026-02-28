import { Suit, Rank, type Card, BidSuit } from '../engine/types';
import { ALL_SUITS } from '../engine/card';

export interface HandEvaluation {
  /** Expected tricks per possible trump suit (including NT) */
  expectedTricks: Record<BidSuit, number>;
  /** High card points (A=4, K=3, Q=2, J=1) */
  highCardPoints: number;
  /** Cards per suit */
  suitLengths: Record<Suit, number>;
  /** How viable misere is (0 = terrible, 1 = great) */
  misereViability: number;
}

const HCP: Partial<Record<Rank, number>> = {
  [Rank.Ace]: 4,
  [Rank.King]: 3,
  [Rank.Queen]: 2,
  [Rank.Jack]: 1,
};

export function evaluateHand(hand: Card[]): HandEvaluation {
  const suitLengths = countSuits(hand);
  const highCardPoints = hand.reduce((sum, c) => sum + (HCP[c.rank] ?? 0), 0);

  const expectedTricks: Record<BidSuit, number> = {
    [BidSuit.Spades]: estimateTricks(hand, Suit.Spades, suitLengths),
    [BidSuit.Clubs]: estimateTricks(hand, Suit.Clubs, suitLengths),
    [BidSuit.Diamonds]: estimateTricks(hand, Suit.Diamonds, suitLengths),
    [BidSuit.Hearts]: estimateTricks(hand, Suit.Hearts, suitLengths),
    [BidSuit.NoTrumps]: estimateTricksNT(hand, suitLengths),
  };

  const misereViability = evaluateMisere(hand, suitLengths);

  return { expectedTricks, highCardPoints, suitLengths, misereViability };
}

function countSuits(hand: Card[]): Record<Suit, number> {
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<Suit, number>;
  for (const c of hand) counts[c.suit]++;
  return counts;
}

function estimateTricks(
  hand: Card[],
  trump: Suit,
  suitLengths: Record<Suit, number>,
): number {
  let tricks = 0;

  // Count tricks in each suit
  for (const suit of ALL_SUITS) {
    const suitCards = hand
      .filter(c => c.suit === suit)
      .sort((a, b) => b.rank - a.rank);

    if (suit === trump) {
      // Trump tricks
      for (let i = 0; i < suitCards.length; i++) {
        const card = suitCards[i];
        if (card.rank === Rank.Ace) tricks += 1.0;
        else if (card.rank === Rank.King && suitCards.length >= 2) tricks += 0.8;
        else if (card.rank === Rank.Queen && suitCards.length >= 3) tricks += 0.5;
        else if (i >= 3) tricks += 0.6; // Long trump bonus
      }
    } else {
      // Side suit tricks
      for (const card of suitCards) {
        if (card.rank === Rank.Ace) tricks += 0.9;
        else if (card.rank === Rank.King && suitCards.length >= 2) tricks += 0.6;
        else if (card.rank === Rank.Queen && suitCards.length >= 3) tricks += 0.3;
      }
      // Void/singleton ruffing potential
      if (suitLengths[suit] === 0 && suitLengths[trump] > 0) tricks += 0.8;
      else if (suitLengths[suit] === 1 && suitLengths[trump] > 1) tricks += 0.4;
    }
  }

  return tricks;
}

function estimateTricksNT(hand: Card[], suitLengths: Record<Suit, number>): number {
  let tricks = 0;

  for (const suit of ALL_SUITS) {
    const suitCards = hand
      .filter(c => c.suit === suit)
      .sort((a, b) => b.rank - a.rank);

    for (let i = 0; i < suitCards.length; i++) {
      const card = suitCards[i];
      if (card.rank === Rank.Ace) tricks += 1.0;
      else if (card.rank === Rank.King && suitCards.length >= 2) tricks += 0.7;
      else if (card.rank === Rank.Queen && suitCards.length >= 3) tricks += 0.4;
      // Long suit establishment
      else if (i >= 3 && suitCards[0].rank >= Rank.King) tricks += 0.4;
    }
  }

  return tricks;
}

function evaluateMisere(hand: Card[], suitLengths: Record<Suit, number>): number {
  let score = 1.0;

  for (const card of hand) {
    // Aces are terrible for misere
    if (card.rank === Rank.Ace) score -= 0.25;
    if (card.rank === Rank.King) score -= 0.15;
    // Low cards are good
    if (card.rank === Rank.Seven) score += 0.05;
    if (card.rank === Rank.Eight) score += 0.03;
  }

  // Long suits are dangerous (more chances to win tricks)
  for (const suit of ALL_SUITS) {
    if (suitLengths[suit] >= 4) score -= 0.15 * (suitLengths[suit] - 3);
  }

  // Voids are good (can't be forced to follow)
  for (const suit of ALL_SUITS) {
    if (suitLengths[suit] === 0) score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/** Find the best trump suit for the hand */
export function bestTrumpSuit(eval_: HandEvaluation): BidSuit {
  let best = BidSuit.Spades;
  let bestTricks = -1;

  for (const suit of [BidSuit.Spades, BidSuit.Clubs, BidSuit.Diamonds, BidSuit.Hearts, BidSuit.NoTrumps]) {
    if (eval_.expectedTricks[suit] > bestTricks) {
      bestTricks = eval_.expectedTricks[suit];
      best = suit;
    }
  }

  return best;
}

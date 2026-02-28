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
  const trumpLen = suitLengths[trump];

  // Count tricks in each suit
  for (const suit of ALL_SUITS) {
    const suitCards = hand
      .filter(c => c.suit === suit)
      .sort((a, b) => b.rank - a.rank);

    if (suit === trump) {
      // Trump tricks: high trumps are near-certain winners
      // With 3+ trumps, even mid trumps win after pulling opponents'
      for (let i = 0; i < suitCards.length; i++) {
        const card = suitCards[i];
        if (card.rank === Rank.Ace) tricks += 1.0;
        else if (card.rank === Rank.King) tricks += trumpLen >= 2 ? 0.95 : 0.6;
        else if (card.rank === Rank.Queen) tricks += trumpLen >= 3 ? 0.85 : 0.4;
        else if (card.rank === Rank.Jack) tricks += trumpLen >= 3 ? 0.7 : 0.3;
        else if (i >= 3) tricks += 0.75; // Long trump: opponents likely out
      }
    } else {
      // Side suit tricks
      for (const card of suitCards) {
        if (card.rank === Rank.Ace) tricks += 0.95;
        else if (card.rank === Rank.King && suitCards.length >= 2) tricks += 0.8;
        else if (card.rank === Rank.Queen && suitCards.length >= 3) tricks += 0.5;
      }
      // Void/singleton ruffing potential
      if (suitLengths[suit] === 0 && trumpLen > 0) tricks += Math.min(trumpLen - 1, 2) * 0.8;
      else if (suitLengths[suit] === 1 && trumpLen > 1) tricks += 0.65;
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
      else if (card.rank === Rank.King && suitCards.length >= 2) tricks += 0.85;
      else if (card.rank === Rank.Queen && suitCards.length >= 3) tricks += 0.6;
      else if (card.rank === Rank.Jack && suitCards.length >= 4) tricks += 0.4;
      // Long suit establishment: with A-K or A-Q heading, low cards can run
      else if (i >= 3 && suitCards[0].rank >= Rank.King) tricks += 0.6;
    }
  }

  return tricks;
}

function evaluateMisere(hand: Card[], suitLengths: Record<Suit, number>): number {
  let score = 0.6; // Start neutral — need positive signals to go above threshold

  for (const card of hand) {
    // High cards are terrible for misere (can win tricks)
    if (card.rank === Rank.Ace) score -= 0.3;
    else if (card.rank === Rank.King) score -= 0.18;
    else if (card.rank === Rank.Queen) score -= 0.1;
    else if (card.rank === Rank.Ten) score -= 0.05;
    // Low cards are good
    else if (card.rank === Rank.Seven) score += 0.06;
    else if (card.rank === Rank.Eight) score += 0.04;
  }

  // Long suits are dangerous (more chances to win tricks)
  for (const suit of ALL_SUITS) {
    if (suitLengths[suit] >= 4) score -= 0.2 * (suitLengths[suit] - 3);
  }

  // Voids are great (can't be forced to follow)
  for (const suit of ALL_SUITS) {
    if (suitLengths[suit] === 0) score += 0.15;
    else if (suitLengths[suit] === 1) {
      // Singleton — good if it's low, terrible if it's high
      const singleton = hand.find(c => c.suit === suit)!;
      if (singleton.rank <= Rank.Nine) score += 0.08;
      else if (singleton.rank >= Rank.King) score -= 0.15;
    }
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

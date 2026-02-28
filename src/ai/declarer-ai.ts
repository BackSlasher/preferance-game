import {
  type Card,
  type WinningBid,
  type SuitBid,
  Suit,
  BidSuit,
} from '../engine/types';
import { cardEquals } from '../engine/card';
import { evaluateHand, bestTrumpSuit } from './hand-evaluation';
import { bidIndex, BID_LADDER } from '../engine/constants';

/**
 * AI chooses which 2 cards to discard from a 12-card hand.
 * Strategy: discard from short off-suits to create voids for ruffing.
 * Keep trump length and high cards in long suits.
 */
export function chooseDiscards(
  hand: Card[],
  winningBid: WinningBid,
): [Card, Card] {
  const trump = winningBid.type === 'misere' ? null :
    winningBid.suit === BidSuit.NoTrumps ? null :
    winningBid.suit as number as Suit;

  // Score each card: lower score = better to discard
  const scored = hand.map(card => ({
    card,
    score: discardScore(card, trump, hand),
  }));

  // Sort by score ascending (lowest = best to discard)
  scored.sort((a, b) => a.score - b.score);

  return [scored[0].card, scored[1].card];
}

function discardScore(card: Card, trump: Suit | null, hand: Card[]): number {
  let score = 0;

  // Never discard trumps
  if (trump !== null && card.suit === trump) {
    score += 100;
  }

  // High cards are valuable to keep
  score += card.rank * 2;

  const suitCount = hand.filter(c => c.suit === card.suit).length;

  if (trump !== null && card.suit !== trump) {
    // With trumps: singletons are great for ruffing — keep them
    if (suitCount === 1) {
      score += 25;
    }
    // Doubletons: discard the low card to create singleton for ruffing
    else if (suitCount === 2) {
      score -= 10;
    }
  } else if (trump === null) {
    // NT or misere: short suits are risky, long suits with high cards are good
    if (suitCount <= 2) {
      score -= 5; // Short suits in NT are weak — discard from them
    }
  }

  return score;
}

/**
 * AI decides whether to raise the contract after seeing the talon.
 * Returns the winning bid (possibly raised) or the original.
 */
export function decideContract(
  hand: Card[],
  winningBid: WinningBid,
): WinningBid {
  if (winningBid.type === 'misere') return winningBid;

  const eval_ = evaluateHand(hand);
  const bestSuit = bestTrumpSuit(eval_);
  const bestExpected = eval_.expectedTricks[bestSuit];

  // Only raise if clearly strong enough
  const currentIdx = bidIndex(winningBid);
  const RAISE_MARGIN = 1.0;

  for (let i = BID_LADDER.length - 1; i > currentIdx; i--) {
    const candidate = BID_LADDER[i];
    if (candidate.type !== 'suit') continue;
    const expected = eval_.expectedTricks[candidate.suit];
    if (expected >= candidate.tricks + RAISE_MARGIN) {
      return candidate;
    }
  }

  // Don't raise
  return winningBid;
}

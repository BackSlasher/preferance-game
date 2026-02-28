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

  // Never discard trumps if possible
  if (trump !== null && card.suit === trump) {
    score += 100;
  }

  // High cards are valuable
  score += card.rank * 2;

  // Cards in short suits are good discard candidates (creating voids)
  const suitCount = hand.filter(c => c.suit === card.suit).length;
  if (suitCount <= 2 && (trump === null || card.suit !== trump)) {
    score -= 20; // Incentivize discarding from short off-suits
  }

  // Singletons in off-suits are great for ruffing — don't discard them
  if (suitCount === 1 && trump !== null && card.suit !== trump) {
    score += 15;
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

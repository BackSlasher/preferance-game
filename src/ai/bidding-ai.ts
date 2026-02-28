import {
  type Card,
  type BidAction,
  type WinningBid,
  type PlayerSeat,
  BidSuit,
} from '../engine/types';
import { isValidBid, getValidBids } from '../engine/bidding';
import { evaluateHand, bestTrumpSuit } from './hand-evaluation';

/**
 * AI decides what to bid.
 * Strategy: bid conservatively — only bid when expected tricks
 * exceed the bid level by a safety margin.
 */
export function decideBid(
  hand: Card[],
  currentHighBid: WinningBid | null,
  seat: PlayerSeat,
  dealer: PlayerSeat,
): BidAction {
  const eval_ = evaluateHand(hand);
  const valid = getValidBids(currentHighBid, seat, dealer);

  // Safety margin: need ~0.5 extra expected tricks above bid level
  const SAFETY = 0.5;

  // Find the best suit and its expected tricks
  const bestSuit = bestTrumpSuit(eval_);
  const bestExpected = eval_.expectedTricks[bestSuit];

  // Consider misere if viable
  if (eval_.misereViability > 0.7) {
    const misereBid: WinningBid = { type: 'misere' };
    if (valid.some(b => b.type === 'misere')) {
      return misereBid;
    }
  }

  // Find the highest bid we're comfortable making
  let bestBid: BidAction = { type: 'pass' };

  for (const bid of valid) {
    if (bid.type === 'pass' || bid.type === 'misere') continue;
    if (bid.type !== 'suit') continue;

    const suitExpected = eval_.expectedTricks[bid.suit];
    if (suitExpected >= bid.tricks + SAFETY) {
      bestBid = bid;
    } else if (bid.suit === bestSuit && bestExpected >= bid.tricks + SAFETY) {
      bestBid = bid;
    }
  }

  // If we can only match but not raise, and we have a decent hand, match
  if (bestBid.type === 'pass' && currentHighBid !== null) {
    // Consider matching the current bid with our best suit
    for (const bid of valid) {
      if (bid.type !== 'suit') continue;
      const expected = eval_.expectedTricks[bid.suit];
      if (expected >= bid.tricks) {
        bestBid = bid;
        break;
      }
    }
  }

  return bestBid;
}

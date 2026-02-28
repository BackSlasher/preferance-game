import {
  type Card,
  type BidAction,
  type WinningBid,
  type PlayerSeat,
  BidSuit,
} from '../engine/types';
import { isValidBid, getValidBids } from '../engine/bidding';
import { evaluateHand, bestTrumpSuit, type HandEvaluation } from './hand-evaluation';

const SUIT_LABELS: Record<number, string> = {
  [BidSuit.Spades]: '♠', [BidSuit.Clubs]: '♣',
  [BidSuit.Diamonds]: '♦', [BidSuit.Hearts]: '♥', [BidSuit.NoTrumps]: 'NT',
};

export function explainBidReasoning(hand: Card[], currentHighBid: WinningBid | null): string {
  const eval_ = evaluateHand(hand);
  const bestSuit = bestTrumpSuit(eval_);
  const lines: string[] = [];
  lines.push(`  HCP=${eval_.highCardPoints}`);
  for (const s of [BidSuit.Spades, BidSuit.Clubs, BidSuit.Diamonds, BidSuit.Hearts, BidSuit.NoTrumps]) {
    lines.push(`  ${SUIT_LABELS[s]}: ${eval_.expectedTricks[s].toFixed(1)} tricks`);
  }
  lines.push(`  Misere viability: ${eval_.misereViability.toFixed(2)}`);
  lines.push(`  Best suit: ${SUIT_LABELS[bestSuit]} (${eval_.expectedTricks[bestSuit].toFixed(1)})`);
  return lines.join('\n');
}

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

  // Safety margin: slight buffer above bid level
  const SAFETY = 0.3;

  // Find the best suit and its expected tricks
  const bestSuit = bestTrumpSuit(eval_);
  const bestExpected = eval_.expectedTricks[bestSuit];

  // Consider misere if viable (high threshold — misere failure is very costly)
  if (eval_.misereViability > 0.85) {
    const misereBid: WinningBid = { type: 'misere' };
    if (valid.some(b => b.type === 'misere')) {
      return misereBid;
    }
  }

  // Find the highest bid we're comfortable making
  let bestBid: BidAction = { type: 'pass' };

  // Opening bid: more willing (just need expected >= tricks)
  // Competing bid: need safety margin on top
  const isOpening = currentHighBid === null;
  const margin = isOpening ? 0 : SAFETY;

  for (const bid of valid) {
    if (bid.type === 'pass' || bid.type === 'misere') continue;
    if (bid.type !== 'suit') continue;

    const suitExpected = eval_.expectedTricks[bid.suit];
    if (suitExpected >= bid.tricks + margin) {
      bestBid = bid;
    } else if (bid.suit === bestSuit && bestExpected >= bid.tricks + margin) {
      bestBid = bid;
    }
  }

  return bestBid;
}

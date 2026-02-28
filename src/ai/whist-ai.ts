import {
  type Card,
  type Contract,
  type PlayerSeat,
  type WhistDecision,
  Suit,
  BidSuit,
} from '../engine/types';
import { evaluateHand } from './hand-evaluation';
import { whistObligation, contractValue } from '../engine/scoring';

/**
 * AI decides whether to whist or pass.
 * Strategy: whist when expected defensive tricks meet the obligation,
 * considering the contract level and risk.
 */
export function decideWhist(
  hand: Card[],
  contract: Contract,
  partnerDecision: WhistDecision | undefined,
): WhistDecision {
  const eval_ = evaluateHand(hand);
  const obligation = whistObligation(contract.bid);
  const value = contractValue(contract.bid);

  // Estimate defensive tricks
  const defTricks = estimateDefensiveTricks(hand, contract.trump);

  // If partner already whisted, we can be more conservative
  if (partnerDecision === 'whist') {
    // Partner is already committed. Whist only if we have decent cards
    return defTricks >= 1 ? 'whist' : 'pass';
  }

  // If partner passed, we bear full responsibility
  if (partnerDecision === 'pass') {
    // Need to meet full obligation alone (with partner's passive help)
    return defTricks >= obligation * 0.5 ? 'whist' : 'pass';
  }

  // First to decide — be moderately aggressive
  // On 6-contracts (obligation=4), need solid defense
  // On 7+ (obligation <=2), be more willing to whist
  if (obligation <= 2) {
    return defTricks >= 1 ? 'whist' : 'pass';
  }

  return defTricks >= obligation * 0.4 ? 'whist' : 'pass';
}

function estimateDefensiveTricks(hand: Card[], trump: Suit | null): number {
  let tricks = 0;

  // Count high cards by suit context
  const suitCounts: Record<number, number> = {};
  for (const card of hand) {
    suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
  }

  for (const card of hand) {
    const len = suitCounts[card.suit] ?? 0;
    if (card.rank === 14) tricks += 0.9; // Ace
    else if (card.rank === 13) tricks += 0.4; // King
    else if (card.rank === 12 && len >= 2) tricks += 0.25; // Queen with support
    else if (card.rank === 11 && len >= 3) tricks += 0.1; // Jack with length
  }

  // Trump holdings on defense
  if (trump !== null) {
    const trumpCount = hand.filter(c => c.suit === trump).length;
    if (trumpCount >= 3) tricks += 0.6;
    else if (trumpCount >= 2) tricks += 0.3;
  }

  return tricks;
}

import {
  type BidAction,
  type WinningBid,
  type PlayerSeat,
  type SuitBid,
  BidSuit,
} from './types';
import { bidIndex, BID_LADDER } from './constants';
import { eldestHand } from './deck';

/**
 * Check if a bid action is valid given the current state.
 *
 * Rules:
 * - Pass is always valid (if player hasn't already passed).
 * - Eldest hand can MATCH the current high bid.
 * - Younger hands must STRICTLY raise above the current high bid.
 */
export function isValidBid(
  action: BidAction,
  currentHighBid: WinningBid | null,
  seat: PlayerSeat,
  dealer: PlayerSeat,
): boolean {
  if (action.type === 'pass') return true;

  const bid = action as WinningBid;
  const newIdx = bidIndex(bid);
  if (newIdx === -1) return false; // Invalid bid

  if (currentHighBid === null) return true; // First bid, anything goes

  const curIdx = bidIndex(currentHighBid);
  const eldest = eldestHand(dealer);

  if (seat === eldest) {
    // Eldest hand can match
    return newIdx >= curIdx;
  }
  // Younger hands must strictly raise
  return newIdx > curIdx;
}

/**
 * Get all valid bids a player can make given the current state.
 * Always includes 'pass'. Includes all bids at or above the minimum threshold.
 */
export function getValidBids(
  currentHighBid: WinningBid | null,
  seat: PlayerSeat,
  dealer: PlayerSeat,
): BidAction[] {
  const valid: BidAction[] = [{ type: 'pass' }];

  for (const bid of BID_LADDER) {
    if (isValidBid(bid, currentHighBid, seat, dealer)) {
      valid.push(bid);
    }
  }

  return valid;
}

/**
 * Resolve the bidding: determine who won and with what bid.
 * Returns null if all three passed (raspasovka).
 */
export function resolveBidding(
  bids: { seat: PlayerSeat; action: BidAction }[],
): { winner: PlayerSeat; bid: WinningBid } | null {
  let highBid: WinningBid | null = null;
  let highBidder: PlayerSeat | null = null;

  for (const { seat, action } of bids) {
    if (action.type === 'pass') continue;
    const bid = action as WinningBid;
    if (highBid === null || bidIndex(bid) >= bidIndex(highBid)) {
      highBid = bid;
      highBidder = seat;
    }
  }

  if (highBid === null || highBidder === null) return null;
  return { winner: highBidder, bid: highBid };
}

/**
 * Check if bidding is complete.
 * Bidding ends when all players have passed, or when one bid is
 * followed by passes from all other active (non-passed) players.
 */
export function isBiddingComplete(
  passedPlayers: PlayerSeat[],
  highBid: WinningBid | null,
): boolean {
  // All three passed = raspasovka
  if (passedPlayers.length === 3) return true;
  // Two passed and there's a bid = winner
  if (passedPlayers.length === 2 && highBid !== null) return true;
  return false;
}

/** Get valid contracts the declarer can declare (>= winning bid) */
export function getValidContracts(winningBid: WinningBid): WinningBid[] {
  const minIdx = bidIndex(winningBid);
  return BID_LADDER.filter((_, i) => i >= minIdx);
}

/** Convert BidSuit to a playing Suit (or null for NoTrumps) */
export function bidSuitToTrump(bidSuit: BidSuit): number | null {
  if (bidSuit === BidSuit.NoTrumps) return null;
  return bidSuit; // BidSuit.Spades=0 matches Suit.Spades=0, etc.
}

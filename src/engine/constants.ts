import { BidSuit, type SuitBid, type WinningBid } from './types';

/** Contract point values indexed by trick count (6–10) */
export const CONTRACT_VALUES: Record<number, number> = {
  6: 2,
  7: 4,
  8: 6,
  9: 8,
  10: 10,
};

export const MISERE_VALUE = 10;

/** Minimum tricks defenders must collectively take when whisting */
export const WHIST_OBLIGATIONS: Record<number, number> = {
  6: 4,
  7: 2,
  8: 1,
  9: 1,
  10: 0, // No whisting on 10-contracts
};

/**
 * Complete bid ladder in ascending order.
 * Each entry is either a SuitBid or MisereBid.
 * Index in this array = bid strength.
 */
export function buildBidLadder(): WinningBid[] {
  const ladder: WinningBid[] = [];

  for (let tricks = 6; tricks <= 10; tricks++) {
    for (const suit of [BidSuit.Spades, BidSuit.Clubs, BidSuit.Diamonds, BidSuit.Hearts, BidSuit.NoTrumps]) {
      // Insert misere after 8NT
      if (tricks === 9 && suit === BidSuit.Spades) {
        ladder.push({ type: 'misere' });
      }
      ladder.push({ type: 'suit', tricks, suit });
    }
  }

  return ladder;
}

export const BID_LADDER = buildBidLadder();

/** Get the numeric index (strength) of a bid in the ladder */
export function bidIndex(bid: WinningBid): number {
  if (bid.type === 'misere') {
    return BID_LADDER.findIndex(b => b.type === 'misere');
  }
  return BID_LADDER.findIndex(
    b => b.type === 'suit' && b.tricks === bid.tricks && b.suit === bid.suit
  );
}

/** Raspasovka multiplier progression */
export const RASPASOVKA_MULTIPLIERS = [1, 2, 3];

/** Maximum consecutive raspasovka multiplier */
export const MAX_RASPASOVKA_MULTIPLIER = 3;

/** Pool target default */
export const DEFAULT_POOL_TARGET = 20;

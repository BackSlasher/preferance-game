<script lang="ts">
  import { BidSuit, type BidAction, type WinningBid, type SuitBid, type MisereBid } from '../engine/types';
  import { getValidBids } from '../engine/bidding';
  import { suitSymbol } from '../engine/card';
  import type { PlayerSeat } from '../engine/types';

  interface Props {
    currentHighBid: WinningBid | null;
    seat: PlayerSeat;
    dealer: PlayerSeat;
    onBid: (bid: BidAction) => void;
  }

  let { currentHighBid, seat, dealer, onBid }: Props = $props();

  const validBids = $derived(getValidBids(currentHighBid, seat, dealer));

  const suitLabels: Record<number, string> = {
    [BidSuit.Spades]: '♠',
    [BidSuit.Clubs]: '♣',
    [BidSuit.Diamonds]: '♦',
    [BidSuit.Hearts]: '♥',
    [BidSuit.NoTrumps]: 'NT',
  };

  const suitColors: Record<number, string> = {
    [BidSuit.Spades]: '#1a1a2e',
    [BidSuit.Clubs]: '#1a1a2e',
    [BidSuit.Diamonds]: '#c41e3a',
    [BidSuit.Hearts]: '#c41e3a',
    [BidSuit.NoTrumps]: '#d4a843',
  };

  function isBidValid(tricks: number, suit: BidSuit): boolean {
    return validBids.some(
      b => b.type === 'suit' && (b as SuitBid).tricks === tricks && (b as SuitBid).suit === suit
    );
  }

  function isMisereValid(): boolean {
    return validBids.some(b => b.type === 'misere');
  }
</script>

<div class="bidding-panel">
  <div class="bid-label">Your Bid</div>

  <div class="bid-grid">
    <!-- Header row -->
    <div class="bid-header"></div>
    {#each [BidSuit.Spades, BidSuit.Clubs, BidSuit.Diamonds, BidSuit.Hearts, BidSuit.NoTrumps] as suit}
      <div class="bid-header" style="color: {suitColors[suit]}">{suitLabels[suit]}</div>
    {/each}

    <!-- Bid rows (6–10) -->
    {#each [6, 7, 8, 9, 10] as tricks}
      <div class="bid-row-label">{tricks}</div>
      {#each [BidSuit.Spades, BidSuit.Clubs, BidSuit.Diamonds, BidSuit.Hearts, BidSuit.NoTrumps] as suit}
        <button
          class="bid-btn"
          class:valid={isBidValid(tricks, suit)}
          disabled={!isBidValid(tricks, suit)}
          style="color: {suitColors[suit]}"
          onclick={() => onBid({ type: 'suit', tricks, suit })}
        >
          {tricks}{suitLabels[suit]}
        </button>
      {/each}
    {/each}
  </div>

  <div class="bid-actions">
    <button
      class="action-btn misere-btn"
      class:valid={isMisereValid()}
      disabled={!isMisereValid()}
      onclick={() => onBid({ type: 'misere' })}
    >
      Misere
    </button>
    <button
      class="action-btn pass-btn"
      onclick={() => onBid({ type: 'pass' })}
    >
      Pass
    </button>
  </div>
</div>

<style>
  .bidding-panel {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(8px);
  }

  .bid-label {
    text-align: center;
    font-weight: bold;
    color: var(--gold);
    margin-bottom: 8px;
    font-size: 0.9em;
  }

  .bid-grid {
    display: grid;
    grid-template-columns: 28px repeat(5, 1fr);
    gap: 3px;
    margin-bottom: 8px;
  }

  .bid-header {
    text-align: center;
    font-weight: bold;
    font-size: 0.9em;
    padding: 2px;
  }

  .bid-row-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8em;
    color: var(--text-muted);
  }

  .bid-btn {
    padding: 6px 2px;
    border-radius: 4px;
    font-size: 0.7em;
    font-weight: bold;
    background: rgba(255,255,255,0.1);
    color: var(--text-muted);
    min-height: 32px;
    transition: all 0.15s;
  }

  .bid-btn.valid {
    background: rgba(255,255,255,0.2);
    color: var(--card-white);
  }

  .bid-btn.valid:hover {
    background: rgba(255,255,255,0.35);
  }

  .bid-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .bid-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 0.9em;
    min-height: 44px;
  }

  .pass-btn {
    background: rgba(200, 60, 60, 0.7);
    color: white;
  }

  .pass-btn:hover {
    background: rgba(200, 60, 60, 0.9);
  }

  .misere-btn {
    background: rgba(100, 60, 180, 0.7);
    color: white;
  }

  .misere-btn.valid:hover {
    background: rgba(100, 60, 180, 0.9);
  }

  .misere-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>

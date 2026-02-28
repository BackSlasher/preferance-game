<script lang="ts">
  import { type WinningBid, BidSuit } from '../engine/types';
  import { getValidContracts } from '../engine/bidding';
  import { suitSymbol } from '../engine/card';

  interface Props {
    winningBid: WinningBid;
    onDeclare: (bid: WinningBid) => void;
  }

  let { winningBid, onDeclare }: Props = $props();

  const validContracts = $derived(getValidContracts(winningBid));

  function bidLabel(bid: WinningBid): string {
    if (bid.type === 'misere') return 'Misere';
    const suitLabels: Record<number, string> = {
      [BidSuit.Spades]: '♠', [BidSuit.Clubs]: '♣',
      [BidSuit.Diamonds]: '♦', [BidSuit.Hearts]: '♥',
      [BidSuit.NoTrumps]: 'NT',
    };
    return `${bid.tricks}${suitLabels[bid.suit]}`;
  }
</script>

<div class="contract-panel">
  <div class="panel-label">Declare Contract</div>
  <div class="panel-hint">Choose your final contract (≥ your winning bid)</div>

  <div class="contract-options">
    <!-- Show winning bid as the obvious first choice -->
    <button
      class="contract-btn primary"
      onclick={() => onDeclare(winningBid)}
    >
      {bidLabel(winningBid)}
    </button>

    <!-- Show a few raise options if available -->
    {#each validContracts.slice(1, 6) as bid}
      <button
        class="contract-btn"
        onclick={() => onDeclare(bid)}
      >
        {bidLabel(bid)}
      </button>
    {/each}
  </div>
</div>

<style>
  .contract-panel {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(8px);
  }

  .panel-label {
    text-align: center;
    font-weight: bold;
    color: var(--gold);
    margin-bottom: 4px;
  }

  .panel-hint {
    text-align: center;
    font-size: 0.8em;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  .contract-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }

  .contract-btn {
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 0.95em;
    background: rgba(255,255,255,0.15);
    color: var(--card-white);
    min-height: 44px;
  }

  .contract-btn:hover {
    background: rgba(255,255,255,0.3);
  }

  .contract-btn.primary {
    background: rgba(40, 160, 80, 0.8);
  }

  .contract-btn.primary:hover {
    background: rgba(40, 160, 80, 1);
  }
</style>

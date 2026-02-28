<script lang="ts">
  import type { Card } from '../engine/types';

  interface Props {
    selectedCount: number;
    onConfirm: () => void;
  }

  let { selectedCount, onConfirm }: Props = $props();
</script>

<div class="discard-panel">
  <div class="discard-label">Discard 2 Cards</div>
  <div class="discard-hint">
    {#if selectedCount === 0}
      Tap 2 cards to discard
    {:else if selectedCount === 1}
      Select 1 more card
    {:else}
      Ready to discard
    {/if}
  </div>
  {#if selectedCount === 2}
    <button class="confirm-btn" onclick={onConfirm}>
      Confirm Discard
    </button>
  {/if}
</div>

<style>
  .discard-panel {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(8px);
    text-align: center;
  }

  .discard-label {
    font-weight: bold;
    color: var(--gold);
    margin-bottom: 4px;
  }

  .discard-hint {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .confirm-btn {
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: bold;
    background: rgba(40, 160, 80, 0.8);
    color: white;
    min-height: 44px;
    font-size: 1em;
  }

  .confirm-btn:hover {
    background: rgba(40, 160, 80, 1);
  }
</style>

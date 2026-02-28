<script lang="ts">
  import type { Contract } from '../engine/types';
  import { contractValue, whistObligation } from '../engine/scoring';
  import { suitSymbol } from '../engine/card';

  interface Props {
    contract: Contract;
    onDecision: (decision: 'whist' | 'pass') => void;
  }

  let { contract, onDecision }: Props = $props();

  const value = $derived(contractValue(contract.bid));
  const obligation = $derived(whistObligation(contract.bid));

  const contractLabel = $derived(
    contract.bid.type === 'misere' ? 'Misere' :
    `${contract.bid.tricks}${contract.trump !== null ? suitSymbol(contract.trump) : 'NT'}`
  );
</script>

<div class="whist-panel">
  <div class="whist-info">
    <div class="contract-label">Contract: {contractLabel}</div>
    <div class="obligation">Defenders need {obligation} tricks</div>
  </div>
  <div class="whist-buttons">
    <button class="whist-btn whist" onclick={() => onDecision('whist')}>
      Whist
    </button>
    <button class="whist-btn pass" onclick={() => onDecision('pass')}>
      Pass
    </button>
  </div>
</div>

<style>
  .whist-panel {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(8px);
  }

  .whist-info {
    text-align: center;
    margin-bottom: 10px;
  }

  .contract-label {
    font-weight: bold;
    font-size: 1.1em;
    color: var(--gold);
  }

  .obligation {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .whist-buttons {
    display: flex;
    gap: 10px;
  }

  .whist-btn {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1em;
    min-height: 48px;
  }

  .whist-btn.whist {
    background: rgba(40, 160, 80, 0.8);
    color: white;
  }

  .whist-btn.whist:hover {
    background: rgba(40, 160, 80, 1);
  }

  .whist-btn.pass {
    background: rgba(200, 60, 60, 0.7);
    color: white;
  }

  .whist-btn.pass:hover {
    background: rgba(200, 60, 60, 0.9);
  }
</style>

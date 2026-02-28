<script lang="ts">
  import type { PlayerScore } from '../engine/types';

  interface Props {
    name: string;
    score: PlayerScore;
    isActive: boolean;
    isDealer: boolean;
    isDeclarer: boolean;
    contractLabel: string;
    trickCount: number;
  }

  let { name, score, isActive, isDealer, isDeclarer, contractLabel, trickCount }: Props = $props();
</script>

<div class="player-info" class:active={isActive} class:declarer={isDeclarer}>
  <div class="player-name">
    {name}
    {#if isDealer}<span class="dealer-badge">D</span>{/if}
    {#if isDeclarer}<span class="declarer-badge">★</span>{/if}
  </div>
  {#if isDeclarer && contractLabel}
    <div class="contract-label">{contractLabel}</div>
  {/if}
  <div class="player-stats">
    <span class="stat pool" title="Pool">{score.pool}</span>
    <span class="stat-sep">/</span>
    <span class="stat dump" title="Dump">{score.dump}</span>
    <span class="stat-sep">·</span>
    <span class="stat tricks" title="Tricks this hand">{trickCount}t</span>
  </div>
</div>

<style>
  .player-info {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 6px 10px;
    text-align: center;
    min-width: 80px;
    transition: outline 0.2s;
  }

  .player-info.active {
    outline: 2px solid var(--gold);
  }

  .player-info.declarer {
    background: rgba(212, 168, 67, 0.15);
    outline: 1px solid rgba(212, 168, 67, 0.4);
  }

  .player-info.declarer.active {
    outline: 2px solid var(--gold);
  }

  .player-name {
    font-weight: bold;
    font-size: 0.85em;
    margin-bottom: 2px;
  }

  .declarer-badge {
    color: var(--gold);
    font-size: 0.7em;
    margin-left: 3px;
    vertical-align: middle;
  }

  .contract-label {
    font-size: 0.75em;
    color: var(--gold);
    font-weight: bold;
    margin-bottom: 2px;
  }

  .dealer-badge {
    display: inline-block;
    background: var(--gold);
    color: #1a1a2e;
    width: 16px;
    height: 16px;
    line-height: 16px;
    border-radius: 50%;
    font-size: 0.7em;
    margin-left: 4px;
    vertical-align: middle;
  }

  .player-stats {
    font-size: 0.75em;
    color: var(--text-muted);
  }

  .stat.pool { color: #4caf50; }
  .stat.dump { color: #f44336; }
  .stat.tricks { color: var(--text-light); }
  .stat-sep { margin: 0 2px; opacity: 0.5; }
</style>

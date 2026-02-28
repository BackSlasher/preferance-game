<script lang="ts">
  import { type PlayerScore, ALL_SEATS } from '../engine/types';

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

  const totalWhists = $derived(ALL_SEATS.reduce((sum, s) => sum + (score.whists[s] ?? 0), 0));
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
    <span class="stat pool"><span class="label">P</span>{score.pool}</span>
    <span class="stat dump"><span class="label">D</span>{score.dump}</span>
    <span class="stat whist"><span class="label">W</span>{totalWhists}</span>
    <span class="stat tricks">{trickCount}t</span>
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
    display: flex;
    gap: 6px;
    justify-content: center;
    font-size: 0.7em;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 1px;
  }

  .label {
    font-size: 0.8em;
    opacity: 0.6;
    margin-right: 1px;
  }

  .stat.pool { color: #4caf50; }
  .stat.dump { color: #f44336; }
  .stat.whist { color: #90caf9; }
  .stat.tricks { color: var(--text-muted); }
</style>

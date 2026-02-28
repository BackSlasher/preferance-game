<script lang="ts">
  import { PlayerSeat, type Trick } from '../engine/types';
  import CardComponent from './Card.svelte';

  interface Props {
    trick: Trick | null;
    lastTrick?: Trick | null;
  }

  let { trick, lastTrick }: Props = $props();

  const NAMES: Record<number, string> = {
    [PlayerSeat.South]: 'You',
    [PlayerSeat.West]: 'West',
    [PlayerSeat.East]: 'East',
  };

  // Position cards based on who played them
  function positionStyle(seat: number): string {
    switch (seat) {
      case 0: return 'bottom: 0; left: 50%; transform: translateX(-50%)';
      case 1: return 'top: 50%; left: 0; transform: translateY(-50%)';
      case 2: return 'top: 50%; right: 0; transform: translateY(-50%)';
      default: return '';
    }
  }

  // Arrow pointing toward the winner
  function winnerArrow(seat: number): string {
    switch (seat) {
      case 0: return '↓';
      case 1: return '←';
      case 2: return '→';
      default: return '';
    }
  }

  // Show the completed last trick briefly when current trick is empty
  const showLastTrick = $derived(
    trick && trick.plays.length === 0 && lastTrick && lastTrick.winner !== undefined
  );
  const displayTrick = $derived(
    trick && trick.plays.length > 0
      ? trick
      : showLastTrick ? lastTrick : null
  );
  const winner = $derived(displayTrick?.winner);
  const isCompleted = $derived(displayTrick?.plays.length === 3 && winner !== undefined);
</script>

<div class="trick-area">
  {#if displayTrick}
    {#each displayTrick.plays as play}
      <div
        class="trick-card"
        class:collecting={isCompleted}
        style={positionStyle(play.seat)}
      >
        <CardComponent card={play.card} faceUp={true} small={true} />
      </div>
    {/each}

    {#if isCompleted && winner !== undefined}
      <div class="trick-winner">
        <span class="winner-arrow">{winnerArrow(winner)}</span>
        <span class="winner-name">{NAMES[winner]}</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .trick-area {
    position: relative;
    width: 160px;
    height: 120px;
    margin: 8px auto;
  }

  .trick-card {
    position: absolute;
    transition: all 0.3s ease;
  }

  .trick-card.collecting {
    opacity: 0.7;
    transition: all 0.4s ease;
  }

  .trick-winner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.75);
    color: var(--gold, #d4a843);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: bold;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .winner-arrow {
    font-size: 1.1em;
  }
</style>

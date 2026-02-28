<script lang="ts">
  import { Suit, Rank, type Card } from '../engine/types';
  import { rankName, suitSymbol, isRedSuit } from '../engine/card';

  interface Props {
    card: Card;
    faceUp?: boolean;
    selected?: boolean;
    playable?: boolean;
    small?: boolean;
    onclick?: () => void;
  }

  let { card, faceUp = true, selected = false, playable = false, small = false, onclick }: Props = $props();

  const rank = $derived(rankName(card.rank));
  const suit = $derived(suitSymbol(card.suit));
  const red = $derived(isRedSuit(card.suit));
</script>

{#if faceUp}
  <button
    class="card"
    class:selected
    class:playable
    class:small
    class:red
    disabled={!playable && !onclick}
    onclick={onclick}
  >
    <span class="card-corner top-left">
      <span class="card-rank">{rank}</span>
      <span class="card-suit">{suit}</span>
    </span>
    <span class="card-center">{suit}</span>
    <span class="card-corner bottom-right">
      <span class="card-rank">{rank}</span>
      <span class="card-suit">{suit}</span>
    </span>
  </button>
{:else}
  <div class="card card-back" class:small>
    <span class="card-back-pattern">♠♥♦♣</span>
  </div>
{/if}

<style>
  .card {
    position: relative;
    width: var(--card-width, 60px);
    height: var(--card-height, 90px);
    background: var(--card-white, #fefefe);
    border-radius: var(--card-radius, 6px);
    border: 1px solid #ccc;
    box-shadow: 0 2px 4px var(--card-shadow, rgba(0,0,0,0.3));
    color: var(--black-suit, #1a1a2e);
    font-family: 'Georgia', serif;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card.red {
    color: var(--red-suit, #c41e3a);
  }

  .card.playable {
    cursor: pointer;
    box-shadow: 0 0 8px 2px rgba(212, 168, 67, 0.6), 0 2px 4px var(--card-shadow, rgba(0,0,0,0.3));
    border-color: var(--gold, #d4a843);
    animation: glow-pulse 1.5s ease-in-out infinite alternate;
  }

  @keyframes glow-pulse {
    from { box-shadow: 0 0 6px 1px rgba(212, 168, 67, 0.4), 0 2px 4px var(--card-shadow, rgba(0,0,0,0.3)); }
    to   { box-shadow: 0 0 12px 3px rgba(212, 168, 67, 0.7), 0 2px 4px var(--card-shadow, rgba(0,0,0,0.3)); }
  }

  .card.playable:hover {
    transform: translateY(-8px);
    box-shadow: 0 0 14px 4px rgba(212, 168, 67, 0.8), 0 6px 12px rgba(0,0,0,0.4);
    animation: none;
  }

  .card.selected {
    transform: translateY(-16px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.5);
    outline: 2px solid var(--gold, #d4a843);
  }

  .card.small {
    width: calc(var(--card-width, 60px) * 0.7);
    height: calc(var(--card-height, 90px) * 0.7);
    font-size: 0.7em;
  }

  .card-corner {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    font-size: 0.65em;
  }

  .top-left {
    top: 3px;
    left: 4px;
  }

  .bottom-right {
    bottom: 3px;
    right: 4px;
    transform: rotate(180deg);
  }

  .card-rank {
    font-weight: bold;
    font-size: 1.3em;
  }

  .card-suit {
    font-size: 1em;
  }

  .card-center {
    font-size: 1.8em;
  }

  .card-back {
    background: linear-gradient(135deg, #1a4a8a, #2a6aba);
    border: 2px solid #0e3060;
    color: rgba(255,255,255,0.15);
    overflow: hidden;
  }

  .card-back-pattern {
    font-size: 1em;
    letter-spacing: 2px;
  }
</style>

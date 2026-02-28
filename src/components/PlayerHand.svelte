<script lang="ts">
  import type { Card } from '../engine/types';
  import CardComponent from './Card.svelte';

  interface Props {
    cards: Card[];
    playableCards?: Card[];
    selectedCards?: Card[];
    onCardClick?: (card: Card) => void;
  }

  let { cards, playableCards = [], selectedCards = [], onCardClick }: Props = $props();

  function isPlayable(card: Card): boolean {
    return playableCards.some(c => c.suit === card.suit && c.rank === card.rank);
  }

  function isSelected(card: Card): boolean {
    return selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
  }

  const spreadAngle = $derived(Math.min(6, 60 / Math.max(cards.length, 1)));
</script>

<div class="player-hand">
  {#each cards as card, i}
    {@const offset = i - (cards.length - 1) / 2}
    {@const rotation = offset * spreadAngle}
    {@const yShift = Math.abs(offset) * 2.5}
    <div
      class="card-slot"
      style="transform: rotate({rotation}deg) translateY({yShift}px); z-index: {i}"
    >
      <CardComponent
        {card}
        faceUp={true}
        playable={isPlayable(card)}
        selected={isSelected(card)}
        onclick={() => onCardClick?.(card)}
      />
    </div>
  {/each}
</div>

<style>
  .player-hand {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: 8px 4px;
    min-height: calc(var(--card-height, 90px) + 32px);
  }

  .card-slot {
    margin: 0 -12px;
    transform-origin: bottom center;
    transition: transform 0.2s ease;
  }
</style>

<script lang="ts">
  import type { Card } from '../engine/types';
  import CardComponent from './Card.svelte';
  import { Suit, Rank } from '../engine/types';

  interface Props {
    cardCount: number;
    cards?: Card[];
    faceUp?: boolean;
    position: 'left' | 'right';
  }

  let { cardCount, cards, faceUp = false, position }: Props = $props();

  // Dummy card for face-down display
  const dummyCard = { suit: Suit.Spades, rank: Rank.Seven };
</script>

<div class="opponent-hand {position}">
  <div class="cards-row">
    {#each Array(cardCount) as _, i}
      <div class="card-slot" style="z-index: {i}">
        <CardComponent
          card={faceUp && cards ? cards[i] : dummyCard}
          faceUp={faceUp && !!cards}
          small={true}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .opponent-hand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .cards-row {
    display: flex;
    justify-content: center;
  }

  .card-slot {
    margin: 0 -8px;
  }

  .left {
    align-self: flex-start;
  }

  .right {
    align-self: flex-end;
  }
</style>

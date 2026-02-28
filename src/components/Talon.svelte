<script lang="ts">
  import type { Card } from '../engine/types';
  import { Suit, Rank } from '../engine/types';
  import CardComponent from './Card.svelte';

  interface Props {
    cards: Card[];
    revealed: boolean;
  }

  let { cards, revealed }: Props = $props();

  const dummyCard = { suit: Suit.Spades, rank: Rank.Seven };
</script>

<div class="talon">
  {#each cards as card, i}
    <div class="talon-card">
      <CardComponent
        card={revealed ? card : dummyCard}
        faceUp={revealed}
        small={true}
      />
    </div>
  {/each}
</div>

<style>
  .talon {
    display: flex;
    gap: 8px;
    justify-content: center;
    padding: 4px;
  }

  .talon-card {
    transition: transform 0.3s ease;
  }
</style>

<script lang="ts">
  import { GamePhase } from './engine/types';
  import { getState, startNewGame } from './state/game-store.svelte';
  import GameTable from './components/GameTable.svelte';
  import MenuScreen from './components/MenuScreen.svelte';

  const state = $derived(getState());
  const inGame = $derived(state.phase !== GamePhase.NotStarted);

  function handleNewGame() {
    startNewGame();
  }
</script>

<main>
  {#if inGame}
    <GameTable />
  {:else}
    <MenuScreen onNewGame={handleNewGame} />
  {/if}
</main>

<style>
  main {
    height: 100%;
  }
</style>

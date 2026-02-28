<script lang="ts">
  import { GamePhase } from './engine/types';
  import { getState, startNewGame } from './state/game-store.svelte';
  import GameTable from './components/GameTable.svelte';
  import MenuScreen from './components/MenuScreen.svelte';
  import Instructions from './components/Instructions.svelte';
  import Settings from './components/Settings.svelte';

  const state = $derived(getState());
  const inGame = $derived(state.phase !== GamePhase.NotStarted);

  let path = $state(window.location.pathname);

  function navigate(to: string) {
    history.pushState(null, '', to);
    path = to;
  }

  $effect(() => {
    const onPopState = () => { path = window.location.pathname; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  function handleNewGame() {
    if (path !== '/') navigate('/');
    startNewGame();
  }

  function handleHowToPlay() {
    navigate('/instructions');
  }

  function handleSettings() {
    navigate('/settings');
  }

  function handleBack() {
    history.back();
  }
</script>

<main>
  {#if path === '/instructions'}
    <Instructions onBack={handleBack} />
  {:else if path === '/settings'}
    <Settings onBack={handleBack} />
  {:else if inGame}
    <GameTable />
  {:else}
    <MenuScreen onNewGame={handleNewGame} onHowToPlay={handleHowToPlay} onSettings={handleSettings} />
  {/if}
</main>

<style>
  main {
    height: 100%;
  }
</style>

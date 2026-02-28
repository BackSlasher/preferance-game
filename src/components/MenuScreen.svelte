<script lang="ts">
  interface Props {
    onNewGame: () => void;
    onHowToPlay: () => void;
  }

  let { onNewGame, onHowToPlay }: Props = $props();
</script>

<div class="menu-screen">
  <div class="menu-content">
    <h1 class="title">Преферанс</h1>
    <p class="subtitle">Preferance</p>
    <p class="variant">Sochi variant · 3 players</p>

    <button class="start-btn" onclick={onNewGame}>
      New Game
    </button>

    <button class="howto-btn" onclick={onHowToPlay}>
      How to Play
    </button>

    <div class="rules-summary">
      <p>32 cards · Pool to 20</p>
      <p>Mandatory whist on 6♠</p>
      <p>Greedy whist · Selfish misere</p>
    </div>
  </div>
</div>

<style>
  .menu-screen {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, var(--felt-light), var(--felt-dark));
  }

  .menu-content {
    text-align: center;
    padding: 32px;
  }

  .title {
    font-size: 2.5em;
    color: var(--gold);
    margin-bottom: 4px;
    font-family: 'Georgia', serif;
  }

  .subtitle {
    font-size: 1.1em;
    color: var(--text-light);
    margin-bottom: 4px;
    opacity: 0.8;
  }

  .variant {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-bottom: 32px;
  }

  .start-btn {
    padding: 14px 48px;
    border-radius: 12px;
    font-size: 1.2em;
    font-weight: bold;
    background: var(--gold);
    color: #1a1a2e;
    min-height: 52px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.5);
  }

  .start-btn:active {
    transform: translateY(0);
  }

  .howto-btn {
    display: block;
    margin: 12px auto 0;
    padding: 10px 32px;
    border-radius: 10px;
    font-size: 1em;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-light);
    min-height: 44px;
    transition: background 0.15s;
  }

  .howto-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  .rules-summary {
    margin-top: 32px;
    font-size: 0.8em;
    color: var(--text-muted);
    line-height: 1.8;
  }
</style>

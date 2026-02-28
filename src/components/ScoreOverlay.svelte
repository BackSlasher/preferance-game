<script lang="ts">
  import { type PlayerScore, type PlayerSeat, ALL_SEATS } from '../engine/types';

  interface Props {
    scores: Record<PlayerSeat, PlayerScore>;
    names: Record<PlayerSeat, string>;
    onContinue: () => void;
  }

  let { scores, names, onContinue }: Props = $props();
</script>

<div class="overlay-backdrop" role="button" tabindex="-1" onclick={onContinue} onkeydown={(e) => e.key === 'Escape' && onContinue()}>
  <div class="score-overlay" role="dialog" aria-label="Hand results" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
    <h2>Hand Complete</h2>

    <table class="score-table">
      <thead>
        <tr>
          <th>Player</th>
          <th class="pool">Pool</th>
          <th class="dump">Dump</th>
        </tr>
      </thead>
      <tbody>
        {#each ALL_SEATS as seat}
          <tr>
            <td>{names[seat]}</td>
            <td class="pool">{scores[seat].pool}</td>
            <td class="dump">{scores[seat].dump}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <button class="continue-btn" onclick={onContinue}>
      Next Hand
    </button>
  </div>
</div>

<style>
  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .score-overlay {
    background: rgba(20, 60, 30, 0.95);
    border: 2px solid var(--gold);
    border-radius: 16px;
    padding: 20px;
    min-width: 280px;
    max-width: 90vw;
    text-align: center;
  }

  h2 {
    color: var(--gold);
    margin-bottom: 16px;
    font-size: 1.2em;
  }

  .score-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }

  .score-table th, .score-table td {
    padding: 6px 10px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .score-table th {
    color: var(--text-muted);
    font-size: 0.85em;
  }

  .pool { color: #4caf50; }
  .dump { color: #f44336; }

  .continue-btn {
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1em;
    background: rgba(40, 160, 80, 0.8);
    color: white;
    min-height: 44px;
  }

  .continue-btn:hover {
    background: rgba(40, 160, 80, 1);
  }
</style>

<script lang="ts">
  import { getSettings, updateSettings } from '../state/settings.svelte';

  interface Props {
    log: string[];
    onClose: () => void;
  }

  let { log, onClose }: Props = $props();

  const settings = $derived(getSettings());

  let scrollEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (scrollEl && log.length) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  });

  function toggleDebug() {
    updateSettings({ debugLog: !settings.debugLog });
  }
</script>

<div class="log-backdrop" role="button" tabindex="-1" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()}>
  <div class="log-panel" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
    <div class="log-header">
      <h2>Game Log</h2>
      <div class="header-controls">
        <button
          class="debug-toggle"
          class:on={settings.debugLog}
          onclick={toggleDebug}
        >DEBUG</button>
        <button class="close-btn" onclick={onClose}>✕</button>
      </div>
    </div>
    <div class="log-content" bind:this={scrollEl}>
      {#each log as entry}
        <div class="log-entry" class:separator={entry.startsWith('---')} class:indent={entry.startsWith('  ')}>{entry}</div>
      {/each}
      {#if log.length === 0}
        <div class="log-empty">No actions yet.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .log-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .log-panel {
    background: rgba(10, 30, 15, 0.97);
    border: 1px solid rgba(212, 168, 67, 0.4);
    border-radius: 12px;
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  h2 {
    color: var(--gold);
    font-size: 1em;
    font-family: 'Georgia', serif;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .debug-toggle {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    font-weight: bold;
    letter-spacing: 0.5px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-muted);
  }

  .debug-toggle.on {
    background: rgba(76, 175, 80, 0.4);
    color: #4caf50;
  }

  .debug-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-btn {
    color: var(--text-muted);
    font-size: 1.1em;
    padding: 4px 8px;
  }

  .close-btn:hover {
    color: var(--text-light);
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    -webkit-overflow-scrolling: touch;
  }

  .log-entry {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 0.75em;
    line-height: 1.6;
    color: var(--text-light);
    white-space: pre-wrap;
  }

  .log-entry.separator {
    color: var(--gold);
    font-weight: bold;
    margin-top: 6px;
    margin-bottom: 2px;
  }

  .log-entry.indent {
    color: var(--text-muted);
  }

  .log-empty {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: 20px 0;
    font-size: 0.85em;
  }
</style>

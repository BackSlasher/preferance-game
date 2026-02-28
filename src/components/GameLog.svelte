<script lang="ts">
  import { getSettings, updateSettings } from '../state/settings.svelte';
  import { DEBUG_PREFIX, restartHand } from '../state/game-store.svelte';

  interface Props {
    log: string[];
    onClose: () => void;
  }

  let { log, onClose }: Props = $props();

  const settings = $derived(getSettings());

  const filteredLog = $derived(
    settings.debugLog ? log.map(e => e.startsWith(DEBUG_PREFIX) ? e.slice(1) : e) : log.filter(e => !e.startsWith(DEBUG_PREFIX))
  );

  let scrollEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (scrollEl && filteredLog.length) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  });

  function toggleDebug() {
    updateSettings({ debugLog: !settings.debugLog });
  }

  function handleRestart() {
    restartHand();
    onClose();
  }

  let copyLabel = $state('Copy AI Log');

  function copyAILog() {
    const lines: string[] = [];
    for (const raw of log) {
      const isDebug = raw.startsWith(DEBUG_PREFIX);
      const text = isDebug ? raw.slice(1) : raw;

      if (isDebug) {
        lines.push(text);
      } else if (
        text.includes('bids:') ||
        text.includes('declares:') ||
        text.includes('plays ') ||
        text.includes('wins trick') ||
        text.includes('Talon') ||
        text.includes('discards') ||
        text.startsWith('---') ||
        text.includes('Hand #') ||
        text.includes(': whist') ||
        text.includes(': pass')
      ) {
        lines.push(text);
      }
    }

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      copyLabel = 'Copied!';
      setTimeout(() => copyLabel = 'Copy AI Log', 1500);
    });
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
      {#each filteredLog as entry}
        <div class="log-entry" class:separator={entry.startsWith('---')} class:indent={entry.startsWith('  ')}>{entry}</div>
      {/each}
      {#if filteredLog.length === 0}
        <div class="log-empty">No actions yet.</div>
      {/if}
    </div>
    <div class="log-footer">
      <button class="copy-btn" onclick={copyAILog}>{copyLabel}</button>
      <button class="restart-btn" onclick={handleRestart}>Restart Hand</button>
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
    -webkit-user-select: text;
    user-select: text;
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

  .log-footer {
    padding: 8px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .copy-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 0.75em;
    font-weight: bold;
    background: rgba(144, 202, 249, 0.2);
    color: #90caf9;
  }

  .copy-btn:hover {
    background: rgba(144, 202, 249, 0.4);
  }

  .restart-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 0.75em;
    font-weight: bold;
    background: rgba(244, 67, 54, 0.3);
    color: #f44336;
  }

  .restart-btn:hover {
    background: rgba(244, 67, 54, 0.5);
  }
</style>

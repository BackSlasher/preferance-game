<script lang="ts">
  import { getSettings, updateSettings, resetSettings, DEFAULT_SETTINGS } from '../state/settings.svelte';

  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();

  const settings = $derived(getSettings());

  const POOL_OPTIONS = [10, 15, 20, 25, 30];
</script>

<div class="settings-page">
  <header>
    <button class="back-btn" onclick={onBack}>← Back</button>
    <h1>Settings</h1>
  </header>

  <div class="content">
    <section>
      <label class="setting-label">Pool target</label>
      <div class="segment-control">
        {#each POOL_OPTIONS as val}
          <button
            class="segment"
            class:active={settings.poolTarget === val}
            onclick={() => updateSettings({ poolTarget: val })}
          >{val}</button>
        {/each}
      </div>
    </section>

    <section>
      <div class="toggle-row">
        <div>
          <label class="setting-label">Stalingrad</label>
          <p class="setting-desc">Mandatory whist on 6♠</p>
        </div>
        <button
          class="toggle"
          class:on={settings.stalingrad}
          onclick={() => updateSettings({ stalingrad: !settings.stalingrad })}
          role="switch"
          aria-checked={settings.stalingrad}
        >
          <span class="toggle-knob"></span>
        </button>
      </div>
    </section>

    <section>
      <label class="setting-label">Whist type</label>
      <div class="segment-control">
        <button
          class="segment"
          class:active={settings.whistType === 'greedy'}
          onclick={() => updateSettings({ whistType: 'greedy' })}
        >Greedy</button>
        <button
          class="segment"
          class:active={settings.whistType === 'responsible'}
          onclick={() => updateSettings({ whistType: 'responsible' })}
        >Responsible</button>
      </div>
      <p class="setting-desc">
        {settings.whistType === 'greedy'
          ? 'Solo whister gets credit for all defensive tricks'
          : 'Each defender gets credit only for their own tricks'}
      </p>
    </section>

    <section>
      <label class="setting-label">Misere mode</label>
      <div class="segment-control">
        <button
          class="segment"
          class:active={settings.misereMode === 'selfish'}
          onclick={() => updateSettings({ misereMode: 'selfish' })}
        >Selfish</button>
        <button
          class="segment"
          class:active={settings.misereMode === 'cooperative'}
          onclick={() => updateSettings({ misereMode: 'cooperative' })}
        >Cooperative</button>
      </div>
      <p class="setting-desc">
        {settings.misereMode === 'selfish'
          ? 'Defenders play independently'
          : 'Defenders coordinate against declarer'}
      </p>
    </section>

    <section>
      <div class="toggle-row">
        <div>
          <label class="setting-label">Game of 10</label>
          <p class="setting-desc">Defenders cannot whist against a 10-contract</p>
        </div>
        <button
          class="toggle"
          class:on={settings.gameOfTen}
          onclick={() => updateSettings({ gameOfTen: !settings.gameOfTen })}
          role="switch"
          aria-checked={settings.gameOfTen}
        >
          <span class="toggle-knob"></span>
        </button>
      </div>
    </section>

    <section class="reset-section">
      <button class="reset-btn" onclick={resetSettings}>
        Reset to Defaults
      </button>
    </section>
  </div>
</div>

<style>
  .settings-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at center, var(--felt-light), var(--felt-dark));
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  header h1 {
    font-size: 1.2em;
    color: var(--gold);
    font-family: 'Georgia', serif;
  }

  .back-btn {
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: var(--text-light);
    font-size: 0.9em;
    font-weight: bold;
  }

  .back-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    padding-bottom: max(32px, env(safe-area-inset-bottom, 32px));
    -webkit-overflow-scrolling: touch;
  }

  section {
    margin-bottom: 24px;
  }

  .setting-label {
    display: block;
    color: var(--text-light);
    font-weight: bold;
    font-size: 0.95em;
    margin-bottom: 8px;
  }

  .setting-desc {
    color: var(--text-muted);
    font-size: 0.8em;
    margin-top: 6px;
    line-height: 1.4;
  }

  .segment-control {
    display: flex;
    gap: 2px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 2px;
  }

  .segment {
    flex: 1;
    padding: 8px 4px;
    border-radius: 6px;
    font-size: 0.85em;
    font-weight: bold;
    color: var(--text-muted);
    min-height: 38px;
    transition: all 0.15s;
  }

  .segment.active {
    background: rgba(212, 168, 67, 0.3);
    color: var(--gold);
  }

  .segment:not(.active):hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .toggle {
    position: relative;
    width: 48px;
    height: 28px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    transition: background 0.2s;
    padding: 0;
  }

  .toggle.on {
    background: rgba(76, 175, 80, 0.7);
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
  }

  .toggle.on .toggle-knob {
    transform: translateX(20px);
  }

  .reset-section {
    margin-top: 32px;
    text-align: center;
  }

  .reset-btn {
    padding: 10px 24px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-muted);
    font-size: 0.9em;
    font-weight: bold;
    min-height: 44px;
  }

  .reset-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-light);
  }
</style>

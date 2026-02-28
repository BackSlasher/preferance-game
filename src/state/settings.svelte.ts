import type { GameSettings } from '../engine/types';

const STORAGE_KEY = 'preferance-settings';

export const DEFAULT_SETTINGS: GameSettings = {
  poolTarget: 20,
  stalingrad: true,
  whistType: 'greedy',
  misereMode: 'selfish',
  gameOfTen: true,
  debugLog: false,
};

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function save(settings: GameSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

let settings = $state<GameSettings>(load());

export function getSettings(): GameSettings {
  return settings;
}

export function updateSettings(partial: Partial<GameSettings>): void {
  settings = { ...settings, ...partial };
  save(settings);
}

export function resetSettings(): void {
  settings = { ...DEFAULT_SETTINGS };
  save(settings);
}

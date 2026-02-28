import {
  GamePhase,
  PlayerSeat,
  BidSuit,
  type GameState,
  type GameAction,
  type Card,
  type BidAction,
  type WinningBid,
  type WhistDecision,
} from '../engine/types';
import { createGameState, applyAction, getLegalPlays, getPlayHint } from '../engine/game-state';
import { getAIAction } from '../ai/ai-player';
import { delay, randomInt } from '../lib/utils';
import { cardName } from '../engine/card';
import { getSettings } from './settings.svelte';
import { explainBidReasoning } from '../ai/bidding-ai';
import { ALL_SEATS } from '../engine/types';

const AI_DELAY_MIN = 600;
const AI_DELAY_MAX = 1200;
const STORAGE_KEY = 'preferance-save';

const SEAT_NAMES: Record<PlayerSeat, string> = {
  [PlayerSeat.South]: 'You',
  [PlayerSeat.West]: 'West',
  [PlayerSeat.East]: 'East',
};

const BID_SUIT_LABELS: Record<number, string> = {
  [BidSuit.Spades]: '♠',
  [BidSuit.Clubs]: '♣',
  [BidSuit.Diamonds]: '♦',
  [BidSuit.Hearts]: '♥',
  [BidSuit.NoTrumps]: 'NT',
};

function saveState(state: GameState, log: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, log }));
  } catch { /* quota exceeded — ignore */ }
}

function loadState(): { state: GameState; log: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.state?.phase !== undefined) return data;
  } catch { /* corrupt — ignore */ }
  return null;
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}

const saved = loadState();
let gameState = $state<GameState>(saved?.state ?? createGameState());
let isProcessing = $state(false);
let lastHandResult = $state<string | null>(null);
let gameLog = $state<string[]>(saved?.log ?? []);

function logAction(action: GameAction) {
  const msg = describeAction(action);
  if (msg) {
    gameLog.push(msg);
  }
}

function describeAction(action: GameAction): string | null {
  switch (action.type) {
    case 'start_game':
      return '--- New game started ---';
    case 'deal':
      return `Hand #${gameState.handNumber + 1} dealt (dealer: ${SEAT_NAMES[gameState.dealer]})`;
    case 'bid': {
      const who = SEAT_NAMES[action.seat];
      const bid = describeBid(action.bid);
      return `${who} bids: ${bid}`;
    }
    case 'reveal_talon':
      return `Talon revealed: ${gameState.talon.map(cardName).join(', ')}`;
    case 'discard':
      return `Declarer discards: ${action.cards.map(cardName).join(', ')}`;
    case 'declare_contract': {
      const who = SEAT_NAMES[gameState.highBidder!];
      return `${who} declares: ${describeBid(action.bid)}`;
    }
    case 'whist_decision': {
      const who = SEAT_NAMES[action.seat];
      return `${who}: ${action.decision}`;
    }
    case 'play_card': {
      const who = SEAT_NAMES[action.seat];
      const trickNum = gameState.tricks.length + 1;
      return `${who} plays ${cardName(action.card)} (trick ${trickNum})`;
    }
    case 'start_raspasovka':
      return `--- Raspasovka (×${gameState.raspasovkaMultiplier}) ---`;
    case 'score_hand':
      return formatScoreSummary();
    case 'next_hand':
      return null; // deal action will log
    default:
      return null;
  }
}

function describeBid(bid: BidAction | WinningBid): string {
  if (bid.type === 'pass') return 'Pass';
  if (bid.type === 'misere') return 'Misere';
  return `${bid.tricks}${BID_SUIT_LABELS[bid.suit]}`;
}

function formatScoreSummary(): string {
  const lines = ['--- Score ---'];
  for (const seat of [PlayerSeat.South, PlayerSeat.West, PlayerSeat.East] as PlayerSeat[]) {
    const s = gameState.scores[seat];
    const totalW = Object.values(s.whists).reduce((a, b) => a + b, 0);
    lines.push(`  ${SEAT_NAMES[seat]}: pool=${s.pool} dump=${s.dump} whists=${totalW}`);
  }
  return lines.join('\n');
}

export const DEBUG_PREFIX = '\x01'; // invisible marker for debug log entries

function logDebug(msg: string) {
  gameLog.push(DEBUG_PREFIX + msg);
}

function logHandsDebug() {
  for (const seat of ALL_SEATS) {
    const hand = gameState.hands[seat].map(cardName).join(' ');
    logDebug(`  [${SEAT_NAMES[seat]}] ${hand}`);
  }
}

function dispatch(action: GameAction) {
  // Pre-dispatch debug: always log AI reasoning (filtered by UI)
  if (action.type === 'bid' && action.seat !== PlayerSeat.South) {
    const reasoning = explainBidReasoning(gameState.hands[action.seat], gameState.highBid);
    logDebug(`  [${SEAT_NAMES[action.seat]} reasoning]\n${reasoning}`);
  }
  if (action.type === 'whist_decision' && action.seat !== PlayerSeat.South) {
    logDebug(`  [${SEAT_NAMES[action.seat]} hand] ${gameState.hands[action.seat].map(cardName).join(' ')}`);
  }
  if (action.type === 'play_card' && action.seat !== PlayerSeat.South) {
    const hand = gameState.hands[action.seat].map(cardName).join(' ');
    logDebug(`  [${SEAT_NAMES[action.seat]} hand] ${hand}`);
  }

  // Log score_hand AFTER applying so it shows post-scoring values
  if (action.type !== 'score_hand') {
    logAction(action);
  }
  gameState = applyAction(gameState, action);
  if (action.type === 'score_hand') {
    logAction(action);
  }

  // Post-dispatch debug: log hands after deal
  if (action.type === 'deal' || action.type === 'next_hand') {
    logHandsDebug();
  }

  // Log trick winners
  if (action.type === 'play_card' && gameState.tricks.length > 0) {
    const lastTrick = gameState.tricks[gameState.tricks.length - 1];
    if (lastTrick.winner !== undefined) {
      const totalPlays = lastTrick.plays.length;
      if (totalPlays === 3) {
        const msg = `  → ${SEAT_NAMES[lastTrick.winner]} wins trick ${gameState.tricks.length}`;
        gameLog.push(msg);
      }
    }
  }

  saveState(gameState, gameLog);
}

async function processAITurns() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (isAITurn() && gameState.phase !== GamePhase.GameOver) {
      await delay(randomInt(AI_DELAY_MIN, AI_DELAY_MAX));
      const action = getAIAction(gameState);
      if (!action) break;
      dispatch(action);

      // Auto-advance phases that need it
      await autoAdvance();
    }
  } finally {
    isProcessing = false;
  }
}

function isAITurn(): boolean {
  const phase = gameState.phase;
  const seat = gameState.activePlayer;

  if (seat === PlayerSeat.South) return false;

  return phase === GamePhase.Bidding ||
    phase === GamePhase.Discarding ||
    phase === GamePhase.ContractDeclaration ||
    phase === GamePhase.Whisting ||
    phase === GamePhase.TrickPlay ||
    phase === GamePhase.RaspasovkaTrickPlay;
}

async function autoAdvance() {
  // Auto-reveal talon (it's always revealed to all players)
  if (gameState.phase === GamePhase.TalonReveal) {
    await delay(500);
    dispatch({ type: 'reveal_talon' });
  }

  // Auto-start raspasovka
  if (gameState.phase === GamePhase.Raspasovka) {
    await delay(800);
    dispatch({ type: 'start_raspasovka' });
  }

  // Auto-score hand
  if (gameState.phase === GamePhase.HandScoring) {
    await delay(300);
    dispatch({ type: 'score_hand' });
  }
}

// === Public API ===

export function getState(): GameState {
  return gameState;
}

export function getProcessing(): boolean {
  return isProcessing;
}

export function getLastHandResult(): string | null {
  return lastHandResult;
}

export function getGameLog(): string[] {
  return gameLog;
}

// Resume AI turns if we loaded a saved state mid-AI-turn
if (saved && saved.state.phase !== GamePhase.NotStarted && isAITurn()) {
  processAITurns();
}

export function startNewGame() {
  gameLog = [];
  gameState = createGameState(getSettings());
  dispatch({ type: 'start_game' });
  dispatch({ type: 'deal' });
  processAITurns();
}

export function resetGame() {
  gameLog = [];
  gameState = createGameState(getSettings());
  clearSave();
}

export function restartHand() {
  isProcessing = false;
  gameLog.push('--- Hand restarted (debug) ---');
  dispatch({ type: 'deal' });
  processAITurns();
}

export async function playerBid(bid: BidAction) {
  if (gameState.activePlayer !== PlayerSeat.South) return;
  if (gameState.phase !== GamePhase.Bidding) return;

  dispatch({ type: 'bid', seat: PlayerSeat.South, bid });
  await autoAdvance();
  processAITurns();
}

export async function playerDiscard(cards: [Card, Card]) {
  if (gameState.activePlayer !== PlayerSeat.South) return;
  if (gameState.phase !== GamePhase.Discarding) return;

  dispatch({ type: 'discard', cards });
  processAITurns();
}

export async function playerDeclareContract(bid: WinningBid) {
  if (gameState.phase !== GamePhase.ContractDeclaration) return;

  dispatch({ type: 'declare_contract', bid });
  await autoAdvance();
  processAITurns();
}

export async function playerWhistDecision(decision: WhistDecision) {
  if (gameState.activePlayer !== PlayerSeat.South) return;
  if (gameState.phase !== GamePhase.Whisting) return;

  dispatch({ type: 'whist_decision', seat: PlayerSeat.South, decision });
  await autoAdvance();
  processAITurns();
}

export async function playerPlayCard(card: Card) {
  if (gameState.activePlayer !== PlayerSeat.South) return;
  if (gameState.phase !== GamePhase.TrickPlay &&
      gameState.phase !== GamePhase.RaspasovkaTrickPlay) return;

  // Validate the play is legal
  const legal = getLegalPlays(gameState);
  if (!legal.some(c => c.suit === card.suit && c.rank === card.rank)) return;

  dispatch({ type: 'play_card', seat: PlayerSeat.South, card });
  await autoAdvance();
  processAITurns();
}

export async function nextHand() {
  if (gameState.phase !== GamePhase.Dealing) return;

  dispatch({ type: 'next_hand' });
  processAITurns();
}

export function getPlayerLegalPlays(): Card[] {
  if (gameState.activePlayer !== PlayerSeat.South) return [];
  if (gameState.phase !== GamePhase.TrickPlay &&
      gameState.phase !== GamePhase.RaspasovkaTrickPlay) return [];
  return getLegalPlays(gameState);
}

export function getPlayerPlayHint(): string | null {
  if (gameState.activePlayer !== PlayerSeat.South) return null;
  if (gameState.phase !== GamePhase.TrickPlay &&
      gameState.phase !== GamePhase.RaspasovkaTrickPlay) return null;
  return getPlayHint(gameState);
}

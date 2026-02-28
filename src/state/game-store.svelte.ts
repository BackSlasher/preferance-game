import {
  GamePhase,
  PlayerSeat,
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

const AI_DELAY_MIN = 600;
const AI_DELAY_MAX = 1200;

let gameState = $state<GameState>(createGameState());
let isProcessing = $state(false);
let lastHandResult = $state<string | null>(null);

function dispatch(action: GameAction) {
  gameState = applyAction(gameState, action);
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

export function startNewGame() {
  gameState = createGameState();
  dispatch({ type: 'start_game' });
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

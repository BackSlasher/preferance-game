#!/usr/bin/env tsx
/**
 * Headless simulator for AI training data.
 * Runs N games with 3 AI players and reports statistics.
 *
 * Usage:
 *   npx tsx src/simulate.ts [--games N] [--pool N] [--verbose]
 */

import { createGameState, applyAction } from './engine/game-state';
import { GamePhase, PlayerSeat, ALL_SEATS, BidSuit, type GameState, type WinningBid } from './engine/types';
import { getAIAction } from './ai/ai-player';
import { evaluateHand, bestTrumpSuit } from './ai/hand-evaluation';
import { finalSettlement, requiredTricks } from './engine/scoring';
import { suitSymbol } from './engine/card';

// --- CLI args ---

function parseArgs() {
  const args = process.argv.slice(2);
  let games = 100;
  let pool = 20;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--games' && args[i + 1]) {
      games = parseInt(args[++i], 10);
    } else if (args[i] === '--pool' && args[i + 1]) {
      pool = parseInt(args[++i], 10);
    } else if (args[i] === '--verbose') {
      verbose = true;
    }
  }

  return { games, pool, verbose };
}

// --- Stats tracking ---

const SEAT_NAMES: Record<PlayerSeat, string> = {
  [PlayerSeat.South]: 'S',
  [PlayerSeat.West]: 'W',
  [PlayerSeat.East]: 'E',
};

interface HandRecord {
  declarer: PlayerSeat;
  bid: WinningBid;
  success: boolean;
  tricksTaken: number;
  tricksRequired: number;
  expectedTricks: number; // from evaluateHand at time of bidding
  isRaspasovka: false;
}

interface RaspasovkaRecord {
  isRaspasovka: true;
}

type HandResult = HandRecord | RaspasovkaRecord;

interface SimStats {
  totalHands: number;
  handResults: HandResult[];
  bidCount: number;
  passCount: number;
  finalScores: Record<PlayerSeat, number>[];
}

function createStats(): SimStats {
  return {
    totalHands: 0,
    handResults: [],
    bidCount: 0,
    passCount: 0,
    finalScores: [],
  };
}

// --- Bid formatting ---

const BID_SUIT_SYMBOLS: Record<BidSuit, string> = {
  [BidSuit.Spades]: suitSymbol(0),
  [BidSuit.Clubs]: suitSymbol(1),
  [BidSuit.Diamonds]: suitSymbol(2),
  [BidSuit.Hearts]: suitSymbol(3),
  [BidSuit.NoTrumps]: 'NT',
};

function formatBid(bid: WinningBid): string {
  if (bid.type === 'misere') return 'Mis';
  return `${bid.tricks}${BID_SUIT_SYMBOLS[bid.suit]}`;
}

// --- Simulation ---

function simulateGame(pool: number, verbose: boolean, stats: SimStats): void {
  let state = createGameState({
    poolTarget: pool,
    stalingrad: true,
    whistType: 'greedy',
    misereMode: 'cooperative',
    gameOfTen: true,
    endCondition: 'all',
    debugLog: false,
  });

  state = applyAction(state, { type: 'start_game' });
  state = applyAction(state, { type: 'deal' });

  // Track per-hand expected tricks for calibration
  let handExpected = 0;

  const MAX_ACTIONS = 50_000; // safety valve
  let actions = 0;

  while (state.phase !== GamePhase.GameOver && actions < MAX_ACTIONS) {
    actions++;

    switch (state.phase) {
      case GamePhase.Bidding: {
        // Before the first bid of this hand, snapshot expected tricks for all players
        if (state.bids.length === 0) {
          // We'll record expected tricks for whoever ends up declaring
        }

        // Track bid/pass stats
        const action = getAIAction(state);
        if (!action) throw new Error(`No AI action in Bidding phase`);

        if (action.type === 'bid') {
          if (action.bid.type === 'pass') {
            stats.passCount++;
          } else {
            stats.bidCount++;
          }
        }

        state = applyAction(state, action);
        break;
      }

      case GamePhase.TalonReveal:
        state = applyAction(state, { type: 'reveal_talon' });
        break;

      case GamePhase.Discarding:
      case GamePhase.ContractDeclaration:
      case GamePhase.Whisting:
      case GamePhase.TrickPlay:
      case GamePhase.RaspasovkaTrickPlay: {
        const action = getAIAction(state);
        if (!action) throw new Error(`No AI action in ${state.phase} phase`);

        // Capture expected tricks when declarer is about to declare contract
        if (state.phase === GamePhase.ContractDeclaration && state.highBidder !== null) {
          const declarer = state.highBidder;
          const eval_ = evaluateHand(state.hands[declarer]);
          const best = bestTrumpSuit(eval_);
          handExpected = eval_.expectedTricks[best];
        }

        state = applyAction(state, action);
        break;
      }

      case GamePhase.Raspasovka:
        state = applyAction(state, { type: 'start_raspasovka' });
        break;

      case GamePhase.HandScoring: {
        stats.totalHands++;

        if (state.contract) {
          const { declarer, bid } = state.contract;
          const tricksTaken = state.trickCounts[declarer];
          const tricksRequired = requiredTricks(bid);
          const success = bid.type === 'misere'
            ? tricksTaken === 0
            : tricksTaken >= tricksRequired;

          const record: HandRecord = {
            declarer,
            bid,
            success,
            tricksTaken,
            tricksRequired,
            expectedTricks: handExpected,
            isRaspasovka: false,
          };
          stats.handResults.push(record);

          if (verbose) {
            const result = success ? 'OK' : 'FAIL';
            console.log(
              `  Hand ${stats.totalHands}: ${SEAT_NAMES[declarer]} plays ${formatBid(bid)} ` +
              `— ${tricksTaken}/${tricksRequired} tricks [${result}] ` +
              `(expected ${handExpected.toFixed(1)})`
            );
          }
        } else {
          stats.handResults.push({ isRaspasovka: true });
          if (verbose) {
            const tricks = ALL_SEATS.map(s => `${SEAT_NAMES[s]}:${state.trickCounts[s]}`).join(' ');
            console.log(`  Hand ${stats.totalHands}: Raspasovka (${tricks})`);
          }
        }

        handExpected = 0;
        state = applyAction(state, { type: 'score_hand' });
        break;
      }

      case GamePhase.Dealing:
        state = applyAction(state, { type: 'next_hand' });
        break;

      default:
        throw new Error(`Unexpected phase: ${state.phase}`);
    }
  }

  if (actions >= MAX_ACTIONS) {
    console.error(`WARNING: Game hit action limit (${MAX_ACTIONS}), possibly stuck`);
  }

  // Record final settlement
  const settlement = finalSettlement(state.scores, state.settings.poolTarget);
  stats.finalScores.push(settlement);
}

// --- Report ---

function printReport(stats: SimStats, numGames: number): void {
  const contractHands = stats.handResults.filter(
    (r): r is HandRecord => !r.isRaspasovka
  );
  const raspasovkas = stats.handResults.filter(r => r.isRaspasovka);

  const totalBidDecisions = stats.bidCount + stats.passCount;
  const bidRate = totalBidDecisions > 0 ? stats.bidCount / totalBidDecisions : 0;
  const raspRate = stats.totalHands > 0 ? raspasovkas.length / stats.totalHands : 0;

  console.log();
  console.log(`Games: ${numGames} | Hands: ${stats.totalHands.toLocaleString()} | Avg hands/game: ${(stats.totalHands / numGames).toFixed(1)}`);
  console.log(`Bid rate: ${(bidRate * 100).toFixed(0)}% | Raspasovka rate: ${(raspRate * 100).toFixed(0)}%`);

  // Contract success by level
  console.log('Contract success by level:');
  const levels: { label: string; filter: (r: HandRecord) => boolean }[] = [
    { label: '  6', filter: r => r.bid.type === 'suit' && r.bid.tricks === 6 },
    { label: '  7', filter: r => r.bid.type === 'suit' && r.bid.tricks === 7 },
    { label: '  8', filter: r => r.bid.type === 'suit' && r.bid.tricks === 8 },
    { label: '  9', filter: r => r.bid.type === 'suit' && r.bid.tricks === 9 },
    { label: ' 10', filter: r => r.bid.type === 'suit' && r.bid.tricks === 10 },
    { label: 'Mis', filter: r => r.bid.type === 'misere' },
  ];

  for (const { label, filter } of levels) {
    const matching = contractHands.filter(filter);
    if (matching.length === 0) continue;
    const successCount = matching.filter(r => r.success).length;
    const pct = (successCount / matching.length * 100).toFixed(0);
    console.log(`  ${label}: ${pct}% (n=${matching.length})`);
  }

  // Trick estimation accuracy (exclude misere)
  const suitContracts = contractHands.filter(r => r.bid.type === 'suit');
  if (suitContracts.length > 0) {
    const avgExpected = suitContracts.reduce((s, r) => s + r.expectedTricks, 0) / suitContracts.length;
    const avgActual = suitContracts.reduce((s, r) => s + r.tricksTaken, 0) / suitContracts.length;
    const delta = avgExpected - avgActual;
    const sign = delta >= 0 ? '+' : '';
    console.log(
      `Trick estimation: avg expected=${avgExpected.toFixed(1)} actual=${avgActual.toFixed(1)} (${sign}${delta.toFixed(1)})`
    );
  }

  // Final score distribution
  if (stats.finalScores.length > 0) {
    const avg: Record<PlayerSeat, number> = { 0: 0, 1: 0, 2: 0 };
    for (const scores of stats.finalScores) {
      for (const seat of ALL_SEATS) {
        avg[seat] += scores[seat];
      }
    }
    for (const seat of ALL_SEATS) {
      avg[seat] = Math.round(avg[seat] / stats.finalScores.length);
    }
    console.log(
      `Final scores (avg): S=${avg[0] >= 0 ? '+' : ''}${avg[0]} W=${avg[1] >= 0 ? '+' : ''}${avg[1]} E=${avg[2] >= 0 ? '+' : ''}${avg[2]}`
    );
  }
}

// --- Main ---

function main() {
  const { games, pool, verbose } = parseArgs();
  const stats = createStats();

  console.log(`Simulating ${games} games (pool=${pool})...`);

  const startTime = performance.now();

  for (let i = 0; i < games; i++) {
    if (verbose) {
      console.log(`--- Game ${i + 1} ---`);
    }
    simulateGame(pool, verbose, stats);
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

  printReport(stats, games);
  console.log(`Elapsed: ${elapsed}s`);
}

main();

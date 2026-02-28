import {
  type PlayerSeat,
  type PlayerScore,
  type Contract,
  type WinningBid,
  type GameSettings,
  ALL_SEATS,
} from './types';
import { CONTRACT_VALUES, MISERE_VALUE, WHIST_OBLIGATIONS } from './constants';

/** Get the point value of a contract */
export function contractValue(bid: WinningBid): number {
  if (bid.type === 'misere') return MISERE_VALUE;
  return CONTRACT_VALUES[bid.tricks];
}

/** Get the required number of tricks for the contract */
export function requiredTricks(bid: WinningBid): number {
  if (bid.type === 'misere') return 0;
  return bid.tricks;
}

/** Get whist obligation for defenders */
export function whistObligation(bid: WinningBid): number {
  if (bid.type === 'misere') return 0;
  return WHIST_OBLIGATIONS[bid.tricks] ?? 0;
}

/** Create initial scores for all players */
export function createScores(): Record<PlayerSeat, PlayerScore> {
  const scores = {} as Record<PlayerSeat, PlayerScore>;
  for (const seat of ALL_SEATS) {
    scores[seat] = {
      pool: 0,
      dump: 0,
      whists: { 0: 0, 1: 0, 2: 0 },
    };
  }
  return scores;
}

/**
 * Score a completed hand where a contract was played.
 * Mutates the scores in place.
 */
export function scoreContract(
  scores: Record<PlayerSeat, PlayerScore>,
  contract: Contract,
  trickCounts: Record<PlayerSeat, number>,
  whistDecisions: Partial<Record<PlayerSeat, string>>,
  poolTarget: number,
  whistType: GameSettings['whistType'] = 'greedy',
): void {
  const { declarer, bid } = contract;
  const value = contractValue(bid);
  const required = requiredTricks(bid);
  const declarerTricks = trickCounts[declarer];

  const defenders = ALL_SEATS.filter(s => s !== declarer);
  const whisters = defenders.filter(s => whistDecisions[s] === 'whist');
  const defenderTricks = defenders.reduce((sum, s) => sum + trickCounts[s], 0);

  if (bid.type === 'misere') {
    scoreMisere(scores, declarer, declarerTricks);
    return;
  }

  // Did declarer make the contract?
  if (declarerTricks >= required) {
    // Success: declarer earns pool points
    scoreDeclarerSuccess(scores, declarer, value, poolTarget);

    // Whisters earn whist points for defensive tricks
    if (whisters.length > 0) {
      scoreWhistPoints(scores, declarer, whisters, trickCounts, value, whistType);
    }
  } else {
    // Failure: declarer gets dump, defenders get whist compensation
    const undertricks = required - declarerTricks;
    scoreDeclarerFailure(scores, declarer, defenders, value, undertricks);
  }

  // Check whist obligation
  if (whisters.length > 0) {
    const obligation = whistObligation(bid);
    if (defenderTricks < obligation) {
      const shortfall = obligation - defenderTricks;
      scoreWhistObligationFailure(scores, whisters, value, shortfall, trickCounts);
    }
  }
}

function scoreMisere(
  scores: Record<PlayerSeat, PlayerScore>,
  declarer: PlayerSeat,
  declarerTricks: number,
): void {
  if (declarerTricks === 0) {
    // Success
    scores[declarer].pool += MISERE_VALUE;
  } else {
    // Failure: 10 dump per trick taken
    scores[declarer].dump += MISERE_VALUE * declarerTricks;
  }
}

function scoreDeclarerSuccess(
  scores: Record<PlayerSeat, PlayerScore>,
  declarer: PlayerSeat,
  value: number,
  poolTarget: number,
): void {
  scores[declarer].pool += value;

  // Handle pool overflow (American aid)
  if (scores[declarer].pool > poolTarget) {
    const surplus = scores[declarer].pool - poolTarget;
    scores[declarer].pool = poolTarget;

    // Find player with lowest pool (closest to needing help)
    const others = ALL_SEATS.filter(s => s !== declarer);
    const recipient = others.reduce((a, b) =>
      scores[a].pool <= scores[b].pool ? a : b
    );

    scores[recipient].pool += surplus;
    // Declarer gets whist compensation for the transfer
    scores[declarer].whists[recipient] += surplus * 10;
    // Recipient gets equivalent dump
    scores[recipient].dump += surplus;
  }
}

function scoreDeclarerFailure(
  scores: Record<PlayerSeat, PlayerScore>,
  declarer: PlayerSeat,
  defenders: PlayerSeat[],
  value: number,
  undertricks: number,
): void {
  // Declarer gets dump
  scores[declarer].dump += value * undertricks;

  // Each defender gets whist points against declarer
  for (const def of defenders) {
    scores[def].whists[declarer] += value * undertricks;
  }
}

function scoreWhistPoints(
  scores: Record<PlayerSeat, PlayerScore>,
  declarer: PlayerSeat,
  whisters: PlayerSeat[],
  trickCounts: Record<PlayerSeat, number>,
  value: number,
  whistType: GameSettings['whistType'],
): void {
  if (whistType === 'greedy' && whisters.length === 1) {
    // Greedy whist: single whister gets ALL defensive tricks' worth
    const whister = whisters[0];
    const allDefTricks = ALL_SEATS
      .filter(s => s !== declarer)
      .reduce((sum, s) => sum + trickCounts[s], 0);
    scores[whister].whists[declarer] += allDefTricks * value;
  } else {
    // Responsible whist (or both whisting): each gets their own tricks' worth
    for (const whister of whisters) {
      scores[whister].whists[declarer] += trickCounts[whister] * value;
    }
  }
}

function scoreWhistObligationFailure(
  scores: Record<PlayerSeat, PlayerScore>,
  whisters: PlayerSeat[],
  value: number,
  shortfall: number,
  trickCounts: Record<PlayerSeat, number>,
): void {
  if (whisters.length === 1) {
    // Single whister bears full responsibility
    scores[whisters[0]].dump += value * shortfall;
  } else {
    // Both whisted: the one who took fewer tricks is responsible
    // If tied, both split the penalty
    const sorted = [...whisters].sort(
      (a, b) => trickCounts[a] - trickCounts[b]
    );
    if (trickCounts[sorted[0]] < trickCounts[sorted[1]]) {
      scores[sorted[0]].dump += value * shortfall;
    } else {
      // Split evenly
      for (const w of whisters) {
        scores[w].dump += Math.ceil((value * shortfall) / 2);
      }
    }
  }
}

/**
 * Score a raspasovka (all-pass) hand.
 * Each trick taken = 1 dump × multiplier.
 * Zero tricks = 1 pool point.
 */
export function scoreRaspasovka(
  scores: Record<PlayerSeat, PlayerScore>,
  trickCounts: Record<PlayerSeat, number>,
  multiplier: number,
): void {
  for (const seat of ALL_SEATS) {
    if (trickCounts[seat] === 0) {
      scores[seat].pool += 1;
    } else {
      scores[seat].dump += trickCounts[seat] * multiplier;
    }
  }
}

/**
 * Final settlement: convert all scores to whist points.
 * Returns the final whist-point score for each player (zero-sum).
 */
export function finalSettlement(
  scores: Record<PlayerSeat, PlayerScore>,
  poolTarget: number,
): Record<PlayerSeat, number> {
  // Work on copies
  const pool: Record<PlayerSeat, number> = { 0: 0, 1: 0, 2: 0 };
  const dump: Record<PlayerSeat, number> = { 0: 0, 1: 0, 2: 0 };
  const whists: Record<PlayerSeat, Record<PlayerSeat, number>> = {
    0: { 0: 0, 1: 0, 2: 0 },
    1: { 0: 0, 1: 0, 2: 0 },
    2: { 0: 0, 1: 0, 2: 0 },
  };

  for (const seat of ALL_SEATS) {
    pool[seat] = scores[seat].pool;
    dump[seat] = scores[seat].dump;
    for (const opp of ALL_SEATS) {
      whists[seat][opp] = scores[seat].whists[opp];
    }
  }

  // Step 1: Convert unfilled pool to dump
  for (const seat of ALL_SEATS) {
    const deficit = poolTarget - pool[seat];
    if (deficit > 0) {
      dump[seat] += deficit;
    }
  }

  // Step 2: Amnesty — subtract minimum dump from all
  const minDump = Math.min(...ALL_SEATS.map(s => dump[s]));
  for (const seat of ALL_SEATS) {
    dump[seat] -= minDump;
  }

  // Step 3: Convert dump to whist points
  // Each player's dump is distributed as whist points against them
  for (const seat of ALL_SEATS) {
    const dumpWhists = (dump[seat] * 10) / (ALL_SEATS.length - 1);
    for (const opp of ALL_SEATS) {
      if (opp !== seat) {
        whists[opp][seat] += dumpWhists;
      }
    }
  }

  // Step 4: Pairwise whist balance
  const finalScores: Record<PlayerSeat, number> = { 0: 0, 1: 0, 2: 0 };
  for (let i = 0; i < ALL_SEATS.length; i++) {
    for (let j = i + 1; j < ALL_SEATS.length; j++) {
      const a = ALL_SEATS[i];
      const b = ALL_SEATS[j];
      const net = whists[a][b] - whists[b][a];
      finalScores[a] += net;
      finalScores[b] -= net;
    }
  }

  return finalScores;
}

/** Check if the game should end */
export function isGameOver(
  scores: Record<PlayerSeat, PlayerScore>,
  poolTarget: number,
  endCondition: 'all' | 'any' = 'all',
): boolean {
  const check = endCondition === 'all' ? ALL_SEATS.every : ALL_SEATS.some;
  return check.call(ALL_SEATS, s => scores[s].pool >= poolTarget);
}

import {
  GamePhase,
  type GameState,
  type GameAction,
  type GameSettings,
  type PlayerSeat,
  type Card,
  type Contract,
  type Trick,
  type WinningBid,
  ALL_SEATS,
  BidSuit,
} from './types';
import { createDeck, shuffle, deal, eldestHand, nextPlayer } from './deck';
import { sortHand, cardEquals } from './card';
import { isBiddingComplete, bidSuitToTrump } from './bidding';
import { legalPlays, trickWinner, createTrick, isTrickComplete, getLeadSuit, explainLegalPlays } from './trick';
import { createScores, scoreContract, scoreRaspasovka, isGameOver } from './scoring';
import { raspasovkaLeadSuit, nextRaspasovkaMultiplier } from './raspasovka';
import { WHIST_OBLIGATIONS } from './constants';

const DEFAULT_SETTINGS: GameSettings = {
  poolTarget: 20,
  stalingrad: true,
  whistType: 'greedy',
  misereMode: 'selfish',
  gameOfTen: true,
};

/** Create the initial game state */
export function createGameState(settings: GameSettings = DEFAULT_SETTINGS): GameState {
  return {
    phase: GamePhase.NotStarted,
    hands: { 0: [], 1: [], 2: [] },
    talon: [],
    talonRevealed: false,
    dealer: 2 as PlayerSeat, // East deals first, so South (human) is eldest
    activePlayer: 0 as PlayerSeat,
    bids: [],
    passedPlayers: [],
    highBid: null,
    highBidder: null,
    contract: null,
    whistDecisions: {},
    openHand: null,
    discards: [],
    tricks: [],
    currentTrick: null,
    trickCounts: { 0: 0, 1: 0, 2: 0 },
    scores: createScores(),
    settings,
    handNumber: 0,
    raspasovkaStreak: 0,
    raspasovkaMultiplier: 1,
  };
}

/** Apply an action to the game state and return the new state */
export function applyAction(state: GameState, action: GameAction): GameState {
  // Clone state (shallow — arrays/objects inside need individual handling)
  const s = cloneState(state);

  switch (action.type) {
    case 'start_game':
      return applyStartGame(s);
    case 'deal':
      return applyDeal(s);
    case 'bid':
      return applyBid(s, action.seat, action.bid);
    case 'reveal_talon':
      return applyRevealTalon(s);
    case 'discard':
      return applyDiscard(s, action.cards);
    case 'declare_contract':
      return applyDeclareContract(s, action.bid);
    case 'whist_decision':
      return applyWhistDecision(s, action.seat, action.decision);
    case 'play_card':
      return applyPlayCard(s, action.seat, action.card);
    case 'score_hand':
      return applyScoreHand(s);
    case 'start_raspasovka':
      return applyStartRaspasovka(s);
    case 'next_hand':
      return applyNextHand(s);
    default:
      return s;
  }
}

function applyStartGame(s: GameState): GameState {
  s.phase = GamePhase.Dealing;
  s.handNumber = 1;
  return s;
}

function applyDeal(s: GameState): GameState {
  const deck = shuffle(createDeck());
  const { hands, talon } = deal(deck, s.dealer);

  // Sort each hand
  for (const seat of ALL_SEATS) {
    hands[seat] = sortHand(hands[seat]);
  }

  s.hands = hands;
  s.talon = talon;
  s.talonRevealed = false;
  s.bids = [];
  s.passedPlayers = [];
  s.highBid = null;
  s.highBidder = null;
  s.contract = null;
  s.whistDecisions = {};
  s.openHand = null;
  s.discards = [];
  s.tricks = [];
  s.currentTrick = null;
  s.trickCounts = { 0: 0, 1: 0, 2: 0 };
  s.activePlayer = eldestHand(s.dealer);
  s.phase = GamePhase.Bidding;

  return s;
}

function applyBid(s: GameState, seat: PlayerSeat, bid: import('./types').BidAction): GameState {
  s.bids = [...s.bids, { seat, action: bid }];

  if (bid.type === 'pass') {
    s.passedPlayers = [...s.passedPlayers, seat];
  } else {
    s.highBid = bid as WinningBid;
    s.highBidder = seat;
  }

  // Check if bidding is complete
  if (isBiddingComplete(s.passedPlayers, s.highBid)) {
    if (s.passedPlayers.length === 3) {
      // All passed → raspasovka
      s.phase = GamePhase.Raspasovka;
      s.activePlayer = eldestHand(s.dealer);
    } else {
      // Winner takes talon
      s.phase = GamePhase.TalonReveal;
      s.activePlayer = s.highBidder!;
    }
  } else {
    // Next bidder (skip passed players)
    s.activePlayer = findNextBidder(seat, s.passedPlayers);
  }

  return s;
}

function applyRevealTalon(s: GameState): GameState {
  s.talonRevealed = true;

  // Declarer picks up talon cards
  const declarer = s.highBidder!;
  s.hands[declarer] = sortHand([...s.hands[declarer], ...s.talon]);

  s.phase = GamePhase.Discarding;
  return s;
}

function applyDiscard(s: GameState, cards: [Card, Card]): GameState {
  const declarer = s.highBidder!;

  // Remove discarded cards from hand
  let hand = [...s.hands[declarer]];
  for (const card of cards) {
    const idx = hand.findIndex(c => cardEquals(c, card));
    if (idx === -1) throw new Error('Discard card not in hand');
    hand.splice(idx, 1);
  }
  s.hands[declarer] = sortHand(hand);
  s.discards = [...cards];

  s.phase = GamePhase.ContractDeclaration;
  return s;
}

function applyDeclareContract(s: GameState, bid: WinningBid): GameState {
  const declarer = s.highBidder!;
  const trump = bid.type === 'misere' ? null :
    bid.suit === BidSuit.NoTrumps ? null :
    bidSuitToTrump(bid.suit) as import('./types').Suit | null;

  s.contract = { declarer, bid, trump };

  // Determine which defenders need to make whist decisions
  if (bid.type === 'misere') {
    // On misere, both defenders always play (no whist decision needed)
    const defenders = ALL_SEATS.filter(s2 => s2 !== declarer);
    s.whistDecisions = {};
    for (const d of defenders) {
      s.whistDecisions[d] = 'whist';
    }
    // In selfish misere, defenders see their own cards but play independently
    s.phase = GamePhase.TrickPlay;
    s.activePlayer = eldestHand(s.dealer);
    s.currentTrick = createTrick(s.activePlayer);
  } else if (s.settings.gameOfTen && bid.type === 'suit' && bid.tricks === 10) {
    // 10-contract: no whisting allowed, declarer wins automatically
    const defenders = ALL_SEATS.filter(s2 => s2 !== declarer);
    s.whistDecisions = {};
    for (const d of defenders) {
      s.whistDecisions[d] = 'pass';
    }
    s.trickCounts[declarer] = 10;
    s.phase = GamePhase.HandScoring;
  } else {
    // Normal contract: defenders decide
    s.phase = GamePhase.Whisting;
    // Mandatory whist on 6♠ (Stalingrad)
    if (s.settings.stalingrad && bid.type === 'suit' && bid.tricks === 6 && bid.suit === BidSuit.Spades) {
      const defenders = ALL_SEATS.filter(s2 => s2 !== declarer);
      s.whistDecisions = {};
      for (const d of defenders) {
        s.whistDecisions[d] = 'whist';
      }
      s.phase = GamePhase.TrickPlay;
      s.activePlayer = eldestHand(s.dealer);
      s.currentTrick = createTrick(s.activePlayer);
    } else {
      // Left defender decides first
      const leftDef = nextDefender(declarer);
      s.activePlayer = leftDef;
    }
  }

  return s;
}

function applyWhistDecision(s: GameState, seat: PlayerSeat, decision: string): GameState {
  s.whistDecisions = { ...s.whistDecisions, [seat]: decision };
  const declarer = s.contract!.declarer;
  const defenders = ALL_SEATS.filter(s2 => s2 !== declarer);

  // Check if all defenders have decided
  const allDecided = defenders.every(d => s.whistDecisions[d] !== undefined);

  if (!allDecided) {
    // Next defender to decide
    const undecided = defenders.find(d => s.whistDecisions[d] === undefined);
    s.activePlayer = undecided!;
    return s;
  }

  // All decided
  const whisters = defenders.filter(d => s.whistDecisions[d] === 'whist');

  if (whisters.length === 0) {
    // Both passed: declarer wins automatically
    s.trickCounts[declarer] = 10;
    s.phase = GamePhase.HandScoring;
  } else {
    // At least one whists: play tricks
    if (whisters.length === 1) {
      // The non-whisting defender plays open (face-up)
      const passer = defenders.find(d => s.whistDecisions[d] === 'pass');
      if (passer !== undefined) {
        s.openHand = passer;
      }
    }
    s.phase = GamePhase.TrickPlay;
    s.activePlayer = eldestHand(s.dealer);
    s.currentTrick = createTrick(s.activePlayer);
  }

  return s;
}

function applyPlayCard(s: GameState, seat: PlayerSeat, card: Card): GameState {
  // Remove card from hand
  const hand = [...s.hands[seat]];
  const idx = hand.findIndex(c => cardEquals(c, card));
  if (idx === -1) throw new Error('Card not in hand');
  hand.splice(idx, 1);
  s.hands[seat] = hand;

  // Add to current trick
  if (!s.currentTrick) throw new Error('No current trick');
  s.currentTrick = {
    ...s.currentTrick,
    plays: [...s.currentTrick.plays, { seat, card }],
  };

  // Is the trick complete?
  if (isTrickComplete(s.currentTrick)) {
    const trump = s.contract?.trump ?? null;
    const winner = trickWinner(s.currentTrick.plays, trump);
    s.currentTrick.winner = winner;
    s.trickCounts[winner]++;
    s.tricks = [...s.tricks, s.currentTrick];

    // Are all 10 tricks done?
    const totalTricks = ALL_SEATS.reduce((sum, seat) => sum + s.trickCounts[seat], 0);
    if (totalTricks >= 10) {
      s.currentTrick = null;
      s.phase = GamePhase.HandScoring;
    } else {
      // Next trick, winner leads
      s.currentTrick = createTrick(winner);
      s.activePlayer = winner;
    }
  } else {
    // Next player in the trick
    s.activePlayer = nextPlayer(seat);
  }

  return s;
}

function applyStartRaspasovka(s: GameState): GameState {
  s.raspasovkaStreak++;
  s.raspasovkaMultiplier = nextRaspasovkaMultiplier(s.raspasovkaStreak - 1);
  s.contract = null;
  s.talonRevealed = true; // Talon is shown face-up to indicate forced lead suits

  s.phase = GamePhase.RaspasovkaTrickPlay;
  s.activePlayer = eldestHand(s.dealer);
  s.currentTrick = createTrick(s.activePlayer);

  return s;
}

function applyScoreHand(s: GameState): GameState {
  if (s.phase === GamePhase.HandScoring) {
    if (s.contract) {
      scoreContract(
        s.scores,
        s.contract,
        s.trickCounts,
        s.whistDecisions,
        s.settings.poolTarget,
        s.settings.whistType,
      );
      // Reset raspasovka streak on any played contract
      s.raspasovkaStreak = 0;
      s.raspasovkaMultiplier = 1;
    } else {
      // Raspasovka scoring
      scoreRaspasovka(s.scores, s.trickCounts, s.raspasovkaMultiplier);
    }
  }

  // Check game over
  if (isGameOver(s.scores, s.settings.poolTarget)) {
    s.phase = GamePhase.GameOver;
  } else {
    // Ready for next hand
    s.phase = GamePhase.Dealing;
  }

  return s;
}

function applyNextHand(s: GameState): GameState {
  s.dealer = nextPlayer(s.dealer);
  s.handNumber++;
  return applyDeal(s);
}

// --- Helpers ---

function findNextBidder(current: PlayerSeat, passed: PlayerSeat[]): PlayerSeat {
  let next = nextPlayer(current);
  while (passed.includes(next)) {
    next = nextPlayer(next);
  }
  return next;
}

function nextDefender(declarer: PlayerSeat): PlayerSeat {
  // Left defender of declarer (next clockwise)
  return nextPlayer(declarer);
}

/** Get legal plays for the active player given current game state */
export function getLegalPlays(state: GameState): Card[] {
  const hand = state.hands[state.activePlayer];
  const trump = state.contract?.trump ?? null;

  if (state.phase === GamePhase.RaspasovkaTrickPlay) {
    // Raspasovka: check if the lead suit is forced
    const trickIdx = state.tricks.length;
    if (state.currentTrick && state.currentTrick.plays.length === 0) {
      // Leading
      const forcedSuit = raspasovkaLeadSuit(state.talon, trickIdx);
      if (forcedSuit !== null) {
        // Must lead this suit if possible
        const suited = hand.filter(c => c.suit === forcedSuit);
        if (suited.length > 0) return suited;
      }
      return [...hand]; // Free lead
    }
    // Following in raspasovka: no trumps
    return legalPlays(hand, getLeadSuit(state.currentTrick), null);
  }

  return legalPlays(hand, getLeadSuit(state.currentTrick), trump);
}

/**
 * Explain why only certain cards are legal to play.
 * Returns a hint string, or null if all cards are playable (leading).
 */
export function getPlayHint(state: GameState): string | null {
  const hand = state.hands[state.activePlayer];
  const trump = state.contract?.trump ?? null;

  if (state.phase === GamePhase.RaspasovkaTrickPlay) {
    const trickIdx = state.tricks.length;
    if (state.currentTrick && state.currentTrick.plays.length === 0) {
      const forcedSuit = raspasovkaLeadSuit(state.talon, trickIdx);
      if (forcedSuit !== null) {
        const suitSymbols = ['♠', '♣', '♦', '♥'];
        const hasSuit = hand.some(c => c.suit === forcedSuit);
        if (hasSuit) {
          return `Must lead ${suitSymbols[forcedSuit]} (from talon)`;
        }
      }
      return 'Your lead — play any card';
    }
    return explainLegalPlays(hand, getLeadSuit(state.currentTrick), null);
  }

  const leadSuit = getLeadSuit(state.currentTrick);
  if (leadSuit === null) return 'Your lead — play any card';
  return explainLegalPlays(hand, leadSuit, trump);
}

/** Deep-ish clone of game state */
function cloneState(state: GameState): GameState {
  return {
    ...state,
    hands: {
      0: [...state.hands[0]],
      1: [...state.hands[1]],
      2: [...state.hands[2]],
    },
    talon: [...state.talon],
    bids: [...state.bids],
    passedPlayers: [...state.passedPlayers],
    whistDecisions: { ...state.whistDecisions },
    discards: [...state.discards],
    tricks: [...state.tricks],
    currentTrick: state.currentTrick ? {
      ...state.currentTrick,
      plays: [...state.currentTrick.plays],
    } : null,
    trickCounts: { ...state.trickCounts },
    scores: {
      0: { ...state.scores[0], whists: { ...state.scores[0].whists } },
      1: { ...state.scores[1], whists: { ...state.scores[1].whists } },
      2: { ...state.scores[2], whists: { ...state.scores[2].whists } },
    },
  };
}

import { describe, it, expect } from 'vitest';
import {
  GamePhase,
  PlayerSeat,
  BidSuit,
  ALL_SEATS,
  type GameState,
  type SuitBid,
} from '../../src/engine/types';
import { createGameState, applyAction, getLegalPlays } from '../../src/engine/game-state';

function suitBid(tricks: number, suit: BidSuit): SuitBid {
  return { type: 'suit', tricks, suit };
}

describe('game-state', () => {
  it('creates initial state', () => {
    const state = createGameState();
    expect(state.phase).toBe(GamePhase.NotStarted);
    expect(state.settings.poolTarget).toBe(20);
    expect(state.handNumber).toBe(0);
  });

  it('starts and deals', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    expect(state.phase).toBe(GamePhase.Dealing);

    state = applyAction(state, { type: 'deal' });
    expect(state.phase).toBe(GamePhase.Bidding);

    for (const seat of ALL_SEATS) {
      expect(state.hands[seat]).toHaveLength(10);
    }
    expect(state.talon).toHaveLength(2);
  });

  it('handles all-pass leading to raspasovka', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // All three pass (eldest first = South since dealer=East)
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.South, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    expect(state.phase).toBe(GamePhase.Raspasovka);
  });

  it('handles successful bid through to contract declaration', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // South bids 6♠, West and East pass
    state = applyAction(state, {
      type: 'bid', seat: PlayerSeat.South,
      bid: suitBid(6, BidSuit.Spades),
    });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    expect(state.phase).toBe(GamePhase.TalonReveal);
    expect(state.highBidder).toBe(PlayerSeat.South);

    // Reveal talon
    state = applyAction(state, { type: 'reveal_talon' });
    expect(state.phase).toBe(GamePhase.Discarding);
    expect(state.hands[PlayerSeat.South]).toHaveLength(12);
    expect(state.talonRevealed).toBe(true);

    // Discard 2 cards
    const hand = state.hands[PlayerSeat.South];
    state = applyAction(state, {
      type: 'discard',
      cards: [hand[0], hand[1]],
    });
    expect(state.phase).toBe(GamePhase.ContractDeclaration);
    expect(state.hands[PlayerSeat.South]).toHaveLength(10);
  });

  it('mandatory whist on 6♠ goes straight to trick play', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // South bids 6♠, others pass
    state = applyAction(state, {
      type: 'bid', seat: PlayerSeat.South,
      bid: suitBid(6, BidSuit.Spades),
    });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    // Reveal and discard
    state = applyAction(state, { type: 'reveal_talon' });
    const hand = state.hands[PlayerSeat.South];
    state = applyAction(state, { type: 'discard', cards: [hand[0], hand[1]] });

    // Declare 6♠
    state = applyAction(state, { type: 'declare_contract', bid: suitBid(6, BidSuit.Spades) });

    // Stalingrad: mandatory whist, skip whisting phase
    expect(state.phase).toBe(GamePhase.TrickPlay);
    expect(state.whistDecisions[PlayerSeat.West]).toBe('whist');
    expect(state.whistDecisions[PlayerSeat.East]).toBe('whist');
  });

  it('plays a full trick', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // Quick bid: South 7♥, others pass
    state = applyAction(state, {
      type: 'bid', seat: PlayerSeat.South,
      bid: suitBid(7, BidSuit.Hearts),
    });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    state = applyAction(state, { type: 'reveal_talon' });
    const hand = state.hands[PlayerSeat.South];
    state = applyAction(state, { type: 'discard', cards: [hand[0], hand[1]] });
    state = applyAction(state, { type: 'declare_contract', bid: suitBid(7, BidSuit.Hearts) });

    // Whisting: West whists, East passes
    state = applyAction(state, { type: 'whist_decision', seat: PlayerSeat.West, decision: 'whist' });
    state = applyAction(state, { type: 'whist_decision', seat: PlayerSeat.East, decision: 'pass' });

    expect(state.phase).toBe(GamePhase.TrickPlay);

    // Play first trick - each player plays a legal card
    for (let i = 0; i < 3; i++) {
      const seat = state.activePlayer;
      const legal = getLegalPlays(state);
      expect(legal.length).toBeGreaterThan(0);
      state = applyAction(state, { type: 'play_card', seat, card: legal[0] });
    }

    // First trick should be complete
    expect(state.tricks).toHaveLength(1);
    const totalTricks = ALL_SEATS.reduce((sum, s) => sum + state.trickCounts[s], 0);
    expect(totalTricks).toBe(1);
  });

  it('plays a full hand to completion', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // South bids 6♣, others pass
    state = applyAction(state, {
      type: 'bid', seat: PlayerSeat.South,
      bid: suitBid(6, BidSuit.Clubs),
    });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    state = applyAction(state, { type: 'reveal_talon' });
    const hand = state.hands[PlayerSeat.South];
    state = applyAction(state, { type: 'discard', cards: [hand[0], hand[1]] });
    state = applyAction(state, { type: 'declare_contract', bid: suitBid(6, BidSuit.Clubs) });

    // Stalingrad: 6♠ is mandatory, but 6♣ goes to whisting
    // West whists, East passes
    if (state.phase === GamePhase.Whisting) {
      state = applyAction(state, { type: 'whist_decision', seat: PlayerSeat.West, decision: 'whist' });
      state = applyAction(state, { type: 'whist_decision', seat: PlayerSeat.East, decision: 'pass' });
    }

    expect(state.phase).toBe(GamePhase.TrickPlay);

    // Play all 10 tricks
    let safety = 0;
    while (state.phase === GamePhase.TrickPlay && safety < 100) {
      const seat = state.activePlayer;
      const legal = getLegalPlays(state);
      state = applyAction(state, { type: 'play_card', seat, card: legal[0] });
      safety++;
    }

    expect(state.phase).toBe(GamePhase.HandScoring);

    const totalTricks = ALL_SEATS.reduce((sum, s) => sum + state.trickCounts[s], 0);
    expect(totalTricks).toBe(10);
    expect(state.tricks).toHaveLength(10);

    // Score the hand
    state = applyAction(state, { type: 'score_hand' });

    // Should be ready for next hand (or game over, but unlikely after 1 hand)
    expect([GamePhase.Dealing, GamePhase.GameOver]).toContain(state.phase);
  });

  it('plays a raspasovka hand to completion', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // All pass
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.South, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    expect(state.phase).toBe(GamePhase.Raspasovka);

    // Start raspasovka
    state = applyAction(state, { type: 'start_raspasovka' });
    expect(state.phase).toBe(GamePhase.RaspasovkaTrickPlay);
    expect(state.raspasovkaStreak).toBe(1);
    expect(state.raspasovkaMultiplier).toBe(1);

    // Play all 10 tricks
    let safety = 0;
    while (state.phase === GamePhase.RaspasovkaTrickPlay && safety < 100) {
      const seat = state.activePlayer;
      const legal = getLegalPlays(state);
      state = applyAction(state, { type: 'play_card', seat, card: legal[0] });
      safety++;
    }

    expect(state.phase).toBe(GamePhase.HandScoring);
    const totalTricks = ALL_SEATS.reduce((sum, s) => sum + state.trickCounts[s], 0);
    expect(totalTricks).toBe(10);
  });

  it('getLegalPlays respects raspasovka forced lead suit', () => {
    let state = createGameState();
    state = applyAction(state, { type: 'start_game' });
    state = applyAction(state, { type: 'deal' });

    // All pass
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.South, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.West, bid: { type: 'pass' } });
    state = applyAction(state, { type: 'bid', seat: PlayerSeat.East, bid: { type: 'pass' } });

    state = applyAction(state, { type: 'start_raspasovka' });

    // The first trick's leader must lead the suit of talon card 1
    const forcedSuit = state.talon[0].suit;
    const legal = getLegalPlays(state);
    const leaderHand = state.hands[state.activePlayer];
    const hasForcedSuit = leaderHand.some(c => c.suit === forcedSuit);

    if (hasForcedSuit) {
      // All legal plays should be of the forced suit
      expect(legal.every(c => c.suit === forcedSuit)).toBe(true);
    } else {
      // Free lead if player doesn't have the forced suit
      expect(legal.length).toBe(leaderHand.length);
    }
  });
});

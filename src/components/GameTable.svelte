<script lang="ts">
  import { GamePhase, PlayerSeat, BidSuit, type Card } from '../engine/types';
  import { suitSymbol } from '../engine/card';
  import { contractValue } from '../engine/scoring';
  import {
    getState,
    getProcessing,
    startNewGame,
    playerBid,
    playerDiscard,
    playerDeclareContract,
    playerWhistDecision,
    playerPlayCard,
    nextHand,
    getPlayerLegalPlays,
    getPlayerPlayHint,
  } from '../state/game-store.svelte';

  import PlayerHand from './PlayerHand.svelte';
  import OpponentHand from './OpponentHand.svelte';
  import TrickArea from './TrickArea.svelte';
  import Talon from './Talon.svelte';
  import BiddingPanel from './BiddingPanel.svelte';
  import WhistPanel from './WhistPanel.svelte';
  import ContractPanel from './ContractPanel.svelte';
  import DiscardPanel from './DiscardPanel.svelte';
  import PlayerInfo from './PlayerInfo.svelte';
  import ScoreOverlay from './ScoreOverlay.svelte';
  import Toast from './Toast.svelte';

  const NAMES = {
    [PlayerSeat.South]: 'You',
    [PlayerSeat.West]: 'West',
    [PlayerSeat.East]: 'East',
  };

  let selectedDiscards = $state<Card[]>([]);
  let showScoreOverlay = $state(false);
  let toastMessage = $state('');
  let toastVisible = $state(false);
  let toastTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  const state = $derived(getState());
  const processing = $derived(getProcessing());
  const legalPlays = $derived(getPlayerLegalPlays());
  const playHint = $derived(getPlayerPlayHint());
  const isPlayerTurn = $derived(
    state.activePlayer === PlayerSeat.South && !processing
  );

  const showTalon = $derived(
    state.phase === GamePhase.TalonReveal ||
    state.phase === GamePhase.Discarding ||
    state.phase === GamePhase.ContractDeclaration ||
    state.phase === GamePhase.Raspasovka ||
    state.phase === GamePhase.RaspasovkaTrickPlay
  );

  const showBidding = $derived(
    state.phase === GamePhase.Bidding
  );

  const showWhisting = $derived(
    state.phase === GamePhase.Whisting && isPlayerTurn
  );

  const showContract = $derived(
    state.phase === GamePhase.ContractDeclaration && isPlayerTurn
  );

  const showDiscard = $derived(
    state.phase === GamePhase.Discarding && isPlayerTurn
  );

  const isTrickPhase = $derived(
    state.phase === GamePhase.TrickPlay ||
    state.phase === GamePhase.RaspasovkaTrickPlay
  );

  const trumpLabel = $derived(
    state.contract?.trump !== null && state.contract?.trump !== undefined
      ? suitSymbol(state.contract.trump)
      : state.contract ? 'NT' : ''
  );

  const suitLabels: Record<number, string> = {
    [BidSuit.Spades]: '♠',
    [BidSuit.Clubs]: '♣',
    [BidSuit.Diamonds]: '♦',
    [BidSuit.Hearts]: '♥',
    [BidSuit.NoTrumps]: 'NT',
  };

  const contractLabel = $derived.by(() => {
    const c = state.contract;
    if (!c) return '';
    const bid = c.bid;
    if (bid.type === 'misere') return `Misere (${contractValue(bid)}pts)`;
    return `${bid.tricks}${suitLabels[bid.suit]} (${contractValue(bid)}pts)`;
  });

  const phaseLabel = $derived(getPhaseLabel(state.phase, processing, isPlayerTurn));

  function getPhaseLabel(phase: GamePhase, proc: boolean, myTurn: boolean): string {
    if (proc && !myTurn) return 'Thinking...';
    switch (phase) {
      case GamePhase.Bidding: return myTurn ? 'Your bid' : 'Bidding...';
      case GamePhase.TalonReveal: return 'Talon revealed';
      case GamePhase.Discarding: return 'Discard 2 cards';
      case GamePhase.ContractDeclaration: return 'Declare contract';
      case GamePhase.Whisting: return myTurn ? 'Whist or pass?' : 'Defenders deciding...';
      case GamePhase.TrickPlay: return myTurn ? 'Your play' : 'Playing...';
      case GamePhase.RaspasovkaTrickPlay: return myTurn ? 'Your play (all-pass)' : 'Playing...';
      case GamePhase.Raspasovka: return 'All pass!';
      case GamePhase.HandScoring: return 'Scoring...';
      case GamePhase.GameOver: return 'Game Over';
      default: return '';
    }
  }

  function toast(msg: string) {
    toastMessage = msg;
    toastVisible = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastVisible = false; }, 2000);
  }

  function handleCardClick(card: Card) {
    if (showDiscard) {
      // Toggle discard selection
      const idx = selectedDiscards.findIndex(
        c => c.suit === card.suit && c.rank === card.rank
      );
      if (idx >= 0) {
        selectedDiscards = selectedDiscards.filter((_, i) => i !== idx);
      } else if (selectedDiscards.length < 2) {
        selectedDiscards = [...selectedDiscards, card];
      }
    } else if (isTrickPhase && isPlayerTurn) {
      playerPlayCard(card);
    }
  }

  function confirmDiscard() {
    if (selectedDiscards.length === 2) {
      playerDiscard(selectedDiscards as [Card, Card]);
      selectedDiscards = [];
    }
  }

  // Watch for phase transitions to show overlays / toasts
  let prevPhase = $state(GamePhase.NotStarted);
  $effect(() => {
    const phase = state.phase;
    if (phase !== prevPhase) {
      if (phase === GamePhase.Dealing && prevPhase === GamePhase.HandScoring) {
        showScoreOverlay = true;
      }
      if (phase === GamePhase.Raspasovka) {
        toast('All pass! Raspasovka');
      }
      if (phase === GamePhase.GameOver) {
        showScoreOverlay = true;
      }
      prevPhase = phase;
    }
  });

  function handleScoreContinue() {
    showScoreOverlay = false;
    if (state.phase === GamePhase.Dealing) {
      nextHand();
    }
  }
</script>

<div class="game-table">
  <!-- Status bar -->
  <div class="status-bar">
    <span class="phase-label">{phaseLabel}</span>
    {#if trumpLabel}
      <span class="trump-label">Trump: {trumpLabel}</span>
    {/if}
    <div class="status-right">
      <span class="hand-num">Hand #{state.handNumber}</span>
      <a class="help-link" href="/instructions">?</a>
    </div>
  </div>

  <!-- Top area: opponents + trick -->
  <div class="top-area">
    <div class="opponent-zone">
      <PlayerInfo
        name={NAMES[PlayerSeat.West]}
        score={state.scores[PlayerSeat.West]}
        isActive={state.activePlayer === PlayerSeat.West}
        isDealer={state.dealer === PlayerSeat.West}
        isDeclarer={state.contract?.declarer === PlayerSeat.West}
        contractLabel={state.contract?.declarer === PlayerSeat.West ? contractLabel : ''}
        trickCount={state.trickCounts[PlayerSeat.West]}
      />
      <OpponentHand
        cardCount={state.hands[PlayerSeat.West].length}
        cards={state.openHand === PlayerSeat.West ? state.hands[PlayerSeat.West] : undefined}
        faceUp={state.openHand === PlayerSeat.West}
        position="left"
      />
    </div>

    <div class="center-zone">
      {#if showTalon}
        <Talon cards={state.talon} revealed={state.talonRevealed} />
      {/if}
      {#if isTrickPhase || state.tricks.length > 0}
        <TrickArea
          trick={state.currentTrick}
          lastTrick={state.tricks.length > 0 ? state.tricks[state.tricks.length - 1] : null}
        />
      {/if}
    </div>

    <div class="opponent-zone">
      <PlayerInfo
        name={NAMES[PlayerSeat.East]}
        score={state.scores[PlayerSeat.East]}
        isActive={state.activePlayer === PlayerSeat.East}
        isDealer={state.dealer === PlayerSeat.East}
        isDeclarer={state.contract?.declarer === PlayerSeat.East}
        contractLabel={state.contract?.declarer === PlayerSeat.East ? contractLabel : ''}
        trickCount={state.trickCounts[PlayerSeat.East]}
      />
      <OpponentHand
        cardCount={state.hands[PlayerSeat.East].length}
        cards={state.openHand === PlayerSeat.East ? state.hands[PlayerSeat.East] : undefined}
        faceUp={state.openHand === PlayerSeat.East}
        position="right"
      />
    </div>
  </div>

  <!-- Action panel (mid-bottom) -->
  <div class="action-panel">
    {#if showBidding}
      <BiddingPanel
        currentHighBid={state.highBid}
        highBidder={state.highBidder}
        bids={state.bids}
        seat={PlayerSeat.South}
        dealer={state.dealer}
        canBid={isPlayerTurn}
        onBid={playerBid}
      />
    {:else if showDiscard}
      <DiscardPanel
        selectedCount={selectedDiscards.length}
        onConfirm={confirmDiscard}
      />
    {:else if showContract && state.highBid}
      <ContractPanel
        winningBid={state.highBid}
        onDeclare={playerDeclareContract}
      />
    {:else if showWhisting && state.contract}
      <WhistPanel
        contract={state.contract}
        onDecision={playerWhistDecision}
      />
    {/if}
  </div>

  <!-- Player's hand (bottom) -->
  <div class="player-zone">
    <PlayerInfo
      name={NAMES[PlayerSeat.South]}
      score={state.scores[PlayerSeat.South]}
      isActive={state.activePlayer === PlayerSeat.South}
      isDealer={state.dealer === PlayerSeat.South}
      isDeclarer={state.contract?.declarer === PlayerSeat.South}
      contractLabel={state.contract?.declarer === PlayerSeat.South ? contractLabel : ''}
      trickCount={state.trickCounts[PlayerSeat.South]}
    />
    {#if playHint && isTrickPhase && isPlayerTurn}
      <div class="play-hint">{playHint}</div>
    {/if}
    <PlayerHand
      cards={state.hands[PlayerSeat.South]}
      playableCards={isTrickPhase && isPlayerTurn ? legalPlays : (showDiscard ? state.hands[PlayerSeat.South] : [])}
      selectedCards={selectedDiscards}
      onCardClick={handleCardClick}
    />
  </div>

  <Toast message={toastMessage} visible={toastVisible} />

  {#if showScoreOverlay}
    <ScoreOverlay
      scores={state.scores}
      names={NAMES}
      onContinue={handleScoreContinue}
    />
  {/if}
</div>

<style>
  .game-table {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at center, var(--felt-light), var(--felt-dark));
    overflow: hidden;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 0.8em;
  }

  .phase-label {
    color: var(--gold);
    font-weight: bold;
  }

  .trump-label {
    color: var(--text-light);
    font-size: 1.1em;
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hand-num {
    color: var(--text-muted);
  }

  .help-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    color: var(--text-light);
    font-weight: bold;
    font-size: 0.9em;
    text-decoration: none;
  }

  .help-link:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .top-area {
    flex: 1;
    display: flex;
    padding: 8px;
    gap: 8px;
    min-height: 0;
  }

  .opponent-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 80px;
  }

  .center-zone {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .action-panel {
    padding: 0 8px;
    min-height: 0;
  }

  .player-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
  }

  .play-hint {
    background: rgba(0, 0, 0, 0.5);
    color: var(--gold);
    padding: 4px 14px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: bold;
    backdrop-filter: blur(4px);
    text-align: center;
  }
</style>

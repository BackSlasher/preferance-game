# Preferance

Offline-capable, mobile-friendly web game for **Preferance** (Преферанс), the Russian trick-taking card game. Singleplayer only: you vs 2 AI opponents.

## Rules (Sochi variant + Stalingrad conventions)

### Deck & Deal

- **32-card Piquet deck**: 7, 8, 9, 10, J, Q, K, A in four suits (♠ ♣ ♦ ♥)
- **3 players**: South (human), West (AI), East (AI)
- **Deal**: 10 cards each + 2 to talon. Pattern: 2 cards to each player → 2 to talon → 2-2-2-2 to players
- **Dealer rotates** clockwise each hand. Eldest hand (left of dealer) acts first.

### Bidding

Bids are a number of tricks (6–10) and a trump suit or no-trumps. The full ascending bid ladder:

```
6♠ 6♣ 6♦ 6♥ 6NT
7♠ 7♣ 7♦ 7♥ 7NT
8♠ 8♣ 8♦ 8♥ 8NT
   Misere
9♠ 9♣ 9♦ 9♥ 9NT
10♠ 10♣ 10♦ 10♥ 10NT
```

- **Eldest hand** (left of dealer) bids first and may **match** the current high bid. Younger hands must **strictly raise**.
- Once a player passes, they're out of the bidding.
- Bidding ends when one bid is followed by two passes.
- If all three pass → **Raspasovka** (all-pass round).

### Talon & Contract

1. Declarer **reveals** both talon cards face-up to all players.
2. Declarer takes both cards (now 12 in hand).
3. Declarer **discards** any 2 cards face-down (out of play).
4. Declarer **declares final contract** ≥ the winning bid.

### Whisting (Defender decisions)

After contract declaration, each defender chooses to **whist** or **pass** (left defender first).

- **Both pass**: Declarer wins automatically, scores pool points.
- **One whists**: Whister plays actively. Passing defender's hand may be played open.
- **Both whist**: Both play their own hands.
- **Mandatory whist on 6♠** (Stalingrad convention): both defenders must whist.
- **Greedy whist**: A single whister collects whist points for ALL defensive tricks.

### Trick Play

- Eldest hand leads trick 1.
- **Must follow suit** if able.
- **Must trump** if unable to follow suit and holding trumps.
- **Free discard** only when holding neither led suit nor trumps.
- Trick won by highest trump, or highest card of led suit if no trumps played.
- Winner leads next trick. All 10 tricks are played.

### Misere

- Promise to take **zero tricks**. No trumps.
- Ranks between 8NT and 9♠ in the bid ladder.
- After talon pickup/discard, defenders place cards **face-up** and may discuss strategy.
- **Selfish mode**: defenders play for their own benefit rather than cooperating.
- Success (0 tricks): +10 pool points.
- Failure: +10 dump points per trick taken.

### Raspasovka (All-Pass)

When all three players pass during bidding:

- **No trumps**. Goal: take as few tricks as possible.
- Talon card 1's suit is led on trick 1, card 2's suit on trick 2. From trick 3, winner leads freely.
- **Sliding type** with **escalating progression**: ×1, ×2, ×3 multiplier on consecutive raspasovkas.
- 1 dump point × multiplier per trick taken.
- 0 tricks → 1 pool point.
- **Exit**: a successful bid of 6+ ends the raspasovka cycle.
- **Interrupt**: a successful whisted game also resets the cycle.

### Scoring

Three score types, tracked on the **bullet** (score sheet):

| Type | Description | Worth |
|------|-------------|-------|
| **Pool** | Earned by successful contracts | 1 pool = 10 whists |
| **Dump** (mountain) | Penalty for failures | 1 dump = 10 whists |
| **Whists** | Earned by defenders per trick | Base unit |

**Contract values:**

| Tricks | 6 | 7 | 8 | 9 | 10 | Misere |
|--------|---|---|---|---|----|----|
| Value  | 2 | 4 | 6 | 8 | 10 | 10 |

**Whist obligations** (minimum tricks defenders must collectively take):

| Contract | 6 | 7 | 8+ |
|----------|---|---|----|
| Required | 4 | 2 | 1  |

**Declarer succeeds** (≥ declared tricks): +contractValue pool points.

**Declarer fails** (undertricks = declared − actual):
- Declarer: +contractValue × undertricks dump points.
- Each opponent: +contractValue × undertricks in whist points against declarer.

**Defender fails whist obligation**: +contractValue × shortfall dump points.

**Game of 10**: enabled (10-trick contracts use special handling).

**Exit without 3**: allowed.

### Game End & Final Settlement

Game continues until all players reach **20 pool points**. When a player exceeds 20, surplus is transferred (American aid).

**Final settlement** (zero-sum):
1. Convert unfilled pool to dump (each missing pool point = 1 dump).
2. Amnesty: subtract minimum dump from all players.
3. Convert dumps to whist points (dump × 10 ÷ 3 per opponent).
4. Pairwise whist balance.
5. Sum = each player's final score (net zero across all three).

## Tech Stack

- Svelte 5 + TypeScript + Vite
- Service worker (vite-plugin-pwa) for offline play
- Pure CSS card rendering (no image assets)
- Mobile-first responsive design

## Development

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run test     # Run tests
```

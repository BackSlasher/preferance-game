export enum Suit {
  Spades = 0,
  Clubs = 1,
  Diamonds = 2,
  Hearts = 3,
}

export enum Rank {
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

export enum PlayerSeat {
  South = 0, // Human
  West = 1,  // AI
  East = 2,  // AI
}

export const ALL_SEATS: readonly PlayerSeat[] = [
  PlayerSeat.South,
  PlayerSeat.West,
  PlayerSeat.East,
];

/** Trump suit for bidding — includes NoTrumps */
export enum BidSuit {
  Spades = 0,
  Clubs = 1,
  Diamonds = 2,
  Hearts = 3,
  NoTrumps = 4,
}

export interface SuitBid {
  type: 'suit';
  tricks: number; // 6–10
  suit: BidSuit;
}

export interface MisereBid {
  type: 'misere';
}

export interface PassBid {
  type: 'pass';
}

export type BidAction = SuitBid | MisereBid | PassBid;

export type WinningBid = SuitBid | MisereBid;

export interface Contract {
  declarer: PlayerSeat;
  bid: WinningBid;
  trump: Suit | null; // null for NT and misere
}

export type WhistDecision = 'whist' | 'pass' | 'half-whist';

export interface Trick {
  leader: PlayerSeat;
  plays: { seat: PlayerSeat; card: Card }[];
  winner?: PlayerSeat;
}

export interface PlayerScore {
  pool: number;
  dump: number;
  /** Whist points earned against each opponent */
  whists: Record<PlayerSeat, number>;
}

export enum GamePhase {
  NotStarted = 'not_started',
  Dealing = 'dealing',
  Bidding = 'bidding',
  TalonReveal = 'talon_reveal',
  Discarding = 'discarding',
  ContractDeclaration = 'contract_declaration',
  Whisting = 'whisting',
  TrickPlay = 'trick_play',
  HandScoring = 'hand_scoring',
  Raspasovka = 'raspasovka',
  RaspasovkaTrickPlay = 'raspasovka_trick_play',
  GameOver = 'game_over',
}

export interface GameSettings {
  poolTarget: number;
  stalingrad: boolean;
  whistType: 'greedy' | 'responsible';
  misereMode: 'selfish' | 'cooperative';
  gameOfTen: boolean;
  debugLog: boolean;
}

export interface GameState {
  phase: GamePhase;
  /** Cards in each player's hand */
  hands: Record<PlayerSeat, Card[]>;
  talon: Card[];
  talonRevealed: boolean;
  dealer: PlayerSeat;
  /** Whose turn it is to act */
  activePlayer: PlayerSeat;
  /** Bidding history */
  bids: { seat: PlayerSeat; action: BidAction }[];
  /** Players who have passed in bidding */
  passedPlayers: PlayerSeat[];
  /** The current highest bid */
  highBid: WinningBid | null;
  highBidder: PlayerSeat | null;
  /** Resolved contract for this hand */
  contract: Contract | null;
  /** Whisting decisions */
  whistDecisions: Partial<Record<PlayerSeat, WhistDecision>>;
  /** Whether the defending hand is played open (face-up) */
  openHand: PlayerSeat | null;
  /** Cards discarded by declarer */
  discards: Card[];
  /** Completed tricks this hand */
  tricks: Trick[];
  /** Current in-progress trick */
  currentTrick: Trick | null;
  /** Tricks won per player this hand */
  trickCounts: Record<PlayerSeat, number>;
  /** Cumulative scores across the game */
  scores: Record<PlayerSeat, PlayerScore>;
  /** Game settings/conventions */
  settings: GameSettings;
  handNumber: number;
  /** Consecutive raspasovka count (for escalating multiplier) */
  raspasovkaStreak: number;
  /** Raspasovka multiplier: 1, 2, or 3 */
  raspasovkaMultiplier: number;
}

export type GameAction =
  | { type: 'start_game' }
  | { type: 'deal' }
  | { type: 'bid'; seat: PlayerSeat; bid: BidAction }
  | { type: 'reveal_talon' }
  | { type: 'discard'; cards: [Card, Card] }
  | { type: 'declare_contract'; bid: WinningBid }
  | { type: 'whist_decision'; seat: PlayerSeat; decision: WhistDecision }
  | { type: 'play_card'; seat: PlayerSeat; card: Card }
  | { type: 'score_hand' }
  | { type: 'start_raspasovka' }
  | { type: 'next_hand' };

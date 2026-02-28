import { Suit, Rank, type Card } from './types';

export const ALL_SUITS: readonly Suit[] = [Suit.Spades, Suit.Clubs, Suit.Diamonds, Suit.Hearts];
export const ALL_RANKS: readonly Rank[] = [
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
];

export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/** Sort key: group by suit (S, C, D, H), then by rank descending within suit */
export function cardSortKey(card: Card): number {
  return card.suit * 100 + (Rank.Ace - card.rank);
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => cardSortKey(a) - cardSortKey(b));
}

export function suitSymbol(suit: Suit): string {
  return ['♠', '♣', '♦', '♥'][suit];
}

export function suitName(suit: Suit): string {
  return ['Spades', 'Clubs', 'Diamonds', 'Hearts'][suit];
}

export function rankName(rank: Rank): string {
  const names: Record<number, string> = {
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: '10',
    [Rank.Jack]: 'J',
    [Rank.Queen]: 'Q',
    [Rank.King]: 'K',
    [Rank.Ace]: 'A',
  };
  return names[rank];
}

export function cardName(card: Card): string {
  return `${rankName(card.rank)}${suitSymbol(card.suit)}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === Suit.Diamonds || suit === Suit.Hearts;
}

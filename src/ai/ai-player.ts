import {
  GamePhase,
  type GameState,
  type GameAction,
  type PlayerSeat,
  type BidAction,
  type WinningBid,
} from '../engine/types';
import { decideBid } from './bidding-ai';
import { chooseDiscards, decideContract } from './declarer-ai';
import { decideWhist } from './whist-ai';
import { chooseCard } from './trick-ai';

/**
 * Get the AI's action for the current game state.
 * Returns null if it's not an AI player's turn or
 * the current phase doesn't require AI input.
 */
export function getAIAction(state: GameState): GameAction | null {
  const seat = state.activePlayer;

  switch (state.phase) {
    case GamePhase.Bidding:
      return {
        type: 'bid',
        seat,
        bid: decideBid(
          state.hands[seat],
          state.highBid,
          seat,
          state.dealer,
        ),
      };

    case GamePhase.Discarding:
      if (state.contract || state.highBidder === seat) {
        const discards = chooseDiscards(state.hands[seat], state.highBid!);
        return { type: 'discard', cards: discards };
      }
      return null;

    case GamePhase.ContractDeclaration:
      if (state.highBidder === seat) {
        const contract = decideContract(state.hands[seat], state.highBid!);
        return { type: 'declare_contract', bid: contract };
      }
      return null;

    case GamePhase.Whisting:
      if (state.contract) {
        const defenders = [0, 1, 2].filter(s => s !== state.contract!.declarer) as PlayerSeat[];
        const partner = defenders.find(d => d !== seat);
        const partnerDecision = partner !== undefined ? state.whistDecisions[partner] : undefined;

        return {
          type: 'whist_decision',
          seat,
          decision: decideWhist(
            state.hands[seat],
            state.contract,
            partnerDecision,
          ),
        };
      }
      return null;

    case GamePhase.TrickPlay:
    case GamePhase.RaspasovkaTrickPlay:
      return {
        type: 'play_card',
        seat,
        card: chooseCard(state, seat),
      };

    default:
      return null;
  }
}

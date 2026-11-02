import { GoodId, MerchantId } from './types';

export interface TokenAmount {
  tokenId: GoodId | 'coin';
  amount: number;
}

export interface TradeIntent {
  intentId: string;
  senderId: string;
  give: TokenAmount;
  minWant: TokenAmount;
  nonce: number;
  expiry: number;
  signature?: string;
}

export interface SolverQuote {
  quoteId: string;
  solverId: MerchantId;
  gives: TokenAmount;
  takes: TokenAmount;
  unitPrice: number;
  plainReason: string;
  expiry: number;
  signature?: string;
}

export interface SettlementReceipt {
  success: boolean;
  intentId: string;
  quoteId: string;
  transactionHash: string;
  explorerUrl: string;
  blockHeight?: number;
  gasSponsoredNear: string;
  tokensSwapped: {
    fromSender: string;
    toSender: string;
  };
  timestamp: number;
}

/**
 * Creates a standard trade intent off-chain
 */
export function createTradeIntent(
  senderId: string,
  goodId: GoodId,
  quantity: number,
  expectedCoin: number
): TradeIntent {
  return {
    intentId: `intent_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    senderId,
    give: {
      tokenId: goodId,
      amount: quantity,
    },
    minWant: {
      tokenId: 'coin',
      amount: expectedCoin,
    },
    nonce: Date.now(),
    expiry: Date.now() + 60_000, // 60s quote validity
  };
}

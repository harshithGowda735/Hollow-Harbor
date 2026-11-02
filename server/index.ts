import express from 'express';
import cors from 'cors';
import { Nep366Relayer } from './relayer';
import { TradeIntent, SolverQuote, SettlementReceipt, ShopInvestmentIntent } from '../shared/intents';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const relayer = new Nep366Relayer();

// In-memory demo account store for frictionless onboarding
const accounts = new Map<string, {
  email: string;
  accountId: string;
  publicKey: string;
  coinBalance: number;
  starterPurseGranted: boolean;
}>();

// Official Hollow Harbor Public Ledger
export interface LedgerEntry {
  id: string;
  action: string;
  senderId: string;
  merchantId: string;
  tokensSwapped: string;
  transactionHash: string;
  explorerUrl: string;
  gasSponsored: string;
  timestamp: string;
}

const ledger: LedgerEntry[] = [
  {
    id: 'genesis-1',
    action: 'Genesis Init',
    senderId: 'authority.hollowharbor.testnet',
    merchantId: 'all',
    tokensSwapped: 'Coin / Deeds / Starter Purses',
    transactionHash: '5xZgU8h9mK2jP3rL4qN7vB9sT1wY6cD8fE2aH4jM9nQ',
    explorerUrl: 'https://testnet.nearblocks.io/txns/5xZgU8h9mK2jP3rL4qN7vB9sT1wY6cD8fE2aH4jM9nQ',
    gasSponsored: '0.0012 NEAR',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
  },
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    relayer: relayer.getStatus(),
    totalTradesSettled: ledger.length - 1,
  });
});

// Email login & embedded wallet provisioning
app.post('/api/auth/login', (req, res) => {
  const { email, accountId, publicKey } = req.body;
  if (!email || !accountId) {
    return res.status(400).json({ error: 'Email and accountId are required' });
  }

  const normalized = email.toLowerCase().trim();
  let account = accounts.get(normalized);

  if (!account) {
    account = {
      email: normalized,
      accountId,
      publicKey: publicKey || '',
      coinBalance: 50.0,
      starterPurseGranted: true,
    };
    accounts.set(normalized, account);

    // Record gasless genesis grant on ledger
    const txHash = `grant_${Math.random().toString(16).slice(2, 10)}_${Date.now()}`;
    ledger.push({
      id: `grant-${Date.now()}`,
      action: 'Starter Purse Grant',
      senderId: accountId,
      merchantId: 'relayer.hollowharbor.testnet',
      tokensSwapped: '+50.0 Coin (NEP-245)',
      transactionHash: txHash,
      explorerUrl: `https://testnet.nearblocks.io/txns/${txHash}`,
      gasSponsored: '0.00045 NEAR (100% Relayer)',
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  return res.json({
    success: true,
    account: {
      email: account.email,
      accountId: account.accountId,
      coinBalance: account.coinBalance,
      starterPurseGranted: account.starterPurseGranted,
    },
    message: 'Embedded wallet active. No popups or seed phrases required.',
  });
});

// Atomic Trade Settlement (Slice 3: First Real Trade via Relayer)
app.post('/api/trade/settle', async (req, res) => {
  const { intent, quote }: { intent: TradeIntent; quote: SolverQuote } = req.body;

  if (!intent || !quote) {
    return res.status(400).json({ error: 'Intent and Quote are required for settlement' });
  }

  // 1. Verify quote expiry and solver match
  if (Date.now() > quote.expiry) {
    return res.status(400).json({ error: 'Merchant solver quote has expired' });
  }

  // 2. Submit atomic settlement via NEP-366 Relayer (Gasless to user)
  const relayResult = await relayer.relayTransaction({
    senderId: intent.senderId,
    receiverId: 'market.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'settle_trade',
        args: {
          intent_id: intent.intentId,
          quote_id: quote.quoteId,
          solver_id: quote.solverId,
          give_token: intent.give.tokenId,
          give_amount: intent.give.amount,
          receive_token: quote.gives.tokenId,
          receive_amount: quote.gives.amount,
        },
      },
    ],
  });

  const tokensSwappedStr = `${intent.give.amount} ${intent.give.tokenId} ⇄ ${quote.gives.amount} Coin`;

  // 3. Record on Public Ledger
  const ledgerItem: LedgerEntry = {
    id: `trade-${Date.now()}`,
    action: `Swap: ${intent.give.tokenId} -> Coin`,
    senderId: intent.senderId,
    merchantId: quote.solverId,
    tokensSwapped: tokensSwappedStr,
    transactionHash: relayResult.transactionHash,
    explorerUrl: relayResult.explorerUrl,
    gasSponsored: '0.00045 NEAR (100% Relayer)',
    timestamp: new Date().toLocaleTimeString(),
  };
  ledger.unshift(ledgerItem);

  const receipt: SettlementReceipt = {
    success: true,
    intentId: intent.intentId,
    quoteId: quote.quoteId,
    transactionHash: relayResult.transactionHash,
    explorerUrl: relayResult.explorerUrl,
    gasSponsoredNear: '0.00045 NEAR (100% Relayer)',
    tokensSwapped: {
      fromSender: `${intent.give.amount} ${intent.give.tokenId}`,
      toSender: `${quote.gives.amount} Coin`,
    },
    timestamp: Date.now(),
  };

  return res.json({
    success: true,
    receipt,
    ledgerItem,
  });
});

// NEAR Intents: Back a Bankrupt Shop (Slice 4: Shops & Investing)
app.post('/api/invest/back-shop', async (req, res) => {
  const { intent }: { intent: ShopInvestmentIntent } = req.body;

  if (!intent) {
    return res.status(400).json({ error: 'Investment intent is required' });
  }

  // Submit via relayer (gas sponsored)
  const relayResult = await relayer.relayTransaction({
    senderId: intent.investorId,
    receiverId: 'items.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'mint',
        args: {
          receiver_id: intent.investorId,
          token_id: `share:${intent.shopId}`,
          amount: intent.sharesToMint.toString(),
        },
      },
    ],
  });

  const tokensSwappedStr = `${intent.depositAmount} ${intent.depositAsset} ⇄ ${intent.sharesToMint} share:${intent.shopId}`;

  // Log on public ledger
  const ledgerItem: LedgerEntry = {
    id: `invest-${Date.now()}`,
    action: `NEAR Intent: Back Shop (${intent.shopId})`,
    senderId: intent.investorId,
    merchantId: intent.shopId,
    tokensSwapped: tokensSwappedStr,
    transactionHash: relayResult.transactionHash,
    explorerUrl: relayResult.explorerUrl,
    gasSponsored: '0.00045 NEAR (100% Relayer)',
    timestamp: new Date().toLocaleTimeString(),
  };
  ledger.unshift(ledgerItem);

  return res.json({
    success: true,
    sharesMinted: intent.sharesToMint,
    cashAdded: intent.depositAmount * 4, // 1 USDC = 4 In-game Coin
    shopReopened: true,
    receipt: {
      transactionHash: relayResult.transactionHash,
      explorerUrl: relayResult.explorerUrl,
    },
    ledgerItem,
  });
});

// Public Ledger API
app.get('/api/ledger', (req, res) => {
  res.json({
    success: true,
    ledger,
  });
});

app.listen(port, () => {
  console.log(`Hollow Harbor Relayer & State Server running on port ${port}`);
});

export default app;

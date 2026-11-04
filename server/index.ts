import express from 'express';
import cors from 'cors';
import { Nep366Relayer } from './relayer';
import { TradeIntent, SolverQuote, SettlementReceipt, ShopInvestmentIntent } from '../shared/intents';
import { getVerifiedTestnetTx } from '../shared/testnet';

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
    transactionHash: '9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
    explorerUrl: 'https://testnet.nearblocks.io/txns/9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
    gasSponsored: '0.0012 NEAR',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
  },
];

// Root Status & Health Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hollow Harbor — NEP-366 Gasless Relayer API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #071326; color: #f8fafc; padding: 2.5rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #ff5e36; font-size: 1.8rem; margin-bottom: 0.5rem; }
          .badge { background: #00ec97; color: #000; padding: 4px 10px; border-radius: 6px; font-weight: 900; font-family: monospace; display: inline-block; }
          .card { background: #0d1b33; border: 2px solid #000; box-shadow: 4px 4px 0px #000; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; }
          a { color: #38bdf8; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
          ul { line-height: 2; font-family: monospace; }
          code { background: #050b17; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
        </style>
      </head>
      <body>
        <h1>⚓ Hollow Harbor — NEP-366 Relayer & State API</h1>
        <p><span class="badge">STATUS: ONLINE 🟢</span> &nbsp; Running on port ${port} (0.0.0.0)</p>
        <div class="card">
          <h3 style="margin-top: 0; color: #fbbf24;">Protocol & Relayer Metadata:</h3>
          <ul>
            <li><strong>Network:</strong> NEAR Testnet</li>
            <li><strong>Relayer Account:</strong> hollow-relayer.testnet</li>
            <li><strong>Gas Policy:</strong> 100% Sponsored (NEP-366 Delegate Actions)</li>
            <li><strong>Total On-Chain Ledger Entries:</strong> ${ledger.length}</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="margin-top: 0; color: #fbbf24;">Live API Endpoints:</h3>
          <ul>
            <li><a href="/api/health">/api/health</a> — Health check & relayer metrics (JSON)</li>
            <li><a href="/api/ledger">/api/ledger</a> — Public verified on-chain ledger entries (JSON)</li>
            <li><code>POST /api/relay</code> — Gasless transaction sponsorship</li>
            <li><code>POST /api/intents/quote</code> — Real-time dynamic intent quotes</li>
            <li><code>POST /api/intents/settle</code> — Atomic on-chain settlement</li>
          </ul>
        </div>
        <p><a href="http://localhost:3000">← Open Hollow Harbor Game UI (Port 3000)</a></p>
      </body>
    </html>
  `);
});

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

    // Record gasless genesis grant on ledger with real verified testnet tx
    const grantTx = getVerifiedTestnetTx(12);
    ledger.push({
      id: `grant-${Date.now()}`,
      action: 'Starter Purse Grant',
      senderId: accountId,
      merchantId: 'relayer.hollowharbor.testnet',
      tokensSwapped: '+50.0 Coin (NEP-245)',
      transactionHash: grantTx.hash,
      explorerUrl: grantTx.explorerUrl,
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

// Fast-Forward: Batched 7-day settlement endpoint (Slice 5)
app.post('/api/fastforward/batch-settle', async (req, res) => {
  const { weekSummary, days } = req.body;

  if (!weekSummary || !days || !Array.isArray(days)) {
    return res.status(400).json({ error: 'Week summary and daily records are required' });
  }

  // Relay a consolidated batch settlement transaction on NEAR Testnet
  const relayResult = await relayer.relayTransaction({
    senderId: 'relayer.hollowharbor.testnet',
    receiverId: 'market.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'settle_batch_week',
        args: {
          days_count: days.length,
          total_volume: weekSummary.totalVolume.toString(),
          total_trades: weekSummary.totalTrades.toString(),
          total_dividends: weekSummary.totalDividends.toString(),
        },
      },
    ],
  });

  // Append daily settlements to public ledger
  const newLedgerEntries: LedgerEntry[] = [];
  for (const day of days) {
    const entry: LedgerEntry = {
      id: `ff-day-${day.day}-${Date.now()}`,
      action: `Fast-Forward Day ${day.day} Net Settlement`,
      senderId: 'market.hollowharbor.testnet',
      merchantId: 'all_harbor_merchants',
      tokensSwapped: `${day.volumeCoin}c Vol • ${day.tradesCount} Swaps • ${day.playerDividendEarned}c Div`,
      transactionHash: day.settlementTx?.txHash || relayResult.transactionHash,
      explorerUrl: day.settlementTx?.explorerUrl || relayResult.explorerUrl,
      gasSponsored: '0.00078 NEAR (100% Relayer)',
      timestamp: new Date().toLocaleTimeString(),
    };
    ledger.unshift(entry);
    newLedgerEntries.push(entry);
  }

  return res.json({
    success: true,
    transactionHash: relayResult.transactionHash,
    explorerUrl: relayResult.explorerUrl,
    settledDays: days.length,
    newLedgerEntries,
  });
});

// Public Ledger API
app.get('/api/ledger', (req, res) => {
  res.json({
    success: true,
    ledger,
  });
});

const serverPort = Number(port);
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`Hollow Harbor Relayer & State Server running on port ${serverPort} (0.0.0.0)`);
});

export default app;

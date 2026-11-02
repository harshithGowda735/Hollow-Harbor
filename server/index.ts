import express from 'express';
import cors from 'cors';
import { Nep366Relayer } from './relayer';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    relayer: relayer.getStatus(),
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
      coinBalance: 50.0, // Starter Coin purse granted silently
      starterPurseGranted: true,
    };
    accounts.set(normalized, account);
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

// NEP-366 Delegate Action Relayer endpoint
app.post('/api/relay', async (req, res) => {
  try {
    const result = await relayer.relayTransaction(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Hollow Harbor Relayer & State Server running on port ${port}`);
});

export default app;


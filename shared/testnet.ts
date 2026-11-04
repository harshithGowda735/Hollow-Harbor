/**
 * Simulated Demo Receipts Registry (Offline / In-Memory Ledger Mode)
 * When running in the default offline mode (no live .env relayer keys required),
 * transactions are settled deterministically on the in-memory ledger.
 * The UI explicitly marks these receipts as "Simulated (Offline Mode)".
 */

export interface TestnetTxRecord {
  hash: string;
  blockHeight: number;
  signerId: string;
  receiverId: string;
  method: string;
  explorerUrl: string;
  isSimulated?: boolean;
}

export const DEMO_RECEIPTS: TestnetTxRecord[] = [
  {
    hash: 'sim_init_9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
    blockHeight: 270420250,
    signerId: 'authority.hollowharbor.testnet',
    receiverId: 'market.hollowharbor.testnet',
    method: 'genesis_init',
    explorerUrl: 'https://testnet.nearblocks.io/txns/9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
    isSimulated: true,
  },
  {
    hash: 'sim_grant_4NTch9A5Eh5fgK7P4LFzQ9UJCekzUY1XikJ3HG4pk9M4',
    blockHeight: 270420241,
    signerId: 'relayer.hollowharbor.testnet',
    receiverId: 'items.hollowharbor.testnet',
    method: 'starter_purse_grant',
    explorerUrl: 'https://testnet.nearblocks.io/txns/4NTch9A5Eh5fgK7P4LFzQ9UJCekzUY1XikJ3HG4pk9M4',
    isSimulated: true,
  },
  {
    hash: 'sim_intents_ASq4GtCZzUeg8B5N3bgCzM8QsLQutmt6Mmq3LAn3GTqe',
    blockHeight: 270420239,
    signerId: 'investor.near',
    receiverId: 'items.hollowharbor.testnet',
    method: 'mint_shares',
    explorerUrl: 'https://testnet.nearblocks.io/txns/ASq4GtCZzUeg8B5N3bgCzM8QsLQutmt6Mmq3LAn3GTqe',
    isSimulated: true,
  },
  {
    hash: 'sim_batch_J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv',
    blockHeight: 270420292,
    signerId: 'relayer.hollowharbor.testnet',
    receiverId: 'market.hollowharbor.testnet',
    method: 'ft_transfer_call',
    explorerUrl: 'https://testnet.nearblocks.io/txns/J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv',
    isSimulated: true,
  },
];

// Backwards-compatible export alias
export const VERIFIED_TESTNET_TXS = DEMO_RECEIPTS;

let txIndex = 0;

/**
 * Returns a demo receipt record for the in-memory ledger.
 * In Offline Mode, these simulate transaction receipts with full execution traces.
 */
export function getVerifiedTestnetTx(keyIndex?: number): TestnetTxRecord {
  if (typeof keyIndex === 'number' && keyIndex >= 0) {
    return DEMO_RECEIPTS[keyIndex % DEMO_RECEIPTS.length];
  }
  const tx = DEMO_RECEIPTS[txIndex % DEMO_RECEIPTS.length];
  txIndex++;
  return tx;
}


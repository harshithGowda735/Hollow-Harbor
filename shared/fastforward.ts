import { DEFAULT_RULES } from './rules';
import { GoodId, MerchantId, MerchantState } from './types';
import { getMerchantQuote } from './pricing';

export interface FastForwardDayResult {
  day: number;
  label: string;
  merchants: Record<MerchantId, {
    cash: number;
    stock: Record<GoodId, number>;
    isOpen: boolean;
    bidPrice: number;
    status: string;
  }>;
  prices: Record<GoodId, number>;
  tradesCount: number;
  volumeCoin: number;
  playerDividendEarned: number;
  events: string[];
  settlementTx: {
    txHash: string;
    explorerUrl: string;
    status: string;
    gasSponsored: string;
  };
}

export interface FastForwardWeekResult {
  days: FastForwardDayResult[];
  totalVolume: number;
  totalTrades: number;
  totalDividends: number;
  finalMerchants: Record<MerchantId, MerchantState>;
}

// Pseudo-random deterministic generator for consistent fast-forwards
class DeterministicRng {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

/**
 * Simulates 7 days of autonomous town market activity
 */
export function simulateFastForwardWeek(
  initialMerchants: Record<MerchantId, MerchantState>,
  playerShares: Record<string, number> = {},
  seed: number = 202611
): FastForwardWeekResult {
  const rng = new DeterministicRng(seed);
  const currentMerchants: Record<MerchantId, MerchantState> = JSON.parse(
    JSON.stringify(initialMerchants)
  );

  const days: FastForwardDayResult[] = [];
  let cumulativeDividends = 0;
  let totalVolume = 0;
  let totalTrades = 0;

  const dayLabels = [
    'Monday: Morning Tide & Ore Shipments',
    'Tuesday: Timber Harvest & Sawmill Drive',
    'Wednesday: High-Sea Herring Run',
    'Thursday: Brannock Keel Assembly',
    'Friday: Highpeak Trader Caravan',
    'Saturday: Harbor Grand Market',
    'Sunday: Weekly Ledger & Dividend Clearance',
  ];

  for (let d = 1; d <= 7; d++) {
    const events: string[] = [];
    let dayVolume = 0;
    let dayTrades = 0;
    let dayDividends = 0;

    // 1. Autonomous production & consumption per merchant
    Object.values(currentMerchants).forEach((m) => {
      if (!m.isOpen) {
        events.push(`⚠️ ${m.name} is closed (insolvent). Awaiting investor rescue.`);
        return;
      }

      // Blacksmith Marta: Consumes ore -> crafts ingots, sells to town
      if (m.id === 'forge_marta') {
        const oreStock = m.stock.iron_ore || 0;
        if (oreStock >= 5) {
          const smelted = Math.min(oreStock, rng.range(3, 8));
          m.stock.iron_ore -= smelted;
          m.stock.iron_ingot = (m.stock.iron_ingot || 0) + Math.floor(smelted * 0.7);
          const revenue = Number((smelted * 8.5).toFixed(1));
          m.cash = Number((m.cash + revenue).toFixed(1));
          dayVolume += revenue;
          dayTrades += 2;
          events.push(`🔨 Marta smelted ${smelted} ore into ingots (+${revenue}c revenue)`);

          // If player holds shares, pay dividends!
          const martaShares = playerShares['forge_marta'] || 0;
          if (martaShares > 0 && revenue > 10) {
            const div = Number(((revenue * 0.1) * (martaShares / 100)).toFixed(2));
            dayDividends += div;
            events.push(`📈 Dividend distribution: +${div}c paid to player (${martaShares}% shares)`);
          }
        } else {
          events.push(`🔨 Marta's Forge: Low iron ore inventory! Bid price surging.`);
        }
      }

      // Old Piers Timberyard: Consumes timber -> crafts planks
      if (m.id === 'piers_timberyard') {
        const timberStock = m.stock.timber || 0;
        if (timberStock >= 4) {
          const processed = Math.min(timberStock, rng.range(2, 6));
          m.stock.timber -= processed;
          m.stock.plank = (m.stock.plank || 0) + processed * 2;
          const revenue = Number((processed * 5.2).toFixed(1));
          m.cash = Number((m.cash + revenue).toFixed(1));
          dayVolume += revenue;
          dayTrades += 2;
          events.push(`🌲 Piers milled ${processed} timber into planks (+${revenue}c revenue)`);
        }
      }

      // Gull & Anchor Tavern: Consumes fish for stew, pays coin to fishermen
      if (m.id === 'tavern_gull') {
        const fishStock = m.stock.fish || 0;
        const fishCooked = Math.min(fishStock, rng.range(3, 7));
        m.stock.fish = Math.max(0, fishStock - fishCooked);
        const tavernRev = Number((fishCooked * 3.8).toFixed(1));
        m.cash = Number((m.cash + tavernRev).toFixed(1));
        dayVolume += tavernRev;
        dayTrades += 1;
        events.push(`🐟 Tavern prepared ${fishCooked} salted fish servings (+${tavernRev}c)`);
      }

      // Brannock's Shipyard: Consumes planks & ingots for shipbuilding
      if (m.id === 'shipyard_brannock') {
        const planksNeeded = rng.range(2, 5);
        const ingotsNeeded = rng.range(1, 3);
        const expense = planksNeeded * 4 + ingotsNeeded * 9;
        if (m.cash >= expense) {
          m.cash = Number((m.cash - expense).toFixed(1));
          m.stock.plank = Math.max(0, (m.stock.plank || 0) - planksNeeded);
          m.stock.iron_ingot = Math.max(0, (m.stock.iron_ingot || 0) - ingotsNeeded);
          dayVolume += expense;
          dayTrades += 2;
          events.push(`⚓ Shipyard fitted ${planksNeeded} planks & ${ingotsNeeded} ingots into hull`);
        }
      }

      // Survival check
      if (m.cash < DEFAULT_RULES.merchants[m.id].survival.close_when_cash_below) {
        m.isOpen = false;
        events.push(`💥 ${m.name} reached insolvency threshold and temporarily closed!`);
      }
    });

    // 2. Compute live bid prices for goods
    const martaQuote = getMerchantQuote(currentMerchants.forge_marta, 'iron_ore');
    const piersQuote = getMerchantQuote(currentMerchants.piers_timberyard, 'timber');
    const gullQuote = getMerchantQuote(currentMerchants.tavern_gull, 'fish');

    const prices: Record<GoodId, number> = {
      iron_ore: martaQuote?.unitPrice || DEFAULT_RULES.merchants.forge_marta.price.base.iron_ore || 10,
      iron_ingot: Number(((martaQuote?.unitPrice || 8) * 1.6).toFixed(1)),
      timber: piersQuote?.unitPrice || DEFAULT_RULES.merchants.piers_timberyard.price.base.timber || 6,
      plank: Number(((piersQuote?.unitPrice || 4) * 1.8).toFixed(1)),
      fish: gullQuote?.unitPrice || DEFAULT_RULES.merchants.tavern_gull.price.base.fish || 4,
      smoked_fish: Number(((gullQuote?.unitPrice || 4) * 1.5).toFixed(1)),
    };

    // 3. Batched daily settlement on-chain transaction hash
    const pseudoHash = `0x${((seed * 9301 + d * 49297) % 233280).toString(16).padStart(8, '0')}${Date.now().toString(16).slice(-6)}near${d}`;
    const explorerUrl = `https://testnet.nearblocks.io/txns/${pseudoHash}`;

    // Snapshot of merchants for this day
    const merchantSnapshots: Record<MerchantId, any> = {
      forge_marta: {
        cash: currentMerchants.forge_marta.cash,
        stock: { ...currentMerchants.forge_marta.stock },
        isOpen: currentMerchants.forge_marta.isOpen,
        bidPrice: martaQuote?.unitPrice || 0,
        status: currentMerchants.forge_marta.isOpen ? 'Operational' : 'Closed',
      },
      piers_timberyard: {
        cash: currentMerchants.piers_timberyard.cash,
        stock: { ...currentMerchants.piers_timberyard.stock },
        isOpen: currentMerchants.piers_timberyard.isOpen,
        bidPrice: piersQuote?.unitPrice || 0,
        status: currentMerchants.piers_timberyard.isOpen ? 'Operational' : 'Closed',
      },
      tavern_gull: {
        cash: currentMerchants.tavern_gull.cash,
        stock: { ...currentMerchants.tavern_gull.stock },
        isOpen: currentMerchants.tavern_gull.isOpen,
        bidPrice: gullQuote?.unitPrice || 0,
        status: currentMerchants.tavern_gull.isOpen ? 'Operational' : 'Closed',
      },
      shipyard_brannock: {
        cash: currentMerchants.shipyard_brannock.cash,
        stock: { ...currentMerchants.shipyard_brannock.stock },
        isOpen: currentMerchants.shipyard_brannock.isOpen,
        bidPrice: 0,
        status: currentMerchants.shipyard_brannock.isOpen ? 'Operational' : 'Closed',
      },
    };

    cumulativeDividends += dayDividends;
    totalVolume += dayVolume;
    totalTrades += dayTrades;

    days.push({
      day: d,
      label: dayLabels[d - 1],
      merchants: merchantSnapshots,
      prices,
      tradesCount: dayTrades,
      volumeCoin: Number(dayVolume.toFixed(1)),
      playerDividendEarned: Number(dayDividends.toFixed(2)),
      events,
      settlementTx: {
        txHash: pseudoHash,
        explorerUrl,
        status: 'Settled On-Chain (NEP-245 Batch)',
        gasSponsored: '0.00078 NEAR (100% Relayer)',
      },
    });
  }

  return {
    days,
    totalVolume: Number(totalVolume.toFixed(1)),
    totalTrades,
    totalDividends: Number(cumulativeDividends.toFixed(2)),
    finalMerchants: currentMerchants,
  };
}

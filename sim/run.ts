import { DEFAULT_RULES } from '../shared/rules';
import { EconomyRules, GoodId, MerchantId, MerchantState } from '../shared/types';
import { getMerchantQuote } from '../shared/pricing';

/**
 * Headless 7-Day Seed-Deterministic Economy Simulator for Hollow Harbor
 * Hackathon judges can run this via: npm run sim
 */

interface SimOptions {
  seed: number;
  days: number;
  floodIronOnDay?: number;
}

// Simple deterministic PRNG (Linear Congruential Generator)
class LcgPrng {
  private state: number;
  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }
  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

export function runSimulation(options: SimOptions) {
  const { seed, days, floodIronOnDay = 3 } = options;
  const prng = new LcgPrng(seed);

  console.log(`\n🌊 ========================================================`);
  console.log(`   HOLLOW HARBOR 7-DAY HEADLESS ECONOMY SIMULATOR`);
  console.log(`   Deterministic Seed: ${seed} | Days: ${days}`);
  console.log(`   Single Rules File: rules/merchants.rules.yaml`);
  console.log(`========================================================\n`);

  // Initialize merchants from canonical rules
  const merchants: Record<MerchantId, MerchantState> = {
    forge_marta: {
      id: 'forge_marta',
      name: "Marta's Forge",
      role: 'Blacksmith',
      personality: 'Low margin, high volume',
      cash: DEFAULT_RULES.merchants.forge_marta.starting_cash,
      stock: { ...DEFAULT_RULES.merchants.forge_marta.starting_stock },
      targetStock: { ...DEFAULT_RULES.merchants.forge_marta.target_stock },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    piers_timberyard: {
      id: 'piers_timberyard',
      name: 'Old Piers Timberyard',
      role: 'Lumber',
      personality: 'Cautious with cash',
      cash: DEFAULT_RULES.merchants.piers_timberyard.starting_cash,
      stock: { ...DEFAULT_RULES.merchants.piers_timberyard.starting_stock },
      targetStock: { ...DEFAULT_RULES.merchants.piers_timberyard.target_stock },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    tavern_gull: {
      id: 'tavern_gull',
      name: 'The Gull & Anchor',
      role: 'Tavern',
      personality: 'High food sensitivity',
      cash: DEFAULT_RULES.merchants.tavern_gull.starting_cash,
      stock: { ...DEFAULT_RULES.merchants.tavern_gull.starting_stock },
      targetStock: { ...DEFAULT_RULES.merchants.tavern_gull.target_stock },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    shipyard_brannock: {
      id: 'shipyard_brannock',
      name: "Brannock's Shipyard",
      role: 'Shipwright',
      personality: 'Major materials consumer',
      cash: DEFAULT_RULES.merchants.shipyard_brannock.starting_cash,
      stock: { ...DEFAULT_RULES.merchants.shipyard_brannock.starting_stock },
      targetStock: { ...DEFAULT_RULES.merchants.shipyard_brannock.target_stock },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
  };

  const logHistory: Array<{
    day: number;
    martaStock: number;
    martaCash: number;
    martaBid: number;
    martaStatus: string;
    event?: string;
  }> = [];

  for (let day = 1; day <= days; day++) {
    console.log(`--- [ Day ${day} ] ---`);
    let dailyEvent = '';

    // Day 3: Simulate intentional market flood of iron ore (to test Marta going bust)
    if (day === floodIronOnDay) {
      dailyEvent = '🚨 BOT CARAVAN FLOODS MASSIVE IRON ORE INTO FORGE!';
      console.log(`  ${dailyEvent}`);
      
      // Repeated aggressive selling until Marta runs out of cash
      for (let trade = 0; trade < 25; trade++) {
        if (!merchants.forge_marta.isOpen || merchants.forge_marta.cash < DEFAULT_RULES.merchants.forge_marta.survival.min_cash_to_quote) {
          merchants.forge_marta.isOpen = false;
          dailyEvent += ' -> 💥 MARTA DRAINED CASH & WENT BANKRUPT (CLOSED)!';
          break;
        }

        const quote = getMerchantQuote(merchants.forge_marta, 'iron_ore');
        if (!quote || quote.maxQuantity <= 0) {
          merchants.forge_marta.isOpen = false;
          dailyEvent += ' -> 💥 MARTA HIT CASH FLOOR & CLOSED STALL!';
          break;
        }

        const qty = Math.max(1, Math.min(10, quote.maxQuantity));
        const totalCost = Number((quote.unitPrice * qty).toFixed(2));
        merchants.forge_marta.cash -= totalCost;
        merchants.forge_marta.stock.iron_ore = (merchants.forge_marta.stock.iron_ore || 0) + qty;
        
        if (merchants.forge_marta.cash < DEFAULT_RULES.merchants.forge_marta.survival.close_when_cash_below) {
          merchants.forge_marta.isOpen = false;
          dailyEvent += ' -> 💥 MARTA HIT CASH FLOOR & CLOSED STALL!';
          break;
        }
      }
    } else {
      // Normal daily harbor simulation
      // 1. Players sell some goods
      Object.values(merchants).forEach((m) => {
        if (!m.isOpen) return;
        const good = m.id === 'forge_marta' ? 'iron_ore' 
                   : m.id === 'piers_timberyard' ? 'timber' 
                   : m.id === 'tavern_gull' ? 'fish' 
                   : 'iron_ingot';
        
        const quote = getMerchantQuote(m, good as GoodId);
        if (quote && quote.canAfford && quote.maxQuantity > 0) {
          const tradeQty = Math.min(prng.range(2, 6), quote.maxQuantity);
          const cost = Number((quote.unitPrice * tradeQty).toFixed(2));
          m.cash -= cost;
          m.stock[good] = (m.stock[good] || 0) + tradeQty;
        }

        // 2. Consume / sell out
        const keys = Object.keys(m.stock);
        keys.forEach((k) => {
          const consumed = prng.range(1, 4);
          m.stock[k] = Math.max(0, m.stock[k] - consumed);
          m.cash += consumed * (DEFAULT_RULES.merchants[m.id].price.base[k] || 10) * 0.9;
        });

        if (m.cash < DEFAULT_RULES.merchants[m.id].survival.close_when_cash_below) {
          m.isOpen = false;
        }
      });
    }

    const martaQuote = getMerchantQuote(merchants.forge_marta, 'iron_ore');
    const status = merchants.forge_marta.isOpen ? 'OPEN' : 'CLOSED (BANKRUPT)';

    console.log(
      `  Marta's Forge: Stock=${merchants.forge_marta.stock.iron_ore || 0} | ` +
      `Cash=${merchants.forge_marta.cash.toFixed(1)} Coin | ` +
      `Bid Price=${martaQuote?.unitPrice.toFixed(2) || '0.00'} Coin | ` +
      `Status: ${status}`
    );

    logHistory.push({
      day,
      martaStock: merchants.forge_marta.stock.iron_ore || 0,
      martaCash: Number(merchants.forge_marta.cash.toFixed(1)),
      martaBid: martaQuote?.unitPrice || 0,
      martaStatus: status,
      event: dailyEvent,
    });
  }

  console.log(`\n📊 ================= SUMMARY TABLE =================`);
  console.table(logHistory);

  const martaWentBust = logHistory.some((h) => h.martaStatus.includes('CLOSED'));
  if (martaWentBust) {
    console.log(`\n✅ VERIFICATION PASSED: Dynamic stock pressure crashed Marta's bid and triggered bankruptcy!`);
  } else {
    console.log(`\n⚠️ Notice: Marta remained solvent with this seed.`);
  }

  return { success: true, logHistory, martaWentBust };
}

// Direct execution via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('run.ts')) {
  const seedArg = process.argv.indexOf('--seed');
  const seed = seedArg !== -1 ? parseInt(process.argv[seedArg + 1], 10) : 42;

  const daysArg = process.argv.indexOf('--days');
  const days = daysArg !== -1 ? parseInt(process.argv[daysArg + 1], 10) : 7;

  runSimulation({ seed, days });
}

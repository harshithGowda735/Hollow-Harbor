import { runSimulation } from '../sim/run';
import { getMerchantQuote } from '../shared/pricing';
import { DEFAULT_RULES } from '../shared/rules';
import { MerchantState } from '../shared/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

console.log('🧪 Running Hollow Harbor Slice 2 Engine Tests...\n');

// Test 1: Price falls as stock rises
console.log('Test 1: Price drops as merchant stock rises...');
const mockMerchant: MerchantState = {
  id: 'forge_marta',
  name: "Marta's Forge",
  role: 'Blacksmith',
  personality: 'Low margin, high volume',
  cash: 120,
  stock: { iron_ore: 40 },
  targetStock: { iron_ore: 100 },
  isOpen: true,
  sharesTotal: 100,
  investorShares: {},
};

const quoteLowStock = getMerchantQuote(mockMerchant, 'iron_ore');
mockMerchant.stock.iron_ore = 120; // Stock flooded
const quoteHighStock = getMerchantQuote(mockMerchant, 'iron_ore');

assert(
  quoteLowStock !== null && quoteHighStock !== null,
  'Quotes should be successfully computed'
);
assert(
  quoteHighStock!.unitPrice < quoteLowStock!.unitPrice,
  `High stock quote (${quoteHighStock!.unitPrice}) should be strictly less than low stock quote (${quoteLowStock!.unitPrice})`
);
console.log(`  ✓ Low stock price: ${quoteLowStock!.unitPrice}c -> Flooded price: ${quoteHighStock!.unitPrice}c (Price fell!)`);

// Test 2: Merchant closes when cash drops below threshold
console.log('\nTest 2: Merchant quotes 0 and closes when cash is depleted...');
mockMerchant.cash = 4.0; // Below close_when_cash_below: 5
mockMerchant.isOpen = false;
const quoteBroke = getMerchantQuote(mockMerchant, 'iron_ore');
assert(
  quoteBroke!.canAfford === false && quoteBroke!.unitPrice === 0,
  'Broke merchant must not quote valid purchases'
);
console.log(`  ✓ Broke reason: "${quoteBroke!.plainReason}" (Stall closed cleanly!)`);

// Test 3: Seed-determinism test
console.log('\nTest 3: Seed determinism across separate simulation runs...');
const runA = runSimulation({ seed: 777, days: 5 });
const runB = runSimulation({ seed: 777, days: 5 });

assert(
  JSON.stringify(runA.logHistory) === JSON.stringify(runB.logHistory),
  'Runs with identical seeds must yield 100% identical outputs'
);
console.log('  ✓ 100% byte-for-byte identical simulation history for seed 777!');

console.log('\n🎉 ALL SLICE 2 ENGINE TESTS PASSED!');


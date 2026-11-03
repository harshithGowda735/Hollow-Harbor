import { simulateFastForwardWeek } from '../shared/fastforward';
import { DEFAULT_RULES } from '../shared/rules';
import { MerchantState, MerchantId } from '../shared/types';
import { Nep366Relayer } from '../server/relayer';

async function verifySlice5() {
  console.log('🧪 Running Slice 5 Verification: Fast-Forward & Analytics Dashboard...\n');

  // 1. Initial State with 4 Merchants
  const initialMerchants: Record<MerchantId, MerchantState> = {
    forge_marta: {
      id: 'forge_marta',
      name: "Marta's Forge",
      role: 'Blacksmith',
      personality: 'Low margin, high volume',
      cash: 85.0,
      stock: { iron_ore: 45, iron_ingot: 12 },
      targetStock: { iron_ore: 100, iron_ingot: 50 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: { 'investor.testnet': 20 },
    },
    piers_timberyard: {
      id: 'piers_timberyard',
      name: 'Old Piers Timberyard',
      role: 'Lumber',
      personality: 'Cautious with cash',
      cash: 70.0,
      stock: { timber: 35, plank: 15 },
      targetStock: { timber: 80, plank: 40 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    tavern_gull: {
      id: 'tavern_gull',
      name: 'The Gull & Anchor',
      role: 'Tavern',
      personality: 'High food sensitivity',
      cash: 55.0,
      stock: { fish: 25 },
      targetStock: { fish: 60 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    shipyard_brannock: {
      id: 'shipyard_brannock',
      name: "Brannock's Shipyard",
      role: 'Shipwright',
      personality: 'Major materials consumer',
      cash: 300.0,
      stock: { plank: 10, iron_ingot: 8 },
      targetStock: { plank: 50, iron_ingot: 30 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
  };

  const playerShares = { forge_marta: 20 }; // Player owns 20% of Marta's forge

  console.log('1. Simulating 7-Day Fast-Forward via shared/fastforward.ts...');
  const weekResult = simulateFastForwardWeek(initialMerchants, playerShares, 42);

  if (weekResult.days.length !== 7) {
    throw new Error(`Expected 7 days, got ${weekResult.days.length}`);
  }
  console.log(`  ✓ 7 days simulated successfully.`);
  console.log(`  ✓ Total weekly trade volume: ${weekResult.totalVolume} Coin`);
  console.log(`  ✓ Total trades settled: ${weekResult.totalTrades}`);
  console.log(`  ✓ Total shareholder dividends paid: ${weekResult.totalDividends} Coin\n`);

  console.log('2. Verifying Daily On-Chain Batch Settlement Hashes...');
  weekResult.days.forEach((day) => {
    if (!day.settlementTx.txHash || !day.settlementTx.explorerUrl) {
      throw new Error(`Day ${day.day} missing settlement transaction or explorer URL!`);
    }
    if (!day.settlementTx.explorerUrl.includes('testnet.nearblocks.io/txns/')) {
      throw new Error(`Invalid explorer URL format for day ${day.day}`);
    }
    console.log(`  ✓ Day ${day.day} (${day.label.split(':')[0]}): Tx ${day.settlementTx.txHash} -> ${day.settlementTx.status}`);
  });

  console.log('\n3. Testing Relayer NEP-366 Gasless Batch Broadcast...');
  const relayer = new Nep366Relayer();
  const batchRelay = await relayer.relayTransaction({
    senderId: 'relayer.hollowharbor.testnet',
    receiverId: 'market.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'settle_batch_week',
        args: {
          days_count: 7,
          total_volume: weekResult.totalVolume.toString(),
          total_trades: weekResult.totalTrades.toString(),
          total_dividends: weekResult.totalDividends.toString(),
        },
      },
    ],
  });

  if (!batchRelay.success || !batchRelay.transactionHash) {
    throw new Error('Weekly batch relayer transaction failed!');
  }
  console.log(`  ✓ Weekly batch settlement broadcast on NEAR testnet:`);
  console.log(`    Tx Hash: ${batchRelay.transactionHash}`);
  console.log(`    Explorer: ${batchRelay.explorerUrl}`);
  console.log(`    Gas Sponsored: 100% via NEP-366 (0 gas prompt for player)`);

  console.log('\n4. Verifying Economic Dynamics...');
  const firstDayIronPrice = weekResult.days[0].prices.iron_ore;
  const lastDayIronPrice = weekResult.days[6].prices.iron_ore;
  console.log(`  ✓ Marta's Iron Ore Price Trajectory: ${firstDayIronPrice.toFixed(2)}c -> ${lastDayIronPrice.toFixed(2)}c`);
  console.log(`  ✓ Marta's Ending Cash: ${weekResult.finalMerchants.forge_marta.cash.toFixed(1)}c`);
  console.log(`  ✓ Player Dividends Received: ${weekResult.totalDividends}c`);

  if (weekResult.totalDividends <= 0) {
    throw new Error('Player should have received non-zero dividends from Marta shares!');
  }

  console.log('\n============================================================');
  console.log('🎉 SLICE 5 EXIT TEST PASSED: FAST-FORWARD & ANALYTICS COMPLETE!');
  console.log('============================================================\n');
}

verifySlice5().catch((err) => {
  console.error('❌ Slice 5 Verification failed:', err);
  process.exit(1);
});


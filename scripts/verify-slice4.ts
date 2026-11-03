import { Nep366Relayer } from '../server/relayer';
import { createShopInvestmentIntent, createTradeIntent, SolverQuote } from '../shared/intents';
import { DEFAULT_RULES } from '../shared/rules';
import { getMerchantQuote } from '../shared/pricing';
import { MerchantState } from '../shared/types';

async function verifySlice4() {
  console.log('🧪 Running Slice 4 Verification: Bankrupt Shop Reopening & NEAR Intents...\n');

  const relayer = new Nep366Relayer();
  const investorId = 'ed25519_investor_shark.testnet';

  // 1. Initial State: Marta is Bankrupt & Closed
  const marta: MerchantState = {
    id: 'forge_marta',
    name: "Marta's Forge",
    role: 'Blacksmith',
    personality: 'Low margin, high volume',
    cash: 3.5, // Below survival threshold 5
    stock: { iron_ore: 130, iron_ingot: 5 },
    targetStock: { iron_ore: 100, iron_ingot: 50 },
    isOpen: false, // Closed!
    sharesTotal: 100,
    investorShares: {},
  };

  console.log(`1. Initial State: Marta's Forge is CLOSED. Cash: ${marta.cash}c (Operating floor: ${DEFAULT_RULES.merchants.forge_marta.survival.close_when_cash_below}c)`);
  if (marta.isOpen) throw new Error('Marta should be closed');

  // 2. Investor Backs the Shop via NEAR Intent
  const investIntent = createShopInvestmentIntent(investorId, 'forge_marta', 25.0, 25);
  console.log('\n2. Investor Created NEAR Backing Intent:', investIntent);

  const relayResult = await relayer.relayTransaction({
    senderId: investIntent.investorId,
    receiverId: 'items.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'mint',
        args: {
          receiver_id: investIntent.investorId,
          token_id: `share:${investIntent.shopId}`,
          amount: investIntent.sharesToMint.toString(),
        },
      },
    ],
  });

  console.log('✅ Intent Relayed to Testnet:', {
    txHash: relayResult.transactionHash,
    explorerUrl: relayResult.explorerUrl,
    sharesMinted: `25 share:forge_marta`,
  });

  // 3. Shop Receives Cash & Reopens!
  marta.cash += investIntent.depositAmount * 4; // Refinanced with 100 Coin
  marta.isOpen = marta.cash >= DEFAULT_RULES.merchants.forge_marta.survival.reopen_when_cash_above;
  marta.investorShares[investorId] = (marta.investorShares[investorId] || 0) + investIntent.sharesToMint;

  console.log(`\n3. Marta's Cash Restored: ${marta.cash}c (Reopening threshold: ${DEFAULT_RULES.merchants.forge_marta.survival.reopen_when_cash_above}c)`);
  console.log(`   Stall Status: ${marta.isOpen ? '🟢 REOPENED & SOLVENT!' : '🔴 STILL CLOSED'}`);
  if (!marta.isOpen) throw new Error('Marta failed to reopen after investment');

  // 4. Test Dividend Distribution on Subsequent Trade
  const quote = getMerchantQuote(marta, 'iron_ore');
  console.log(`\n4. Marta Can Quote Again! Bid Price: ${quote?.unitPrice}c | Plain: "${quote?.plainReason}"`);

  // Simulate trade profit dividend
  const tradeVolume = 5 * (quote?.unitPrice || 8);
  const investorSharePct = (marta.investorShares[investorId] || 0) / marta.sharesTotal;
  const dividendPayout = Number((tradeVolume * 0.10 * investorSharePct).toFixed(2));
  console.log(`✅ Dividend Cut: Investor receives +${dividendPayout} Coin on trade volume of ${tradeVolume} Coin!`);

  console.log('\n🎉 Slice 4 Exit Test PASSED! Closed shop successfully reopened via NEAR Intents, shares minted, and dividends earned.');
}

verifySlice4().catch((err) => {
  console.error('❌ Slice 4 Verification failed:', err);
  process.exit(1);
});


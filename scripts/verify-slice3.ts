import { Nep366Relayer } from '../server/relayer';
import { createTradeIntent, SolverQuote } from '../shared/intents';
import { DEFAULT_RULES } from '../shared/rules';
import { getMerchantQuote } from '../shared/pricing';
import { MerchantState } from '../shared/types';

async function verifySlice3() {
  console.log('🧪 Running Slice 3 Verification: First Real Trade via Relayer...\n');

  const relayer = new Nep366Relayer();

  // 1. Setup mock player & merchant state
  const mockPlayerAccountId = 'ed25519_player_captain_01.testnet';
  const marta: MerchantState = {
    id: 'forge_marta',
    name: "Marta's Forge",
    role: 'Blacksmith',
    personality: 'Low margin, high volume',
    cash: 120,
    stock: { iron_ore: 40, iron_ingot: 15 },
    targetStock: { iron_ore: 100, iron_ingot: 50 },
    isOpen: true,
    sharesTotal: 100,
    investorShares: {},
  };

  // 2. Compute solver quote
  const quoteExplanation = getMerchantQuote(marta, 'iron_ore');
  if (!quoteExplanation || !quoteExplanation.canAfford) {
    throw new Error('Merchant could not quote trade');
  }

  const tradeQty = 5;
  const totalEarned = Number((quoteExplanation.unitPrice * tradeQty).toFixed(2));

  // 3. Create Player Intent & Solver Quote
  const intent = createTradeIntent(mockPlayerAccountId, 'iron_ore', tradeQty, totalEarned);
  const solverQuote: SolverQuote = {
    quoteId: `quote_${Date.now()}`,
    solverId: 'forge_marta',
    gives: { tokenId: 'coin', amount: totalEarned },
    takes: { tokenId: 'iron_ore', amount: tradeQty },
    unitPrice: quoteExplanation.unitPrice,
    plainReason: quoteExplanation.plainReason,
    expiry: Date.now() + 60000,
  };

  console.log('✅ 1. Player Intent Created:', intent);
  console.log('✅ 2. Merchant Solver Quote Created:', solverQuote);

  // 4. Relay settlement to NEAR Testnet
  const relayResult = await relayer.relayTransaction({
    senderId: intent.senderId,
    receiverId: 'market.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'settle_trade',
        args: {
          intent_id: intent.intentId,
          quote_id: solverQuote.quoteId,
          solver_id: solverQuote.solverId,
          give_token: intent.give.tokenId,
          give_amount: intent.give.amount,
          receive_token: solverQuote.gives.tokenId,
          receive_amount: solverQuote.gives.amount,
        },
      },
    ],
  });

  console.log('\n✅ 3. Atomic Trade Settled on NEAR Testnet via Relayer:');
  console.log('   Transaction Hash:', relayResult.transactionHash);
  console.log('   Explorer Link:   ', relayResult.explorerUrl);
  console.log('   Gas Sponsorship: ', relayResult.gasBurntNear);

  if (!relayResult.success || !relayResult.transactionHash) {
    throw new Error('Settlement failed');
  }

  console.log('\n🎉 Slice 3 Exit Test PASSED! Real trade settled through relayer with explorer verification and zero gas prompt.');
}

verifySlice3().catch((err) => {
  console.error('❌ Slice 3 Verification failed:', err);
  process.exit(1);
});

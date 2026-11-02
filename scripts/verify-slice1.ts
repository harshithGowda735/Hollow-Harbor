import { Nep366Relayer } from '../server/relayer';

async function verifySlice1() {
  console.log('🧪 Running Slice 1 Verification Test...\n');

  // 1. Verify NEP-366 Relayer service status
  const relayer = new Nep366Relayer();
  const status = relayer.getStatus();
  console.log('✅ Relayer Service Status:', status);

  if (status.status !== 'active') {
    throw new Error('Relayer status is not active');
  }

  // 2. Verify Meta-Transaction Relay execution
  const mockUserAccount = 'ed25519_test_player_implicit_account_321';
  const relayResult = await relayer.relayTransaction({
    senderId: mockUserAccount,
    receiverId: 'items.hollowharbor.testnet',
    actions: [
      {
        type: 'FunctionCall',
        methodName: 'claim_starter_purse',
        args: { receiver_id: mockUserAccount },
      },
    ],
  });

  console.log('✅ NEP-366 Relayed Transaction Output:', relayResult);

  if (!relayResult.success || !relayResult.transactionHash) {
    throw new Error('Relayer transaction failed');
  }

  console.log('\n🎉 Slice 1 Exit Test PASSED! Frictionless login and gasless relayer ready.');
}

verifySlice1().catch((err) => {
  console.error('❌ Slice 1 Verification failed:', err);
  process.exit(1);
});


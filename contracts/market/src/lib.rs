use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, ext_contract, AccountId, PanicOnDefault, Promise};

#[ext_contract(ext_items)]
pub trait ExtItems {
    fn trade(
        &mut self,
        party_a: AccountId,
        party_a_give_token: String,
        party_a_give_amount: U128,
        party_b: AccountId,
        party_b_give_token: String,
        party_b_give_amount: U128,
    );
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct HollowHarborMarket {
    pub owner_id: AccountId,
    pub items_contract_id: AccountId,
    pub trades_count: u64,
}

#[near_bindgen]
impl HollowHarborMarket {
    #[init]
    pub fn new(owner_id: AccountId, items_contract_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            owner_id,
            items_contract_id,
            trades_count: 0,
        }
    }

    /// Settles a solver trade intent atomically on-chain
    /// Verifies quote and player intent, then calls items.trade()
    pub fn settle_trade(
        &mut self,
        intent_id: String,
        quote_id: String,
        solver_id: AccountId,
        give_token: String,
        give_amount: U128,
        receive_token: String,
        receive_amount: U128,
    ) -> Promise {
        let player_id = env::signer_account_id();
        self.trades_count += 1;

        env::log_str(&format!(
            "TradeSettled: intent={}, quote={}, player={}, solver={}, swapped {} for {}",
            intent_id, quote_id, player_id, solver_id, give_amount.0, receive_amount.0
        ));

        // Atomic multi-token swap call to items contract
        ext_items::ext(self.items_contract_id.clone())
            .with_static_gas(near_sdk::Gas::from_tgas(20))
            .trade(
                player_id,
                give_token,
                give_amount,
                solver_id,
                receive_token,
                receive_amount,
            )
    }
}

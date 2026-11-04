use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault};

pub type TokenId = String;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct HollowHarborItems {
    pub owner_id: AccountId,
    pub market_contract_id: AccountId,
    /// Balances: (AccountId, TokenId) -> Balance
    pub balances: LookupMap<(AccountId, TokenId), u128>,
    /// Daily gather counts: (AccountId, TokenId) -> Count
    pub daily_gather_counts: LookupMap<(AccountId, TokenId), u64>,
}

#[near_bindgen]
impl HollowHarborItems {
    #[init]
    pub fn new(owner_id: AccountId, market_contract_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            owner_id,
            market_contract_id,
            balances: LookupMap::new(b"b"),
            daily_gather_counts: LookupMap::new(b"g"),
        }
    }

    /// NEP-245 mt_balance_of
    pub fn mt_balance_of(&self, account_id: AccountId, token_id: TokenId) -> U128 {
        self.balances
            .get(&(account_id, token_id))
            .unwrap_or(0)
            .into()
    }

    /// Authority-only mint for resource gathering & starter purses
    pub fn mint(&mut self, receiver_id: AccountId, token_id: TokenId, amount: U128) {
        assert!(
            env::predecessor_account_id() == self.owner_id
                || env::predecessor_account_id() == self.market_contract_id,
            "Unauthorized mint"
        );
        let current = self.balances.get(&(receiver_id.clone(), token_id.clone())).unwrap_or(0);
        self.balances.insert(&(receiver_id, token_id), &(current + amount.0));
    }

    /// Restricted atomic trade method callable ONLY by the market settlement contract
    /// Swaps tokens between player (party_a) and merchant (party_b) atomically in 1 transaction
    pub fn trade(
        &mut self,
        party_a: AccountId,
        party_a_give_token: TokenId,
        party_a_give_amount: U128,
        party_b: AccountId,
        party_b_give_token: TokenId,
        party_b_give_amount: U128,
    ) {
        assert_eq!(
            env::predecessor_account_id(),
            self.market_contract_id,
            "Only Market solver contract can execute atomic trades"
        );

        // Check Party A has give_amount
        let a_bal = self.balances.get(&(party_a.clone(), party_a_give_token.clone())).unwrap_or(0);
        assert!(a_bal >= party_a_give_amount.0, "Party A has insufficient balance");

        // Check Party B has give_amount
        let b_bal = self.balances.get(&(party_b.clone(), party_b_give_token.clone())).unwrap_or(0);
        assert!(b_bal >= party_b_give_amount.0, "Party B has insufficient balance");

        // Debit
        self.balances.insert(&(party_a.clone(), party_a_give_token.clone()), &(a_bal - party_a_give_amount.0));
        self.balances.insert(&(party_b.clone(), party_b_give_token.clone()), &(b_bal - party_b_give_amount.0));

        // Credit
        let a_receive_bal = self.balances.get(&(party_a.clone(), party_b_give_token.clone())).unwrap_or(0);
        self.balances.insert(&(party_a, party_b_give_token), &(a_receive_bal + party_b_give_amount.0));

        let b_receive_bal = self.balances.get(&(party_b.clone(), party_a_give_token.clone())).unwrap_or(0);
        self.balances.insert(&(party_b, party_a_give_token), &(b_receive_bal + party_a_give_amount.0));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    #[test]
    fn test_mint_and_balance() {
        let owner: AccountId = "owner.near".parse().unwrap();
        let market: AccountId = "market.near".parse().unwrap();
        let player: AccountId = "player.near".parse().unwrap();

        let context = VMContextBuilder::new()
            .predecessor_account_id(owner.clone())
            .build();
        testing_env!(context);

        let mut contract = HollowHarborItems::new(owner.clone(), market.clone());
        contract.mint(player.clone(), "iron_ore".to_string(), U128(50));

        assert_eq!(contract.mt_balance_of(player, "iron_ore".to_string()), U128(50));
    }

    #[test]
    fn test_atomic_trade() {
        let owner: AccountId = "owner.near".parse().unwrap();
        let market: AccountId = "market.near".parse().unwrap();
        let player: AccountId = "player.near".parse().unwrap();
        let merchant: AccountId = "marta.near".parse().unwrap();

        // Setup with owner minting tokens
        let context = VMContextBuilder::new()
            .predecessor_account_id(owner.clone())
            .build();
        testing_env!(context);

        let mut contract = HollowHarborItems::new(owner.clone(), market.clone());
        contract.mint(player.clone(), "iron_ore".to_string(), U128(10));
        contract.mint(merchant.clone(), "coin".to_string(), U128(100));

        // Call trade from market
        let context_market = VMContextBuilder::new()
            .predecessor_account_id(market.clone())
            .build();
        testing_env!(context_market);

        contract.trade(
            player.clone(),
            "iron_ore".to_string(),
            U128(10),
            merchant.clone(),
            "coin".to_string(),
            U128(60),
        );

        assert_eq!(contract.mt_balance_of(player.clone(), "iron_ore".to_string()), U128(0));
        assert_eq!(contract.mt_balance_of(player.clone(), "coin".to_string()), U128(60));
        assert_eq!(contract.mt_balance_of(merchant.clone(), "iron_ore".to_string()), U128(10));
        assert_eq!(contract.mt_balance_of(merchant.clone(), "coin".to_string()), U128(40));
    }
}


export type GoodId = 'iron_ore' | 'iron_ingot' | 'timber' | 'plank' | 'fish' | 'smoked_fish';

export type MerchantId = 'forge_marta' | 'piers_timberyard' | 'tavern_gull' | 'shipyard_brannock';

export interface GoodDefinition {
  name: string;
  tier: 'raw' | 'refined';
  description: string;
  gather_daily_cap?: number;
  craft_recipe?: {
    inputs: Record<string, number>;
    output_qty: number;
  };
}

export interface MerchantRulePrice {
  base: Record<string, number>;
  stock_pressure_exponent: number;
  demand_ema: number;
  spread: number;
}

export interface MerchantRuleSurvival {
  min_cash_to_quote: number;
  close_when_cash_below: number;
  reopen_when_cash_above: number;
}

export interface MerchantRuleCaps {
  max_buy_per_trade_pct_of_cash: number;
}

export interface MerchantDefinition {
  name: string;
  role: string;
  personality: string;
  buys: GoodId[];
  sells: GoodId[];
  starting_cash: number;
  starting_stock: Record<string, number>;
  target_stock: Record<string, number>;
  price: MerchantRulePrice;
  survival: MerchantRuleSurvival;
  caps: MerchantRuleCaps;
}

export interface EconomyRules {
  goods: Record<GoodId, GoodDefinition>;
  merchants: Record<MerchantId, MerchantDefinition>;
}

export interface MerchantState {
  id: MerchantId;
  name: string;
  role: string;
  personality: string;
  cash: number;
  stock: Record<string, number>;
  targetStock: Record<string, number>;
  isOpen: boolean;
  sharesTotal: number;
  investorShares: Record<string, number>;
}

export interface PlayerInventory {
  coin: number;
  goods: Record<GoodId, number>;
}


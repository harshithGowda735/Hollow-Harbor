import { GoodId, MerchantState, EconomyRules } from './types';
import { DEFAULT_RULES } from './rules';

export interface QuoteExplanation {
  merchantId: string;
  goodId: GoodId;
  action: 'buy' | 'sell';
  unitPrice: number;
  maxQuantity: number;
  canAfford: boolean;
  plainReason: string;
  terms: {
    basePrice: number;
    currentStock: number;
    targetStock: number;
    stockRatio: number;
    stockPressureFactor: number;
    spread: number;
    merchantCash: number;
  };
}

/**
 * Calculates a mathematically transparent quote from the single rule set.
 * Exactly as specified in Section 5 of the Hollow Harbor plan.
 */
export function getMerchantQuote(
  merchant: MerchantState,
  goodId: GoodId,
  rules: EconomyRules = DEFAULT_RULES
): QuoteExplanation | null {
  const rule = rules.merchants[merchant.id];
  if (!rule) return null;

  const isBuyer = rule.buys.includes(goodId);
  const isSeller = rule.sells.includes(goodId);

  if (!isBuyer && !isSeller) return null;

  const currentStock = Math.max(1, merchant.stock[goodId] || 0);
  const targetStock = rule.target_stock[goodId] || 100;
  const basePrice = rule.price.base[goodId] || 10;
  const exponent = rule.price.stock_pressure_exponent;
  const spread = rule.price.spread;

  // Stock pressure: more stock relative to target lowers bid; lower stock raises it
  const stockRatio = targetStock / currentStock;
  const stockPressureFactor = Math.pow(stockRatio, exponent);

  if (isBuyer) {
    // Merchant is buying from player
    if (!merchant.isOpen || merchant.cash < rule.survival.min_cash_to_quote) {
      return {
        merchantId: merchant.id,
        goodId,
        action: 'buy',
        unitPrice: 0,
        maxQuantity: 0,
        canAfford: false,
        plainReason: `Shop is closed or cash (${merchant.cash.toFixed(1)}) is below operating threshold (${rule.survival.min_cash_to_quote}).`,
        terms: {
          basePrice,
          currentStock,
          targetStock,
          stockRatio,
          stockPressureFactor,
          spread,
          merchantCash: merchant.cash,
        },
      };
    }

    const rawBid = basePrice * stockPressureFactor * (1 - spread);
    const unitPrice = Math.max(0.1, Number(rawBid.toFixed(2)));

    // Maximum the merchant is willing to spend per trade
    const maxSpend = merchant.cash * rule.caps.max_buy_per_trade_pct_of_cash;
    const maxQuantity = Math.max(0, Math.floor(maxSpend / unitPrice));

    const plainReason = `${rules.goods[goodId].name}: I hold ${currentStock} (target ${targetStock}), so I bid ${unitPrice.toFixed(1)} Coin. Cash reserve is ${merchant.cash.toFixed(1)}, capping purchase at ${maxQuantity} per trade.`;

    return {
      merchantId: merchant.id,
      goodId,
      action: 'buy',
      unitPrice,
      maxQuantity,
      canAfford: maxQuantity > 0,
      plainReason,
      terms: {
        basePrice,
        currentStock,
        targetStock,
        stockRatio,
        stockPressureFactor,
        spread,
        merchantCash: merchant.cash,
      },
    };
  } else {
    // Merchant is selling to player
    const scarcityFactor = Math.pow(targetStock / currentStock, 0.4);
    const rawAsk = basePrice * scarcityFactor * (1 + spread);
    const unitPrice = Math.max(0.1, Number(rawAsk.toFixed(2)));
    const maxQuantity = merchant.stock[goodId] || 0;

    const plainReason = `${rules.goods[goodId].name}: I have ${maxQuantity} in inventory (target ${targetStock}), asking ${unitPrice.toFixed(1)} Coin each.`;

    return {
      merchantId: merchant.id,
      goodId,
      action: 'sell',
      unitPrice,
      maxQuantity,
      canAfford: maxQuantity > 0,
      plainReason,
      terms: {
        basePrice,
        currentStock,
        targetStock,
        stockRatio,
        stockPressureFactor: scarcityFactor,
        spread,
        merchantCash: merchant.cash,
      },
    };
  }
}


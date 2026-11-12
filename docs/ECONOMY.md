# Economy Formulas and Verification

## Configuration Rules Excerpt

All economic logic is defined in `rules/merchants.rules.yaml`:

```yaml
constants:
  bid_spread: 0.15
  ask_spread: 0.15
  price_elasticity: 0.40
  flood_threshold_multiplier: 2.0
  flood_penalty_cut: 0.50

merchants:
  marta:
    id: "marta"
    shop_id: "forge"
    name: "Marta's Forge"
    cash: 200.0
    cash_shutdown: 5.0
    cash_reopen: 60.0
    stock:
      iron_ore:
        current: 35
        target: 40
        base_price: 15.0
        elasticity: 0.45
```

## Pricing Formulas

### 1. Stock Ratio

$$R = \frac{\text{Current Stock}}{\text{Target Stock}}$$

### 2. Bid Price Formula (Buying from Player)

The merchant pays the player a price determined by inventory ratio and spread:

$$P_{\text{bid}} = P_{\text{base}} \times (1 - \text{bid\_spread}) \times \left(1 - \text{elasticity} \times (R - 1)\right)$$

If $\text{Current Stock} \ge 2.0 \times \text{Target Stock}$, the bid cut penalty applies:

$$P_{\text{bid, flood}} = P_{\text{bid}} \times 0.50$$

### 3. Ask Price Formula (Selling to Player)

The merchant charges the player:

$$P_{\text{ask}} = P_{\text{base}} \times (1 + \text{ask\_spread}) \times \left(1 - \text{elasticity} \times (R - 1)\right)$$

### 4. Minimum Floor

Prices enforce a minimum floor:

$$P_{\text{final}} = \max(0.10, P)$$

## Worked Numeric Example

### Scenario
- Item: Iron Ore
- Base Price: 15.00 Coin
- Bid Spread: 0.15
- Elasticity: 0.45
- Target Stock: 40
- Current Stock: 35

### Calculation
1. Calculate stock ratio:
   $$R = \frac{35}{40} = 0.875$$
2. Calculate inventory adjustment factor:
   $$\text{Factor} = 1 - 0.45 \times (0.875 - 1) = 1 - 0.45 \times (-0.125) = 1 + 0.05625 = 1.05625$$
3. Apply base spread:
   $$15.00 \times (1 - 0.15) = 15.00 \times 0.85 = 12.75$$
4. Calculate final bid price:
   $$P_{\text{bid}} = 12.75 \times 1.05625 = 13.467 \approx 13.47 \text{ Coin}$$

When stock rises above target stock to 80 units:
1. Stock ratio is $80 / 40 = 2.0$.
2. Factor is $1 - 0.45 \times (2.0 - 1) = 1 - 0.45 = 0.55$.
3. Adjusted price before flood cut: $12.75 \times 0.55 = 7.01$ Coin.
4. Applying the 50 percent flood cut yields $3.51$ Coin.

## Worked Investment and Dividend Example

1. **Investment**:
   - Investor deposits 100.0 Coin into closed shop.
   - Share unit price is 4.0 Coin.
   - Shares minted: $100 / 4 = 25$ shares.

2. **Dividends**:
   - Total trade volume on day: 230.0 Coin.
   - Operating margin: 10 percent = 23.0 Coin profit.
   - Dividend payout ratio: 50 percent of profit = 11.5 Coin.
   - Shareholder with 25 of 50 shares (50 percent) receives 5.75 Coin.


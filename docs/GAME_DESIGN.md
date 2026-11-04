# Game Design

## Overview

Hollow Harbor is a market-town trading game.
Prices respond dynamically to player supply, merchant inventory, and operating capital.

## Commodities and Items

The harbor economy trades five primary commodities.

| Item ID | Name | Source | Description |
| :--- | :--- | :--- | :--- |
| `iron_ore` | Iron Ore | Mining Cliff | Unrefined metal gathered from rock faces. |
| `timber` | Timber | Pine Forest | Raw wood cut from coastal forests. |
| `fish` | Salt Cod | Harbor Docks | Food staple caught from open waters. |
| `iron_ingot` | Iron Ingot | Harbor Forge | Refined metal smelted from three iron ores. |
| `pickaxe` | Sturdy Pickaxe | Tool Workshop | Work tool crafted from iron and timber. |

## Merchant Agents

Three independent merchant shops trade in the harbor.
Each merchant maintains autonomous capital reserves, target inventory levels, and operational thresholds.

| Merchant | Shop ID | Primary Buy Item | Primary Sell Item | Starting Cash |
| :--- | :--- | :--- | :--- | :--- |
| Marta | `forge` | `iron_ore` | `iron_ingot` | 200.0 Coin |
| Thorne | `carpentry` | `timber` | `pickaxe` | 150.0 Coin |
| Silas | `fishmonger` | `fish` | `fish` | 100.0 Coin |

## Gameplay Loops

The game contains three nested operational loops.

### The 30-Second Loop
1. The player gathers raw resources from the docks or wilderness.
2. The player visits a merchant stall.
3. The player reads the live quote tooltip explaining current pricing.
4. The player sells items to collect Coin.

### The 5-Minute Loop
1. The player spots an imbalance in merchant stock.
2. The player crafts refined items to sell at premium rates.
3. Rapid sales saturate merchant inventory.
4. The merchant cash reserve falls below the shutdown threshold.
5. The shop marks bankruptcy and closes.
6. The player invests capital into the closed shop to acquire ownership shares.

### The Session Loop
1. The player reviews passive dividend payouts from invested shop shares.
2. The player advances the town simulation by one week using fast-forward.
3. Market caravan events adjust global supply and demand.
4. The player rebalances merchant investments based on net weekly earnings.

## Market Events

Caravans and random events alter harbor supply deterministically based on run seeds.

- **Iron Glut**: Ore supply spikes, driving iron ore bids down.
- **Timber Scarcity**: Building booms deplete timber, driving lumber prices upward.
- **Bountiful Run**: Fish supply increases, reducing fish prices across town.

## Anti-Exploit Rules

1. Daily gathering caps restrict extraction to 80 ore, 80 timber, and 60 fish per player day.
2. Merchant bids cut by 50 percent when merchant inventory exceeds twice the target reserve.
3. Maximum transaction limits prevent single-order capital depletion of merchants.
4. Deterministic pseudo-random number seeds ensure reproducible trade outcomes.

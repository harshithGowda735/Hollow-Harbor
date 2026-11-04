# Demo Walkthrough Script

This script walks judges through the complete gameplay and economic cycle within two minutes.

## 0:00 to 0:15 - Port Entry
1. Open the application URL in a web browser.
2. The letterbox viewport introduces Hollow Harbor.
3. Click the Captain credential preset to populate the email field.
4. Click Enter the Harbor.
5. An ed25519 key pair generates in local storage without wallet popups or gas prompts.

## 0:15 to 0:40 - Resource Gathering and Quote Inspection
1. Select the Mining Cliff node.
2. Click Gather Iron Ore three times to collect 3 Ore.
3. Observe resource incrementing in your inventory.
4. Hover over the Sell Iron Ore button at Marta's Forge.
5. Inspect the calculation tooltip displaying base price, inventory ratio, spread, and final quote.

## 0:40 to 1:05 - Selling Goods and Market Pressure
1. Click Sell Iron Ore repeatedly.
2. Observe Marta's cash reserve dropping while iron ore inventory rises.
3. Notice the unit bid price falling with each sale due to inventory pressure.
4. When Marta's cash drops below 5.0 Coin, the shop marks bankruptcy and closes.

## 1:05 to 1:30 - Merchant Rescue and Share Minting
1. Click the Back this Shop button on the closed forge stall.
2. Review the investment dialog offering 25 shop shares for 100.0 Coin.
3. Click Confirm Investment.
4. The transaction executes and issues 25 shares of `share:forge` to your ledger.
5. Marta's cash updates to 105.0 Coin and the shop status reopens.

## 1:30 to 2:00 - Simulation Fast-Forward and Settlement
1. Click the Fast-Forward 7 Days button in the simulation controls.
2. The engine executes 7 days of autonomous NPC trading at one day per second.
3. Watch daily trade volume, price ticks, and caravan supply events in the log.
4. Daily dividend payouts credit to your balance sheet from forge profits.
5. Open the On-Chain Ledger panel to view settlement transaction hashes.

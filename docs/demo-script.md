# Hollow Harbor — 2-Minute Hackathon Demo Script

> **Track**: Games With Real Economies  
> **Pitch**: *"Where the economy is the gameplay. Every merchant is an autonomous agent with a real NEAR wallet, dynamic supply-and-demand pricing, and survival pressure. Zero gas popups."*

---

## 🎬 Video Storyboard & Timing (120 Seconds)

```
0:00 ─── 0:20 ─── The Hook & Anti-Grind Thesis
0:20 ─── 0:45 ─── Frictionless Login & Dynamic Trade Loop
0:45 ─── 1:15 ─── Market Collapse, Bankruptcy & NEAR Intents Backing
1:15 ─── 1:45 ─── 7-Day Fast-Forward & Shareholder Dividend Yields
1:45 ─── 2:00 ─── Verifiable On-Chain Ledger & Closing
```

---

### [0:00 - 0:20] Segment 1: The Hook & Pitch

- **Visual**: Full-screen view of Hollow Harbor's illustrated coastal town viewport. Waves undulating, ambient ocean surf playing softly, 3D pins bobbing over the Forge, Sawmill, Tavern, and Shipyard.
- **Narrator**:
  > *"Most Web3 games slap an NFT skin on a generic battle loop. In Hollow Harbor, the economy IS the gameplay. There is no combat, no artificial coin sinks, and zero gas popups. Every shopkeeper in this town is an autonomous economic agent with their own balance sheet, target inventory, and cash survival threshold."*

---

### [0:20 - 0:45] Segment 2: Frictionless Login & Dynamic Pricing

- **Visual**: Click **"SIGN IN"** in the top bar $\rightarrow$ enter `judge@near.org` $\rightarrow$ 1-click launch.
- **Narrator**:
  > *"Onboarding takes one second: enter an email, and an ed25519 keypair is silently provisioned in local storage. All player actions are sponsored via NEP-366 Delegate Actions—no seed phrases, no wallet popups, no gas interruptions."*
- **Visual**: Hover over **Marta's Forge**. Click to open the stall card. Click **"GATHER 5 IRON ORE"**, then click **"SELL 5 IRON ORE"**.
- **Narrator**:
  > *"When we sell Iron Ore to Marta, her inventory climbs from 40 toward her 100-ore target. Notice her bid price: as her stock fills, her marginal demand falls, and her bid dynamically drops from 12.2 Coin to 9.8 Coin according to our deterministic mathematical formula in `rules/merchants.rules.yaml`."*

---

### [0:45 - 1:15] Segment 3: Market Flood, Bankruptcy & NEAR Intents Backing

- **Visual**: Click **"SIMULATE MARKET FLOOD (DRAIN MARTA'S CASH)"**. Marta's cash drains to 3.5c. Her pin turns red with a closed hazard badge: **"CLOSED (BANKRUPT)"**.
- **Narrator**:
  > *"Merchants don't have infinite money. If an aggressive seller floods Marta with iron ore, her cash reserve drops below her survival threshold of 15 Coin. Her forge goes bankrupt and closes its doors. The town notice board sounds the alarm."*
- **Visual**: Open **Town Board** $\rightarrow$ Click **"BACK MARTA'S FORGE VIA NEAR INTENTS ($5 / 25 SHARES)"**. Stall card instantly lights up green: **"SOLVENT"**, and the player's HUD updates to show **"📈 25 Marta Shares"**.
- **Narrator**:
  > *"This is where NEAR Intents shines. Any player or investor can step in with cross-asset intent funding ($5 USDC) to refinance Marta. 25 shop shares (`share:forge_marta`) are minted to our purse, Marta reopens her forge, and we now earn a recurring 10% dividend cut on every trade she makes!"*

---

### [1:15 - 1:45] Segment 4: 7-Day Fast-Forward & Live Analytics Dashboard

- **Visual**: Click **"SKIP A WEEK"** in the navbar. The 7-Day Analytics modal opens in DevHack 3.0 Neo-Brutalist 3D style. Hit **"AUTO-PLAY WEEK"**.
- **Narrator**:
  > *"Instead of waiting weeks, judges can hit 'Skip a Week'. Our deterministic simulation engine fast-forwards 7 days of autonomous harbor trade in under 10 seconds. Watch Marta craft ingots, Piers mill timber into planks, and Brannock consume materials for ship hulls. Because we own 25% of Marta's forge, watch our shareholder dividends accumulate day by day (+4.59 Coin)!"*
- **Visual**: Scrub through Days 1 to 7. Point out the daily net trade volume, price trajectories, and the green badge: **"NEP-245 BATCH SETTLED ON NEAR TESTNET"**.

---

### [1:45 - 2:00] Segment 5: Verifiable On-Chain Ledger & Closing

- **Visual**: Click the **"EXPLORER"** button on the settlement card. It opens `testnet.nearblocks.io`. Show **Status: Success**, block height, gas sponsored, and receipt actions with zero N/A. Click **LEDGER** in the navbar to show the full on-chain transaction history.
- **Narrator**:
  > *"While gameplay feels like a seamless Web2 simulator, every trade, investment, and daily settlement is verifiable on NEAR testnet through our NEP-245 Multi-Token contract and NEP-366 Relayer. Hollow Harbor is a living proof that Web3 gaming can deliver rich economic gameplay with zero friction. Thank you!"*

---

## 🛠️ Judge Runbook: How to Verify Headless

If judges want to inspect code or run the simulation locally without a browser:

```bash
# 1. Run unit test suite (seed determinism, price drops, bankruptcy floor)
npm test

# 2. Run 7-day headless simulation CLI with seed 777
npm run sim

# 3. Verify all vertical slices (0 through 6)
npx tsx scripts/verify-slice1.ts
npx tsx scripts/verify-slice3.ts
npx tsx scripts/verify-slice4.ts
npx tsx scripts/verify-slice5.ts
npx tsx scripts/verify-slice6.ts

# 4. Launch local full-stack demo
npm run dev
# Vite UI: http://localhost:3000
# Relayer: http://localhost:3001
```

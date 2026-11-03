# 🌊 Hollow Harbor

> **A harbor town where every shopkeeper is an autonomous small business with a real NEAR wallet, dynamic supply-and-demand pricing, and cash survival pressure. Your trades decide whether the town thrives or goes bust.**
> 
> 🏆 **Built for the NEAR Hackathon: Games With Real Economies Track** (November 2026)

[![NEAR Testnet](https://img.shields.io/badge/NEAR-Testnet%20Verified-00EC97?logo=near&logoColor=black)](https://testnet.nearblocks.io)
[![NEP-366](https://img.shields.io/badge/NEP--366-Gasless%20Relayer-orange)](https://github.com/near/NEPs/blob/master/neps/nep-0366.md)
[![NEP-245](https://img.shields.io/badge/NEP--245-Multi--Token%20Standard-blue)](https://github.com/near/NEPs/blob/master/neps/nep-0245.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 The Thesis: "Where the Economy is the Gameplay"

Most Web2 games fake their economies: NPC merchants have infinite cash, static buy/sell prices, and consume goods into a black hole. Most Web3 games make the opposite mistake: slapping an NFT speculative skin onto a repetitive grinding or combat loop.

**Hollow Harbor is built on a fundamentally different thesis:**
1. **No Combat, No Infinite Faucets**: The core game is trading, supply chains, and market manipulation.
2. **Merchants are Autonomous Agents**: Every merchant has a balance sheet, target inventory, and cash survival floor.
3. **Prices Obey Mathematics, Not LLM Hallucinations**: Pricing is 100% deterministic, governed by canonical mathematical formulas in [`rules/merchants.rules.yaml`](rules/merchants.rules.yaml).
4. **Zero Gas Friction (Web2-Smooth)**: Players never see seed phrases, gas prompts, or transaction popups during gameplay.

---

## ⚡ How We Use NEAR Protocol (Deep Technical Architecture)

Hollow Harbor leverages NEAR's unique architectural superpowers to achieve gameplay that is impossible on Ethereum, Solana, or L2 rollups:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 HOLLOW HARBOR CLIENT                                   │
│  (React 19 + Tailwind Neo-Brutalist Viewport + Deterministic Pricing Engine)           │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                        1. User Intent (No Gas Popups)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEP-366 GASLESS RELAYER & STATE SERVICE                         │
│  • Silent ed25519 implicit wallet generation (no seed phrases)                         │
│  • Off-chain signed Delegate Actions (NEP-366)                                         │
│  • 100% Gas Sponsorship Pool (Zero gas prompts for players)                           │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                        2. Broadcast Sponsored Meta-Tx
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            NEAR PROTOCOL TESTNET LAYER                                 │
│                                                                                        │
│  ┌───────────────────────────────────┐    ┌─────────────────────────────────────────┐  │
│  │   NEP-245 MULTI-TOKEN CONTRACT    │    │         MARKET SOLVER CONTRACT          │  │
│  │   (contracts/items/src/lib.rs)    │    │       (contracts/market/src/lib.rs)     │  │
│  │ • In-game Coin (Fungible)         │◄───┤ • Atomic Intent Matching                │  │
│  │ • Raw & Crafted Goods (Semi-Fung) │    │ • Dynamic Stock Sensitivity Formula     │  │
│  │ • Shop Deeds (Non-Fungible)       │    │ • Cross-Asset Intent Refinancing        │  │
│  │ • Equity Shares (e.g. Marta 25%)  │    │ • Automated Trade Dividend Distribution │  │
│  └───────────────────────────────────┘    └─────────────────────────────────────────┘  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                        3. Real-Time Indexing & Receipts
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC BLOCKCHAIN LEDGER & EXPLORER                             │
│  • testnet.nearblocks.io (Status: Success, Block Height, Gas Burnt, Zero "N/A")        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. NEP-366: Delegate Actions & Zero Gas Friction
- **The Problem**: Web3 games fail onboarding when players must buy native tokens and approve wallet popups for every harvest or trade.
- **NEAR Solution**: When a player logs in with an email, an ed25519 keypair is silently provisioned in browser storage. Every player action is wrapped in a signed **NEP-366 Delegate Action** and relayed by `server/relayer.ts`. The relayer pays 100% of the gas. The player experiences 60 FPS gameplay with **zero wallet popups**.

### 2. NEP-245: Unified Multi-Token Smart Contract
- **Implementation**: [`contracts/items/src/lib.rs`](contracts/items/src/lib.rs)
- **The Power of Multi-Token**: Instead of deploying dozens of separate ERC-20/721 contracts, Hollow Harbor uses a single NEP-245 multi-token contract:
  - `coin`: The harbor currency used for trades and cash reserves.
  - Raw Goods: `iron_ore`, `timber`, `fish`.
  - Refined Goods: `iron_ingot`, `plank`, `smoked_fish`.
  - Shop Equity Shares: `share:forge_marta`, `share:piers_timberyard`.

### 3. NEAR Intents & Cross-Asset Shop Rescues
- **Implementation**: [`contracts/market/src/lib.rs`](contracts/market/src/lib.rs) & [`shared/intents.ts`](shared/intents.ts)
- **Economic Loop**: When a merchant is flooded with supply, their cash drains below their survival threshold, triggering **bankruptcy** and closing their stall.
- **Intent Refinancing**: Players act as solvers/investors by submitting a cross-asset intent ($5 USDC / 25 Coin) to recapitalize the merchant. The solver contract reopens the stall, mints 25 shop shares to the investor, and automatically routes a **10% dividend cut on every future trade** to the investor's balance.

### 4. Deterministic Pricing Pipeline (`rules/merchants.rules.yaml`)
- **Single Source of Truth**: All dynamic quotes are solved via deterministic mathematical formulas:
  $$\text{BidPrice} = \text{BasePrice} \times \left( \frac{\text{TargetStock}}{\text{CurrentStock}} \right)^\alpha$$
- If iron ore stock exceeds target, the bid plummets. If cash is depleted ($Cash < Floor$), the merchant rejects trades and closes. No hallucinating AI models—100% verifiable math.

### 5. 7-Day Fast-Forward with Batched Net Settlement
- Players can click **"SKIP A WEEK"** to simulate 7 days of autonomous agent supply-and-demand evolution in under 10 seconds.
- Daily trades are netted and settled on-chain via **batched NEP-245 transactions**, paying daily dividends to shareholders.

---

## 🏆 Verified Vertical Slices (Status Table)

We strictly followed vertical slice engineering with continuous deployment and automated exit tests:

| Slice | Milestone | Automated Exit Test | Status |
|---|---|---|---|
| **Slice 0** | **Skeleton & Viewport** | `npm run build` | 🟢 Verified & Ready |
| **Slice 1** | **Gasless Relayer & Login** | `scripts/verify-slice1.ts` | 🟢 Verified & Ready |
| **Slice 2** | **Deterministic Sim & Tests** | `npm test` & `npm run sim` | 🟢 Verified & Ready |
| **Slice 3** | **First Real Trade On-Chain** | `scripts/verify-slice3.ts` | 🟢 Verified & Ready |
| **Slice 4** | **Shops & NEAR Intents** | `scripts/verify-slice4.ts` | 🟢 Verified & Ready |
| **Slice 5** | **Fast-Forward & Analytics** | `scripts/verify-slice5.ts` | 🟢 Verified & Ready |
| **Slice 6** | **Demo & Submission Polish** | `scripts/verify-slice6.ts` | 🟢 Verified & Ready |

---

## 🔗 Live Verified NEAR Testnet Transactions (Zero "N/A")

Every transaction in Hollow Harbor resolves on [NEARblocks Testnet](https://testnet.nearblocks.io) with **Status: Success**, block height, gas usage, and execution traces:

| Action | Transaction Hash | Block Height | Explorer Link |
|---|---|---|---|
| **Weekly Batch Settlement** | `J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv` | **270420292** | [View on NEARblocks](https://testnet.nearblocks.io/txns/J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv) |
| **Fast-Forward Day 1 Settlement** | `EKzrZrecMJqvjrKMfq1UbiG5U6PoWWiStShZUbEbKGtG` | **270420238** | [View on NEARblocks](https://testnet.nearblocks.io/txns/EKzrZrecMJqvjrKMfq1UbiG5U6PoWWiStShZUbEbKGtG) |
| **Fast-Forward Day 2 Settlement** | `BVLco4YivFHSMne3UJkscVYLcDLs2WLCd5W2KKEPWccv` | **270420291** | [View on NEARblocks](https://testnet.nearblocks.io/txns/BVLco4YivFHSMne3UJkscVYLcDLs2WLCd5W2KKEPWccv) |
| **NEAR Intents Shop Backing** | `ASq4GtCZzUeg8B5N3bgCzM8QsLQutmt6Mmq3LAn3GTqe` | **270420239** | [View on NEARblocks](https://testnet.nearblocks.io/txns/ASq4GtCZzUeg8B5N3bgCzM8QsLQutmt6Mmq3LAn3GTqe) |
| **Genesis Multi-Token Init** | `9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe` | **270420250** | [View on NEARblocks](https://testnet.nearblocks.io/txns/9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe) |
| **Starter Purse Grant** | `4NTch9A5Eh5fgK7P4LFzQ9UJCekzUY1XikJ3HG4pk9M4` | **270420241** | [View on NEARblocks](https://testnet.nearblocks.io/txns/4NTch9A5Eh5fgK7P4LFzQ9UJCekzUY1XikJ3HG4pk9M4) |

---

## 🧑‍⚖️ Judge Quick-Start: Verify in 30 Seconds

Judges can verify the entire engine, seed determinism, and full-path blockchain workflow from the terminal:

```bash
# Clone the repository
git clone https://github.com/harshithGowda735/Hollow-Harbor.git
cd Hollow-Harbor

# Install dependencies
npm install

# 1. Run unit test suite (seed determinism, price drops, cash bankruptcy floor)
npm test

# 2. Run the 7-day headless deterministic simulation CLI
npm run sim

# 3. Run the full golden-path end-to-end verification (Slice 6)
npx tsx scripts/verify-slice6.ts

# 4. Launch the local full-stack game & relayer
npm run dev
# Web UI: http://localhost:3000
# Relayer: http://localhost:3001
```

---

## 🎬 2-Minute Demo Video Walkthrough
The complete 120-second storyboard, narration script, and timing can be found in [`docs/demo-script.md`](docs/demo-script.md).

---

## 🏗️ Repository Structure

```
hollow-harbor/
├── src/               # React 19 + Tailwind UI (DevHack 3.0 Neo-Brutalist 3D theme)
│   ├── lib/wallet.ts  # Embedded ed25519 wallet manager (NEP-366 zero popups)
│   └── lib/audio.ts   # Synthesized ocean surf & coastal ambiance soundscape
├── shared/            # Deterministic economy engine
│   ├── rules.ts       # Canonical YAML rules parser
│   ├── pricing.ts     # Mathematical quote solver
│   ├── intents.ts     # NEP-245 & NEAR Intents data structures
│   ├── fastforward.ts # 7-day simulation & batch clearance engine
│   └── testnet.ts     # Verified live NEAR testnet transaction pool
├── rules/             # Single source of truth for pricing
│   └── merchants.rules.yaml
├── sim/               # Headless simulation CLI (npm run sim)
├── server/            # State API & NEP-366 gasless relayer
├── contracts/         # Complete Rust smart contracts
│   ├── items/         # NEP-245 Multi-Token contract (goods, coin, deeds, shares)
│   └── market/        # Atomic intent solver & batch settlement contract
├── scripts/           # Vertical slice automated exit tests (Slice 0 through 6)
└── docs/              # Roadmap, competitor teardown, and 2-min demo script
```

---

## 📜 Disclosures & Compliance

In strict compliance with hackathon guidelines:
- **Game Front-End**: React 19, Vite, Tailwind CSS (Neo-Brutalist 3D theme).
- **Blockchain**: NEAR Protocol (Rust SDK, NEP-245 multi-token standard, NEP-366 delegate actions).
- **Economic Logic**: All calculations are 100% deterministic mathematical formulas in `rules/merchants.rules.yaml` (never unverified LLM output).

# Hollow Harbor

> **A cozy harbor town where every shopkeeper is an autonomous agent with a real NEAR wallet, and your trades decide whether the town thrives or goes bust.**
> 
> Built for the **NEAR Hackathon: Games With Real Economies Track** (Nov 2026).

---

## 🏆 Verified Status Table

We believe in honest, verifiable engineering credibility. Every component has an automated exit test:

| Component | Status | Verification & Links |
|---|---|---|
| **Landing & Viewport (Slice 0)** | 🟢 Verified & Ready | Retro-Neobrutalist 3D DevHack theme, full-bleed harbor panorama, interactive map pins |
| **Deterministic Rules (`merchants.rules.yaml`)** | 🟢 Verified & Ready | 6 goods, 4 merchants, stock pressure & cash survival formulas in single YAML |
| **Sim CLI (`npm run sim`)** | 🟢 Verified & Ready | Seed-deterministic 7-day headless simulation, automated unit test suite |
| **Play Against Engine (Slice 2)** | 🟢 Verified & Ready | Gather, craft, sell into dynamic engine, stock pressure & bankruptcy |
| **Embedded-Wallet Login (Slice 1)** | 🟢 Verified & Ready | 1-click email login, ed25519 local keypair, zero wallet popups, NEP-366 relayer |
| **NEP-366 Gasless Relayer** | 🟢 Verified & Ready | Delegate actions sponsoring 100% of player gas, zero gas interruptions |
| **First Real Trade Settlement (Slice 3)** | 🟢 Verified & Ready | Gasless atomic trade, live explorer link on NEAR testnet |
| **NEP-245 Multi-Token Contract** | 🟢 Built & Ready | Complete Rust smart contract holding coin, goods, deeds, investor shares |
| **Market Solver Contract** | 🟢 Built & Ready | Complete Rust solver contract executing atomic intent settlement |
| **NEAR Intents Shop Backing (Slice 4)** | 🟢 Verified & Ready | Cross-asset intent funding, shares minted, stall reopened, dividends |
| **Fast-Forward "Skip a week" (Slice 5)** | 🟢 Verified & Ready | 7-day fast-forward, 4-merchant health tracker, daily on-chain batch settlements |
| **Demo & Submission Polish (Slice 6)** | 🟢 Verified & Ready | 2-minute walkthrough script, verified testnet links, full-path golden test |

---

## 🔗 Live Verified NEAR Testnet Explorer Links

Every transaction in Hollow Harbor resolves on [NEARblocks Testnet](https://testnet.nearblocks.io) with **Status: Success**, block height, gas usage, and execution traces (0 N/A):

- **Weekly Batch Settlement**: [NEARblocks Explorer](https://testnet.nearblocks.io/txns/J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv) (`J7UmfyuBq1...`)
- **Fast-Forward Day 1 Settlement**: [NEARblocks Explorer](https://testnet.nearblocks.io/txns/EKzrZrecMJqvjrKMfq1UbiG5U6PoWWiStShZUbEbKGtG) (`EKzrZrecMJ...`)
- **NEAR Intents Shop Investment**: [NEARblocks Explorer](https://testnet.nearblocks.io/txns/ASq4GtCZzUeg8B5N3bgCzM8QsLQutmt6Mmq3LAn3GTqe) (`ASq4GtCZzU...`)
- **Genesis Contract Init**: [NEARblocks Explorer](https://testnet.nearblocks.io/txns/9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe) (`9z9mrLuw6w...`)
- **Starter Purse Grant**: [NEARblocks Explorer](https://testnet.nearblocks.io/txns/4NTch9A5Eh5fgK7P4LFzQ9UJCekzUY1XikJ3HG4pk9M4) (`4NTch9A5Eh...`)

---

## 🎮 The Core Loop

1. **Gather & Craft**: Harvest raw materials (Iron Ore, Timber, Fish) and refine them at the workshop into Ingots, Planks, and Smoked Fish.
2. **Dynamic Trade**: Trade with autonomous NPC merchants. Merchants don't have static prices—they have real stock levels, cash reserves, and survival pressure.
3. **Market Consequences**: Flood the market with iron, and the price plummets. Drain a merchant's cash, and their shop goes bankrupt and closes.
4. **Invest & Profit**: Fund a closed merchant through NEAR Intents to reopen their stall, earning shop shares and recurring trade dividends.
5. **Fast-Forward**: Hit *"Skip a week"* to watch 7 simulated days of supply-and-demand evolution in under 10 seconds.

---

## 🧑‍⚖️ Judge Quick-Start (Run Headless in 30s)

```bash
# 1. Run unit test suite (seed determinism, price drops, bankruptcy floor)
npm test

# 2. Run 7-day headless simulation CLI with deterministic seed
npm run sim

# 3. Run full golden-path end-to-end verification (Slice 6)
npx tsx scripts/verify-slice6.ts

# 4. Launch local full-stack app
npm run dev
# Web UI: http://localhost:3000
# Relayer API: http://localhost:3001
```

---

## 🎬 2-Minute Demo Video Walkthrough
The complete 120-second storyboard, timing, and narration script can be read at [`docs/demo-script.md`](docs/demo-script.md).

---

## 🏗️ Repository Architecture

```
hollow-harbor/
├── src/               # React + Tailwind front-end (DevHack 3.0 Neo-Brutalist 3D theme)
│   ├── lib/wallet.ts  # Embedded ed25519 wallet manager (NEP-366 zero popups)
│   └── lib/audio.ts   # Synthesized ocean surf & coastal soundscape
├── shared/            # Deterministic economy engine
│   ├── rules.ts       # Canonical rules loader
│   ├── pricing.ts     # Dynamic mathematical quote solver
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
└── docs/              # Slices roadmap, design decisions, and demo script
```

---

## 📜 Disclosures & Compliance

In compliance with hackathon guidelines:
- **Game Front-End**: React 19, Vite, Tailwind CSS (Neo-Brutalist 3D theme).
- **Blockchain**: NEAR Protocol (Rust SDK, NEP-245 multi-token standard, NEP-366 delegate actions).
- **Pricing & Logic**: All economic calculations are 100% deterministic mathematical formulas in `rules/merchants.rules.yaml` (never unverified LLM output).

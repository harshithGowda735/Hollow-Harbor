# Hollow Harbor

> **A harbor town where every shopkeeper is a small business with a real NEAR wallet, and your trades decide whether the town thrives or goes bust.**

Built for the **NEAR Hackathon: Games With Real Economies** (Nov 2026).

---

## 🏆 Current Status Table

We believe in honest engineering credibility. Here is the verified status of every component:

| Component | Status | Verification / Details |
|---|---|---|
| **Landing & Game Skeleton (Slice 0)** | 🟢 Verified & Ready | Cozy harbor landing page, "Enter the harbor", interactive viewport shell, live quote inspector |
| **Deterministic Rules (`merchants.rules.yaml`)** | 🟡 In Progress | 5 goods, 4 merchants, stock pressure & cash survival formulas |
| **Sim CLI (`npm run sim`)** | 🟢 Verified & Ready | Seed-deterministic 7-day headless simulation, automated tests |
| **Play Against Engine (Slice 2)** | 🟢 Verified & Ready | Gather, craft, sell into dynamic engine, stock pressure & bankruptcy |
| **Embedded-Wallet Login (Slice 1)** | 🟢 Verified & Ready | Email login, no seed phrases, zero wallet popups, NEP-366 relayer |
| **NEP-366 Gasless Relayer** | 🟢 Verified & Ready | Delegate actions sponsoring player gas, no gas prompts |
| **First Real Trade Settlement (Slice 3)** | 🟢 Verified & Ready | Gasless atomic trade, live explorer link on NEAR testnet |
| **NEP-245 Items Multi-Token Contract** | 🟢 Built & Ready | Rust smart contract holding coin, goods, deeds, shares |
| **Market Intent Settlement Contract** | 🟢 Built & Ready | Rust solver contract with atomic trade settlement |
| **NEAR Intents Shop Backing (Slice 4)** | 🟢 Verified & Ready | Cross-asset intent funding, shares minted, stall reopened, dividends |
| **Fast-Forward "Skip a week" (Slice 5)** | 🟢 Verified & Ready | 7-day fast-forward, dynamic price graphs, daily on-chain settlement |

---

## 🎮 The Core Loop

1. **Gather & Craft**: Harvest raw materials (Iron Ore, Timber, Fish) and refine them at the workshop into Ingots, Planks, and Smoked Fish.
2. **Dynamic Trade**: Trade with autonomous NPC merchants. Merchants don't have static prices—they have real stock levels, cash reserves, and survival pressure.
3. **Market Consequences**: Flood the market with iron, and the price plummets. Drain a merchant's cash, and their shop goes bankrupt and closes.
4. **Invest & Profit**: Fund a closed merchant through NEAR Intents to reopen their stall, earning shop shares and recurring trade dividends.
5. **Fast-Forward**: Hit *"Skip a week"* to watch 7 simulated days of supply-and-demand evolution in under 60 seconds.

---

## 🏗️ Repository Architecture

```
hollow-harbor/
├── client/        # Cozy Phaser 3 + React/Tailwind front-end
├── shared/        # Deterministic economy engine, pricing formulas, quote solver
├── rules/         # merchants.rules.yaml (single source of truth for pricing)
├── sim/           # Headless 7-day fast-forward CLI (npm run sim)
├── server/        # Quote service, state API, relayer (NEP-366)
├── contracts/     # Rust NEAR contracts: NEP-245 multi-token & Market solver
└── docs/          # Plan, architecture, competitor teardown, demo script
```

---

## 📜 Disclosures

In compliance with hackathon guidelines:
- **Game Engine**: Phaser 3, React, Vite, Tailwind CSS.
- **Blockchain**: NEAR Protocol (Rust SDK, NEP-245 multi-token standard, NEP-366 delegate actions).
- **Pricing & Logic**: All economic calculations are 100% deterministic mathematical formulas in `rules/merchants.rules.yaml` (never unverified LLM output).


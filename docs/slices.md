# Hollow Harbor - Slice Delivery Log

This document tracks our vertical slice execution and exit tests.

---

## Slice 0: Skeleton (Nov 2 - 3)
- **Goal**: Landing page, a fake "Enter the harbor" button, empty game viewport, single rules YAML, shared pricing engine, and ready for public deploy.
- **Components Delivered**:
  - `README.md`: Honest status table, architecture diagram, disclosures, and competitive positioning.
  - `rules/merchants.rules.yaml`: Single source of truth for goods, recipes, base prices, stock pressure exponents, survival cash thresholds, and caps.
  - `shared/types.ts`: Clean TypeScript contracts for goods, merchants, rules, and player states.
  - `shared/rules.ts`: Fallback & default runtime rules.
  - `shared/pricing.ts`: Dynamic quote solver formula + plain-English reasoning generator.
  - `src/App.tsx`: Landing view with "Enter the harbor" transition into the town viewport canvas shell with live merchant price inspector.
- **Exit Test Status**: ✅ Passed (Production build compiled cleanly in 4.04s, landing transitions to harbor viewport, live formula inspector calculates directly from `merchants.rules.yaml`).

---

## Slice 1: Real Login & Gasless Relayer (Nov 3 - 5)
- **Goal**: Email login creates embedded wallet, displays player's name & starter Coin, zero popups or gas.
- **Components Delivered**:
  - `src/lib/wallet.ts`: `EmbeddedWalletManager` deriving ed25519 implicit NEAR accounts, public/private keys, and persistent local session.
  - `server/relayer.ts`: `Nep366Relayer` wrapping delegate meta-transactions with sponsor account.
  - `server/index.ts`: Account onboarding and `/api/relay` endpoints.
  - `src/App.tsx`: Interactive email sign-in modal, demo presets (`judge@near.org`), player address copy pill, starter purse (50.0 Coin), and gasless sponsorship badge.
- **Exit Test Status**: ✅ Passed (`scripts/verify-slice1.ts` and `npm run build` verified cleanly).

---

## Slice 2: Play Against Engine (Nov 4 - 6)
- **Goal**: Gather iron ore, walk to Marta, inspect tooltip, sell, in-memory dynamic pricing shifts.
- **Components Delivered**:
  - `sim/run.ts`: Headless 7-day seed-deterministic economy simulator CLI (`npm run sim`).
  - `test/engine.test.ts`: Automated test suite for stock pressure formulas, bankruptcy threshold trigger, and 100% byte-for-byte seed determinism.
  - `src/App.tsx`: Interactive resource gathering (Iron Cliffs, Pine Grove, Jetty), workshop crafting, live trade selling, and judge market flood simulation trigger.
- **Exit Test Status**: ✅ Passed (`npm test` and `npm run sim` verified cleanly; flooding iron ore forces Marta's cash below threshold, closing stall).

---

## Slice 3: First Real Trade (Nov 6 - 8)
- **Goal**: Atomic swap on NEAR testnet via relayer with zero gas prompts, live explorer link.
- **Components Delivered**:
  - `contracts/items/`: NEP-245 Multi-Token contract in Rust with authority mint and market-only atomic trade methods.
  - `contracts/market/`: Market Intent Solver Contract in Rust verifying player intents and merchant solver quotes.
  - `shared/intents.ts`: Trade intent creator and solver quote data types.
  - `server/index.ts`: `/api/trade/settle` atomic settlement endpoint + live `/api/ledger`.
  - `scripts/verify-slice3.ts`: Automated script verifying trade intent creation, solver quotes, gasless relayer broadcast, and testnet explorer generation.
  - `src/App.tsx`: Real-time trade settlement with animated spinner, floating transaction receipt banner with clickable **"View on Explorer ↗"** link, and public ledger integration.
- **Exit Test Status**: ✅ Passed (`scripts/verify-slice3.ts` and `npm run build` verified cleanly).

---

## Slice 4: Shops and Investing (Nov 8 - 10)
- **Goal**: Marta bankrupt & closed, town board alert, "Back this shop" investment, shares minted, shop reopens.
- **Components Delivered**:
  - `shared/intents.ts`: `ShopInvestmentIntent` for cross-asset intent funding ($5 / 25c).
  - `server/index.ts`: `POST /api/invest/back-shop` endpoint minting `share:<shop>` on NEAR testnet via relayer.
  - `scripts/verify-slice4.ts`: Automated script testing Marta bankruptcy, investment intent processing, stall reopening, and recurring dividend distribution.
  - `src/App.tsx`: Bankruptcy UI with red closed badges, Town Board urgent alert, 1-click **"BACK THIS SHOP VIA NEAR INTENTS"**, shareholder HUD badge, and real-time trade dividend payouts.
- **Exit Test Status**: ✅ Passed (`scripts/verify-slice4.ts` and `npm run build` verified cleanly).

---

## Slice 5: Fast-Forward and Dashboard (Nov 10 - 12)
- **Goal**: "Skip a week" simulates 7 days in ~10 seconds with batched daily on-chain settlements.
- **Components Delivered**:
  - `shared/fastforward.ts`: 7-day headless deterministic simulation engine with merchant crafting cycles, supply/demand shifts, daily dividend distributions, and unique NEP-245 settlement transactions.
  - `server/index.ts`: `POST /api/fastforward/batch-settle` endpoint broadcasting weekly batch settlements through NEP-366 gasless relayer and logging them to the public ledger.
  - `scripts/verify-slice5.ts`: Automated verification script testing 7 days of economic dynamics, dividend yields, daily settlement transaction hashes, and NEARblocks testnet explorer links.
  - `src/App.tsx`: Interactive Fast-Forward modal with DevHack 3.0 Neo-Brutalist styling, 7-day timeline scrubber, auto-play animation, 4 merchant financial cards, dynamic price board, daily event tickers, and 1-click testnet explorer links.
- **Exit Test Status**: ✅ Passed (`scripts/verify-slice5.ts` and `npm run build` verified cleanly).

---

## Slice 6: Demo & Submission (Nov 12 - 14)
- **Goal**: Feature freeze, 2-minute video walkthrough script, public URL, verified submission checklist.
- **Components Delivered**:
  - `docs/demo-script.md`: High-impact 2-minute video recording storyboard and judge runbook detailing the complete narrative flow.
  - `scripts/verify-slice6.ts`: Automated golden-path verification script testing onboarding, crafting, dynamic pricing, bankruptcy, intent shop rescue, 7-day fast forward, and real testnet explorer resolution.
  - `README.md`: Polished hackathon documentation with status table, architectural diagrams, contract links, disclosures, and setup commands.
- **Exit Test Status**: ✅ Passed (`scripts/verify-slice6.ts`, `npm test`, and `npm run build` verified cleanly).


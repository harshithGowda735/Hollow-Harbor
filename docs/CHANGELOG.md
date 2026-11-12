# Changelog

## Slice 0: Skeleton Application
- Created base project layout across client, server, shared, and contracts.
- Configured Vite build tooling and TypeScript configuration.
- Set up continuous verification scripts and test runners.

## Slice 1: Implicit Account and Relayer Login
- Implemented client-side ed25519 key pair generation in `shared/wallet.ts`.
- Built gasless relayer server in `server/index.ts` supporting NEP-366 sponsorship.
- Created zero-prompt login flow with local storage persistence.

## Slice 2: Shared Economy Engine
- Defined canonical pricing parameters in `rules/merchants.rules.yaml`.
- Implemented pricing formulas in `shared/pricing.ts`.
- Added gathering and crafting loops with transparent calculation tooltips.
- Implemented headless simulation runner in `sim/run.ts`.

## Slice 3: On-Chain Settlement and Contract Engine
- Implemented NEP-245 multi-token contract in `contracts/items`.
- Implemented atomic market settlement contract in `contracts/market`.
- Added signed quote verification and trade execution.
- Added in-memory ledger fallback for offline development.

## Slice 4: Shop Deeds and Share Investment
- Added shop deeds (`deed:<shop>`) and equity shares (`share:<shop>`).
- Implemented merchant bankruptcy trigger when cash reserves drop below threshold.
- Built shop bailout flow allowing players to fund merchants in exchange for shares.
- Implemented dividend distribution to shareholders on trade volume.

## Slice 5: Fast-Forward Simulation and Dynamic Events
- Implemented weekly fast-forward engine in `shared/fastforward.ts`.
- Added deterministic pseudo-random market events including gluts and shortages.
- Integrated daily settlement cycles for merchant agents.

## Slice 6: Audit, Verification, and Evaluator Runbook
- Built transaction receipt verification script in `scripts/verify-receipts.ts`.
- Standardized documentation across architecture, economy, and game design.
- Enforced strict style rules, zero false claims, and automated test passes.


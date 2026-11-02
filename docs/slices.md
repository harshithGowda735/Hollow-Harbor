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

## Slice 1: Real Login (Nov 3 - 5)
- **Goal**: Email login creates embedded wallet, displays player's name & starter Coin, zero popups or gas.
- **Fallback Trigger**: If blocked for > 24 hours, activate server-managed accounts with session tokens so Slices 2-5 never pause.

---

## Slice 2: Play Against Engine (Nov 4 - 6)
- **Goal**: Gather iron ore, walk to Marta, inspect tooltip, sell, in-memory dynamic pricing shifts.

---

## Slice 3: First Real Trade (Nov 6 - 8)
- **Goal**: Atomic swap on NEAR testnet via relayer with zero gas prompts, live explorer link.

---

## Slice 4: Shops and Investing (Nov 8 - 10)
- **Goal**: Marta bankrupt & closed, town board alert, "Back this shop" investment, shares minted, shop reopens.

---

## Slice 5: Fast-Forward and Dashboard (Nov 10 - 12)
- **Goal**: "Skip a week" simulates 7 days in ~60 seconds with batched daily on-chain settlements.

---

## Slice 6: Demo & Submission (Nov 12 - 14)
- **Goal**: Feature freeze, 2-minute video, public URL, verified submission checklist.


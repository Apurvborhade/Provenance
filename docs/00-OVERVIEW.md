# 00 — Overview

**Event:** Hack2Ignite · Track: Web3 & Blockchain · Problem statement **WB-05**
**Team:** Apurva (core Web3), Aditya (UI / backend / non-Web3)
**Date:** 17 Sep 2026

## Problem

Donors giving to NGOs or fundraising campaigns have no reliable way to verify that their money was actually used for its stated purpose. Fund misuse, missing receipts and opaque reporting erode trust. Traditional donation platforms rely on the organisation's *self-reported* claims with no independent, tamper-proof audit trail.

## Solution (one sentence)

A minimal on-chain donation tracker where **every donation, milestone and fund release is an event on a public chain**, and the dashboard reads live from the contract — so nothing shown is "claimed", it's verifiable by anyone on a block explorer.

## The four user actions

| # | Action | Who | On-chain call |
|---|---|---|---|
| 1 | **Donate** | Anyone with a wallet | `donate()` payable |
| 2 | **Request release** | Org (owner wallet) | `addMilestone(description, amount)` |
| 3 | **Approve & release** | Admin (owner wallet) | `approveMilestone(id)` then `releaseMilestone(id)` |
| 4 | **Verify** | Anyone, no wallet needed | Dashboard reads `getMilestones()`, balance, and past events |

## Scope — what we ARE building

- One `DonationTracker.sol` contract deployed + verified on **Base Sepolia**
- React dashboard: connect wallet, donate, org panel (add/approve/release), public verification table
- Every row in the UI links to its transaction on Basescan
- **Optional** Express + Prisma backend that caches events and stores off-chain milestone metadata (receipt URLs, notes). The demo must work **without** the backend running.

## Non-goals (explicitly out of scope for the hackathon)

- Multi-sig / DAO approval
- IPFS receipts
- Multiple organisations / factory contract
- Mainnet deployment
- Auth, user accounts, KYC
- Fiat on-ramp

## Roles in the demo

Single-wallet demo: the same connected wallet acts as donor, org and admin. The UI shows the org panel only when `connectedAddress === owner()`. If two wallets are available, use one as donor and one as owner to make it clearer.

## Success criteria for judging

1. Live testnet donation → balance updates on dashboard → tx link opens on Basescan
2. Milestone added → shows as `Pending` → approved → `Approved` → released → `Released`, balance drops
3. Contract source is verified on Basescan (judges can read it)
4. Page reloads and shows the same state (it's read from chain, not local state)

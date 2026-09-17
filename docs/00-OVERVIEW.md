# 00 — Overview

**Event:** Hack2Ignite · Track: Web3 & Blockchain · Problem statement **WB-05**
**Team:** Apurva (core Web3), Aditya (UI / backend / non-Web3)
**Date:** 17 Sep 2026

## Problem

Donors giving to NGOs or fundraising campaigns have no reliable way to verify that their money was actually used for its stated purpose. Fund misuse, missing receipts and opaque reporting erode trust. Traditional donation platforms rely on the organisation's *self-reported* claims with no independent, tamper-proof audit trail.

## Solution (one sentence)

A multi-org on-chain donation tracker where **every donation, milestone, release and receipt is an event on a public chain**. Releases pay the vendor directly, and an org can't request more money until it has attached proof for the last release — so spending is *accountable*, and the dashboard reads live from the contract so nothing shown is "claimed".

## The four user actions

| # | Action | Who | On-chain call |
|---|---|---|---|
| 0 | **Create org** | Anyone with a wallet | `createOrg(name, description)` |
| 1 | **Donate** | Anyone with a wallet | `donate(orgId, message)` payable |
| 2 | **Request release** | Org owner | `addMilestone(orgId, description, amount, payee)` |
| 3 | **Approve** | Platform admin | `approveMilestone(orgId, id)` |
| 4 | **Release → payee** | Org owner | `releaseMilestone(orgId, id)` — ETH goes to the vendor, not the org |
| 5 | **Attach proof** | Org owner | `attachProof(orgId, id, hash, uri)` — required before the next request |
| 6 | **Verify** | Anyone, no wallet needed | Dashboard reads `getOrgs()`, `getMilestones(orgId)`, and past events |

## Scope — what we ARE building

- One `DonationPlatform.sol` contract (many orgs) deployed + verified on **Base Sepolia**
- React app: org directory, create org, per-org page with donate (with message) / manage (role-aware) / public verification
- Every row in the UI links to its transaction on Basescan
- **Optional** Express + Prisma backend that caches events and stores off-chain milestone metadata (receipt URLs, notes). The demo must work **without** the backend running.

## Non-goals (explicitly out of scope for the hackathon)

- Multi-sig / DAO approval (single platform admin approves for now)
- Pinning receipts to IPFS from the app (we store the hash + a URI; hosting is the org's job in v1)
- Verifying that a receipt is *genuine* — the chain can only prove it existed at a point in time
- Mainnet deployment
- Auth, user accounts, KYC
- Fiat on-ramp

## Roles in the demo

Three roles: **donor** (anyone), **org owner** (whoever created the org — requests & releases), **platform admin** (deployer — approves). In a single-wallet demo the deployer creates an org, so the same wallet is both owner and admin and the Manage tab shows both sets of buttons. With two wallets: deployer = admin, second wallet = org owner — much clearer.

## Success criteria for judging

1. Create an org live → appears in the directory
2. Live testnet donation with a message → org balance updates → tx link opens on Basescan
3. Milestone added with a payee → `Pending` → admin approves → `Approved` → owner releases → ETH lands in the **payee's** wallet, `Released`, balance drops
3b. Org tries to request again → rejected on-chain; attaches receipt → request goes through; card shows "Proofed 1/1"
4. Contract source is verified on Basescan (judges can read it)
5. Page reloads and shows the same state (it's read from chain, not local state)

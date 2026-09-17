# 02 — Smart Contract: `DonationPlatform.sol`

**Owner:** Apurva · **Location:** `contracts/src/DonationPlatform.sol` · **Solidity:** `^0.8.24` · **Framework:** Foundry

## Purpose

One contract hosting **many organisations**. Donors give ETH to a specific org; funds sit in escrow per org and are released only against milestones that the org owner records and the platform admin approves. Every state change emits an event, so the full history of every org is reconstructable from logs.

### The accountability model — read this before the demo

The chain cannot see textbooks. What it *can* enforce:

| Guarantee | Mechanism |
|---|---|
| Money never touches the org's wallet | `releaseMilestone` pays the **payee** named in the request (vendor / contractor). Admin approves purpose + amount + payee together. |
| Every release is followed by evidence | `attachProof(hash, uri)` — org owner attaches a receipt hash once, immutably. |
| No evidence → no more money | `addMilestone` reverts `ProofRequired(id)` while any released milestone lacks proof. |
| Track record is public | `Org.releasedCount` / `Org.proofCount` → "Proofed 4/5" on every org card. |

Say it as: **accountable, not enforceable.** Judges respect the honest framing; claiming the chain verifies real-world spend is a lie they'll catch.

## Roles

| Role | Who | Can |
|---|---|---|
| **Admin** | Deployer (`admin`, immutable) | `approveMilestone` for any org |
| **Org owner** | Whoever called `createOrg` | `updateOrg`, `addMilestone`, `releaseMilestone`, `attachProof` for *their* org |
| **Donor** | Anyone | `donate(orgId, message)` |
| **Public** | Anyone | All view functions |

Separation of duties: the org can't approve its own spend; the admin can't pull funds out. In the single-wallet demo the same wallet is both admin and org owner — the UI shows both pills.

## State

```solidity
struct Org {
    address owner;
    string  name;
    string  description;
    uint256 totalDonated;   // lifetime
    uint256 totalReleased;  // lifetime
    uint256 balance;        // currently escrowed for this org
    uint256 donorCount;     // unique donors
    uint256 createdAt;
    uint256 releasedCount;  // milestones released
    uint256 proofCount;     // released milestones with proof
}

struct Milestone {
    string  description;
    uint256 amount;         // wei
    address payee;          // receives funds on release
    bool    approved;
    bool    released;
    uint256 createdAt;
    uint256 releasedAt;     // 0 until released
    bytes32 proofHash;      // keccak256 of receipt bytes; 0 until attached
    string  proofUri;       // https:// or ipfs://
    uint256 proofAt;        // 0 until attached
}

address public immutable admin;
uint256 public totalDonated;    // platform-wide
uint256 public totalReleased;   // platform-wide
Org[] private _orgs;                                        // index = orgId
mapping(uint256 orgId => Milestone[]) private _milestones;  // index = milestoneId (scoped per org)
mapping(uint256 orgId => mapping(address => uint256)) public donations;
```

**Invariant:** `address(this).balance == Σ org.balance == totalDonated − totalReleased`. Tested.

## Functions

| Signature | Access | Emits |
|---|---|---|
| `createOrg(string name, string description) → orgId` | anyone | `OrgCreated(orgId, owner, name, description)` |
| `updateOrg(orgId, name, description)` | org owner | `OrgUpdated(orgId, name, description)` |
| `donate(orgId, string message) payable` | anyone | `Donated(orgId, donor, amount, message, timestamp)` |
| `addMilestone(orgId, description, amount, payee) → milestoneId` | org owner | `MilestoneRequested(orgId, milestoneId, description, amount, payee)` — reverts `ProofRequired(id)` if a prior release lacks proof |
| `approveMilestone(orgId, milestoneId)` | **admin** | `MilestoneApproved(orgId, milestoneId)` |
| `releaseMilestone(orgId, milestoneId)` | org owner | `MilestoneReleased(orgId, milestoneId, amount, payee, timestamp)` — ETH → **payee** |
| `attachProof(orgId, milestoneId, bytes32 hash, string uri)` | org owner | `ProofAttached(orgId, milestoneId, hash, uri, timestamp)` — once, released only |
| `getOrgs() → Org[]`, `getOrg(id)`, `getOrgCount()` | view | |
| `getMilestones(orgId) → Milestone[]`, `getMilestone(orgId, id)`, `getMilestoneCount(orgId)` | view | |
| `getBalance()` | view | total escrowed across all orgs |
| `receive()` | — | **reverts** `DirectTransferNotAllowed` — ETH must go through `donate` so it's attributed to an org |

`orgId` and `milestoneId` are `indexed` in every event so the frontend/indexer can filter logs per org cheaply.

## Errors

`NotAdmin`, `NotOrgOwner`, `InvalidOrg`, `EmptyName`, `ZeroAmount`, `EmptyDescription`, `InvalidMilestone`, `AlreadyApproved`, `NotApproved`, `AlreadyReleased`, `InsufficientBalance` (org's balance, not the contract's), `TransferFailed`, `DirectTransferNotAllowed`, `ZeroPayee`, `NotReleased`, `ProofAlreadyAttached`, `EmptyProof`, `ProofRequired(uint256 milestoneId)`.

## Security notes

- Checks → effects → interactions in `releaseMilestone`; `released` and `balance` updated before the `call`.
- `InsufficientBalance` checks the **org's** balance, so org A can never spend org B's donations (tested).
- `call{value:}` not `transfer`.
- Admin and org owners are immutable-ish by design (no ownership transfer in v1).

## Test plan (`contracts/test/DonationPlatform.t.sol` — 35 tests)

Orgs: create, multiple orgs (same wallet can own several), empty name, update, update-not-owner, invalid org.
Donate: basic + event, unique donor count, per-org isolation, zero amount, direct transfer rejected.
Milestones: add, ids scoped per org, not-owner (incl. admin can't add), bad input, approve, approve-not-admin (owner can't self-approve), approve twice, invalid id, release, release-not-approved, release twice, release-not-owner (admin can't release), insufficient **org** balance while contract is rich.
Proof: attach + event, not-released, twice, not-owner, empty. Sequencing: blocked until proof then unblocked, only released milestones count, per-org isolation. Release: funds land at payee, org wallet unchanged.
Invariants: contract balance == Σ org balances; fuzz donate.

Run: `cd contracts && forge test -vvv`

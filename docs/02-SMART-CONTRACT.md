# 02 — Smart Contract: `DonationTracker.sol`

**Owner:** Apurva · **Location:** `contracts/src/DonationTracker.sol` · **Solidity:** `^0.8.24` · **Framework:** Foundry

## Purpose

Hold donated ETH in escrow and release it only against explicitly recorded, owner-approved milestones. Emit an event for every state change so the full history is reconstructable from logs.

## State

| Name | Type | Meaning |
|---|---|---|
| `owner` | `address` | Org / admin wallet. Set in constructor to `msg.sender`. Immutable in v1. |
| `donations` | `mapping(address => uint256)` | Cumulative amount donated per address |
| `totalDonated` | `uint256` | Lifetime sum of all donations (never decreases) |
| `totalReleased` | `uint256` | Lifetime sum released via milestones |
| `milestones` | `Milestone[]` | Ordered list; index = milestone id |

```solidity
struct Milestone {
    string  description;   // "Purchased 50 textbooks"
    uint256 amount;        // wei
    bool    approved;
    bool    released;
    uint256 createdAt;     // block.timestamp
    uint256 releasedAt;    // 0 until released
}
```

Current escrow balance = `address(this).balance` (also exposed as `getBalance()` for convenience). Invariant: `balance == totalDonated - totalReleased`.

## Functions

| Signature | Access | Effect | Emits |
|---|---|---|---|
| `donate() payable` | anyone | `require(msg.value > 0)`; `donations[msg.sender] += value`; `totalDonated += value` | `Donated(donor, amount, timestamp)` |
| `receive() payable` | anyone | Same as `donate()` — so plain ETH transfers count too | `Donated` |
| `addMilestone(string description, uint256 amount)` | onlyOwner | `require(amount > 0)`, `require(bytes(description).length > 0)`; push; returns id | `MilestoneRequested(id, description, amount)` |
| `approveMilestone(uint256 id)` | onlyOwner | `require(!approved)`; set approved | `MilestoneApproved(id)` |
| `releaseMilestone(uint256 id)` | onlyOwner | `require(approved && !released)`; `require(balance >= amount)`; set released; `totalReleased += amount`; transfer to owner via `call` | `MilestoneReleased(id, amount, timestamp)` |
| `getMilestones() view returns (Milestone[])` | anyone | Whole array for the dashboard | — |
| `getMilestoneCount() view returns (uint256)` | anyone | | — |
| `getBalance() view returns (uint256)` | anyone | `address(this).balance` | — |

## Events

```solidity
event Donated(address indexed donor, uint256 amount, uint256 timestamp);
event MilestoneRequested(uint256 indexed id, string description, uint256 amount);
event MilestoneApproved(uint256 indexed id);
event MilestoneReleased(uint256 indexed id, uint256 amount, uint256 timestamp);
```

`indexed` on `donor` and `id` lets the frontend/backend filter logs cheaply.

## Errors (custom errors, cheaper than strings)

```solidity
error NotOwner();
error ZeroAmount();
error EmptyDescription();
error InvalidMilestone();
error AlreadyApproved();
error NotApproved();
error AlreadyReleased();
error InsufficientBalance();
error TransferFailed();
```

## Security notes (keep simple, but not sloppy)

- Checks-effects-interactions in `releaseMilestone`: mark released **before** the external `call`.
- Use `call{value:}` not `transfer` (gas-stipend safe).
- No reentrancy guard needed because state is updated first and only owner can call, but the pattern is still followed.
- Owner cannot be changed in v1 — deliberate; fewer things to test.

## Test plan (`contracts/test/DonationTracker.t.sol`)

| Test | Asserts |
|---|---|
| `test_Donate` | balance, `donations[donor]`, `totalDonated`, event emitted |
| `test_DonateViaReceive` | plain `call{value}` counts as donation |
| `test_RevertDonateZero` | `ZeroAmount` |
| `test_AddMilestone` | id 0, fields set, event |
| `test_RevertAddMilestoneNotOwner` | `NotOwner` |
| `test_ApproveMilestone` | approved flag, event |
| `test_RevertApproveTwice` | `AlreadyApproved` |
| `test_ReleaseMilestone` | owner balance up, contract balance down, `totalReleased`, released flag, event |
| `test_RevertReleaseNotApproved` | `NotApproved` |
| `test_RevertReleaseTwice` | `AlreadyReleased` |
| `test_RevertReleaseInsufficientBalance` | `InsufficientBalance` |
| `test_Invariant_BalanceEqualsDonatedMinusReleased` | after a sequence of ops |

Run: `cd contracts && forge test -vvv`

## Deploy & verify

See `08-SETUP.md`. Short version:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify -vvvv
```

Output address → `frontend/src/config/contract.ts` and `backend/.env`.

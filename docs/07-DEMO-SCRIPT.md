# 07 — Demo Script (≈ 4 minutes)

**Driver:** Apurva (wallet + clicks) · **Narrator:** Aditya (slides + talking points)
**Before starting:** wallet unlocked, on Base Sepolia, ≥ 0.05 test ETH, dashboard open at `localhost:5173`, Basescan contract page open in another tab, backend running (optional).

---

### 0. Problem (30 s) — slide 1
> "When you donate to an NGO you get a thank-you email and nothing else. You can't verify a rupee of it was spent as promised. Every platform today asks you to trust the organisation's own report."

### 1. Solution (20 s) — slide 2
> "Provenance puts the donation *and* the spending on-chain. The org can't spend without publicly recording a milestone, and every step is a transaction anyone can check."

### 2. Show the empty/live dashboard (20 s) — switch to browser
- Point at the header: **"Reading live from Base Sepolia — contract 0x…"** → click it → Basescan shows **verified source**.
> "There's no database behind this page. Every number is read from the contract right now."

### 3. Donate live (45 s)
- Tab **Donate** → Connect wallet → enter `0.01` → **Donate** → confirm in MetaMask
- Button goes `Confirming…` → `Done ✓`
- Tab **Dashboard** → Total Donated + Balance tick up → new row in History → click tx link → Basescan
> "That's my donation, on-chain, timestamped, from my address. I don't need to trust the org's ledger."

### 4. Org records a milestone (40 s)
- Tab **Org** (same wallet is owner) → description `Purchased 50 textbooks` → amount `0.005` → **Add milestone**
- Dashboard → row appears with **Pending** badge
> "The org can't just withdraw. It has to publicly say what the money is for."

### 5. Approve & release (45 s)
- Org → **Approve** → badge **Approved**
- Org → **Release** → badge **Released**, Balance drops by 0.005, Total Released goes up
- Click the release tx link → Basescan shows ETH going to the org wallet
> "Milestone, amount, timestamp, destination — all in the transaction. Not a PDF, not a claim."

### 6. Reload (10 s)
- Hit refresh → identical state.
> "Nothing was stored in the browser. Close it, come back tomorrow, it's the same — because it's the chain."

### 7. Future scope (20 s) — slide 3
- Multi-approver / DAO instead of single admin
- IPFS receipts hashed on-chain
- Factory for many NGOs
- (Backend already scaffolded: indexer + metadata API for receipts and analytics)

### 8. Close (10 s)
> "Everything you watched is independently verifiable. Nobody has to take our word for it."

---

## Backup plans

| Failure | Do this |
|---|---|
| RPC slow / not updating | Click "Refresh" button (manual refetch); if still dead, switch `VITE_RPC_URL` to Alchemy key and reload |
| MetaMask won't connect | Use Basescan "Write Contract" tab with the same wallet — still on-chain, still verifiable |
| Out of test ETH | Second funded wallet / pre-seeded contract already has history to show |
| Everything dies | Play the 60-second recording, walk through Basescan history live (that never dies) |

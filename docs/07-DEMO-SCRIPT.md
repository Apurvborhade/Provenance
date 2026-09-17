# 07 — Demo Script (≈ 4 minutes)

**Driver:** Apurva (wallet + clicks) · **Narrator:** Aditya (slides + talking points)
**Before starting:** wallet unlocked, on Base Sepolia, ≥ 0.05 test ETH, dashboard open at `localhost:5173`, Basescan contract page open in another tab, backend running (optional).

---

### 0. Problem (30 s) — slide 1
> "When you donate to an NGO you get a thank-you email and nothing else. You can't verify a rupee of it was spent as promised. Every platform today asks you to trust the organisation's own report."

### 1. Solution (20 s) — slide 2
> "Provenance puts the donation *and* the spending on-chain. The org can't spend without publicly recording a milestone, and every step is a transaction anyone can check."

### 2. Show the live directory (20 s) — switch to browser
- Home page: platform totals + org cards. Point at **"Reading live from Base Sepolia — contract 0x…"** → click → Basescan shows **verified source**.
> "Any NGO can register here. There's no database behind this page — every number is read from the contract right now."

### 3. Create an org live (30 s) — *skip if short on time; pre-created orgs are fine*
- **+ Create organisation** → name + one-line description → confirm → lands on the new org page.
> "That's a real on-chain registration. The wallet that created it is the only one that can ever request funds."

### 4. Donate live (45 s)
- Org page → **Donate** tab → `0.01` + message `For the kids` → confirm in MetaMask
- **Overview** → Raised + In escrow tick up → History shows the donation *with the message* → click tx link → Basescan
> "My donation, my message, my address, timestamped. I don't need to trust the org's ledger."

### 5. Org requests a milestone (30 s)
- **Manage** tab (wallet is org owner) → `Purchased 50 textbooks` / `0.005` / payee = **a second address (the "bookstore")** → **Add milestone** → **Pending**
> "The org can't just withdraw. It has to say what the money is for *and who gets paid* — and it can't approve itself."

### 6. Admin approves, org releases (45 s)
- Same wallet is also platform admin in the single-wallet demo (both pills show) → **Approve** → **Approved**
- **Release to 0x…** → **Released**, In escrow drops by 0.005 → click release tx → Basescan shows ETH landing in the **bookstore's** wallet, not the org's
> "The money never touched the NGO. It went straight to the vendor the admin approved."

### 6b. The accountability hook (40 s) — *this is the judges' question, pre-empted*
- Try to add another milestone → button disabled, banner: **"Proof required"**
> "Can the chain see textbooks? No. So we do the next best thing: the org is now frozen until it shows a receipt."
- Row shows **Attach proof** → paste a receipt URL (+ optionally pick a file — hashed locally) → confirm
- Row flips to **✓ receipt**, stats show **Proofed 1/1**, request form unlocks
> "The receipt hash is on-chain forever. Anyone can download the file and check it matches. And the org's track record — proofed 1 of 1 — is the first thing a donor sees on its card."

*(With two wallets: switch MetaMask account between steps 5 and 6 to show that the org owner literally cannot approve.)*

### 7. Reload (10 s)
- Hit refresh → identical state.
> "Nothing was stored in the browser. Close it, come back tomorrow, it's the same — because it's the chain."

### 8. Future scope (20 s) — slide 3
- Multi-approver / DAO instead of single platform admin
- Pin receipts to IPFS from the app (hash is already on-chain)
- Third-party auditor attestations (EAS on Base) on top of org-submitted proof
- (Backend already scaffolded: indexer + metadata API for receipts and analytics)

### 9. Close (10 s)
> "Everything you watched is independently verifiable. Nobody has to take our word for it."

---

## Backup plans

| Failure | Do this |
|---|---|
| RPC slow / not updating | Click "Refresh" button (manual refetch); if still dead, switch `VITE_RPC_URL` to Alchemy key and reload |
| MetaMask won't connect | Use Basescan "Write Contract" tab with the same wallet — still on-chain, still verifiable |
| Out of test ETH | Second funded wallet / pre-seeded contract already has history to show |
| Everything dies | Play the 60-second recording, walk through Basescan history live (that never dies) |

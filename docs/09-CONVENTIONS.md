# 09 — Conventions

## Git
- One repo, `main` branch only (hackathon). Commit small and often.
- Message prefix by area: `[contract]`, `[fe]`, `[be]`, `[docs]`.
- Pull before push. Never force-push.
- Never commit `.env`, `*.db`, private keys. `.gitignore` already covers these.

## TypeScript
- `strict: true` everywhere.
- Amounts in **wei as `bigint`** in frontend, **wei as `string`** in backend/DB. Convert only at the display boundary (`formatEth`).
- Addresses typed as `` `0x${string}` `` (viem's `Address`).
- No `any`. Use `unknown` + narrowing.

## React
- Function components, hooks only.
- Presentational components (`components/ui/*`, `MilestoneTable`, `StatsBar`, `TxHistory`) take props and **never import wagmi**.
- Container components (`DonateForm`, `OrgPanel`, `ConnectButton`) own hooks.
- Pages compose containers + presentational components.

## Solidity
- `forge fmt` before commit.
- Custom errors over revert strings.
- Checks → effects → interactions.
- Every state change emits an event.

## Backend
- All routes return `{ data }` or `{ error }`.
- Validate input with zod; never trust `req.body`.
- Prisma client is a singleton in `lib/prisma.ts`.

## Naming
- Files: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- Hooks: `useXxx`.
- Env vars: `SCREAMING_SNAKE`.

## Hand-off protocol
When Apurva wires a hook into one of Aditya's components:
1. Keep the component's props identical; change only the page that supplies them.
2. If a new prop is needed, add it in `types.ts` first, ping the other person, then use it.

import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  /** Base URL clients use to reach this server — embedded in on-chain receipt URIs. */
  PUBLIC_URL: z.string().url().optional(),
  DATABASE_URL: z.string().default('file:./dev.db'),
  RPC_URL: z.string().url().default('https://sepolia.base.org'),
  CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .default('0x0000000000000000000000000000000000000000'),
  CONTRACT_DEPLOY_BLOCK: z.coerce.number().int().nonnegative().default(0),
  INDEXER_POLL_MS: z.coerce.number().int().positive().default(10_000),
  INDEXER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  /** Pinata JWT — when set, receipts are pinned to IPFS and `ipfs://<cid>` goes on-chain. */
  PINATA_JWT: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  IPFS_GATEWAY: z.string().url().default('https://gateway.pinata.cloud/ipfs'),
  IPFS_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  /** If pinning fails, store on local disk instead of failing the upload. */
  IPFS_FALLBACK_LOCAL: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
});

const parsed = schema.parse(process.env);
export const env = { ...parsed, PUBLIC_URL: parsed.PUBLIC_URL ?? `http://localhost:${parsed.PORT}` };
export const CONTRACT_ADDRESS = env.CONTRACT_ADDRESS as `0x${string}`;
export const CONTRACT_CONFIGURED = CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

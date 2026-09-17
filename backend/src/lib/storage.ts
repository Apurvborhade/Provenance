// Receipt storage. Primary: IPFS via Pinata (set PINATA_JWT). Fallback: local disk under backend/uploads/.
// Uses Node 18+ global fetch/FormData/Blob; tsconfig includes the DOM lib so their types resolve on any host.
// Either way the on-chain commitment is keccak256(bytes) — the storage layer only decides where the bytes live.
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { env } from '../env.js';

export type StoredReceipt = {
  /** What goes on-chain. `ipfs://<cid>` when pinned, else an http URL on this server. */
  uri: string;
  /** Browser-openable URL (gateway-resolved for IPFS). */
  url: string;
  storage: 'ipfs' | 'local';
  cid?: string;
};

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const PINATA_PIN_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export const ipfsGatewayUrl = (cid: string) => `${env.IPFS_GATEWAY.replace(/\/$/, '')}/${cid}`;

export const isIpfsEnabled = () => !!env.PINATA_JWT;

async function pinToIpfs(bytes: Buffer, filename: string, mimetype: string, meta: Record<string, string>): Promise<StoredReceipt> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(bytes)], { type: mimetype }), filename);
  form.append('pinataMetadata', JSON.stringify({ name: filename, keyvalues: meta }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const res = await fetch(PINATA_PIN_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
    body: form,
    signal: AbortSignal.timeout(env.IPFS_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Pinata ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { IpfsHash: string };
  if (!json.IpfsHash) throw new Error('Pinata response missing IpfsHash');
  return { uri: `ipfs://${json.IpfsHash}`, url: ipfsGatewayUrl(json.IpfsHash), storage: 'ipfs', cid: json.IpfsHash };
}

async function storeLocally(bytes: Buffer, filename: string): Promise<StoredReceipt> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const dest = path.join(UPLOAD_DIR, filename);
  if (!existsSync(dest)) await fs.writeFile(dest, bytes);
  const url = `${env.PUBLIC_URL}/api/receipts/${filename}`;
  return { uri: url, url, storage: 'local' };
}

/**
 * @param filename content-addressed name, e.g. `<keccak256><ext>` — used as the Pinata name and the local filename.
 */
export async function storeReceipt(
  bytes: Buffer,
  filename: string,
  mimetype: string,
  meta: Record<string, string>,
): Promise<StoredReceipt> {
  if (isIpfsEnabled()) {
    try {
      return await pinToIpfs(bytes, filename, mimetype, meta);
    } catch (err) {
      if (!env.IPFS_FALLBACK_LOCAL) throw err;
      console.warn('[storage] IPFS pin failed, falling back to local disk:', (err as Error).message);
    }
  }
  return storeLocally(bytes, filename);
}

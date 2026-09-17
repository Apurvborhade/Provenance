// Owner: Aditya — typed helpers for the optional backend. Every call returns null on failure.
const BASE = import.meta.env.VITE_API_URL;

async function get<T>(path: string): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export interface ApiStats {
  totalDonated: string;
  totalReleased: string;
  balance: string;
  donorCount: number;
  orgCount?: number;
  milestoneCount: number;
}

export interface ApiTopDonor {
  donor: string;
  total: string;
}

export interface ApiMilestoneMetadata {
  receiptUrl: string | null;
  notes: string | null;
}

export interface ApiReceipt {
  hash: `0x${string}`;
  /** goes on-chain: ipfs://<cid> or a local http URL */
  uri: string;
  /** browser-openable */
  url: string;
  storage: 'ipfs' | 'local';
  cid?: string;
  size: number;
  mimetype: string;
}

export const BACKEND_CONFIGURED = !!BASE;

/** Upload a receipt; the server hashes and stores it. Throws with a readable message on failure. */
export async function uploadReceipt(orgId: number, milestoneId: number, file: File): Promise<ApiReceipt> {
  if (!BASE) throw new Error('Backend not configured (VITE_API_URL) — receipts need somewhere to live.');
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/orgs/${orgId}/milestones/${milestoneId}/receipt`, { method: 'POST', body: form });
  } catch {
    throw new Error('Backend unreachable — is it running?');
  }
  const json = (await res.json().catch(() => ({}))) as { data?: ApiReceipt; error?: string };
  if (!res.ok || !json.data) throw new Error(json.error ?? `Upload failed (${res.status})`);
  return json.data;
}

export const api = {
  health: () => get<{ ok: boolean }>('/api/health'),
  stats: () => get<ApiStats>('/api/stats'),
  orgStats: (orgId: number) => get<ApiStats>(`/api/orgs/${orgId}/stats`),
  topDonors: (orgId: number, limit = 10) => get<ApiTopDonor[]>(`/api/orgs/${orgId}/donors/top?limit=${limit}`),
  milestoneMetadata: (orgId: number, id: number) => get<ApiMilestoneMetadata>(`/api/orgs/${orgId}/milestones/${id}/metadata`),
};

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

export const api = {
  health: () => get<{ ok: boolean }>('/api/health'),
  stats: () => get<ApiStats>('/api/stats'),
  topDonors: (limit = 10) => get<ApiTopDonor[]>(`/api/donors/top?limit=${limit}`),
  milestoneMetadata: (id: number) => get<ApiMilestoneMetadata>(`/api/milestones/${id}/metadata`),
};

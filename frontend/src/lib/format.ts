// Owner: Aditya
import { formatEther } from 'viem';

export const EXPLORER = 'https://sepolia.basescan.org';

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addrUrl = (addr: string) => `${EXPLORER}/address/${addr}`;

/** 1234500000000000000n → "1.2345" */
export function formatEth(wei: bigint, decimals = 4): string {
  const s = formatEther(wei);
  const [int, frac = ''] = s.split('.');
  if (decimals === 0) return int;
  const trimmed = frac.slice(0, decimals).replace(/0+$/, '');
  return trimmed ? `${int}.${trimmed}` : int;
}

/** 0x1234…abcd */
export function shortAddr(addr: string, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

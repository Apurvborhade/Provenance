// Owner: Aditya — pure props, no wagmi.
import { formatEth } from '../lib/format';

export interface StatTile {
  label: string;
  value: string;
  unit?: string;
}

export function StatsBar({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="stats">
      {tiles.map((t) => (
        <div className="stat" key={t.label}>
          <div className="label">{t.label}</div>
          <div className="value">
            {t.value}
            {t.unit && <span className="unit">{t.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export const ethTile = (label: string, wei: bigint): StatTile => ({ label, value: formatEth(wei), unit: 'ETH' });
export const numTile = (label: string, n: number): StatTile => ({ label, value: String(n) });

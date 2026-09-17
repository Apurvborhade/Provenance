// Owner: Aditya — pure props, no wagmi.
import { formatEth } from '../lib/format';
import type { Stats } from '../lib/types';

export function StatsBar({ stats }: { stats: Stats }) {
  const tiles = [
    { label: 'Total donated', value: formatEth(stats.totalDonated), unit: 'ETH' },
    { label: 'Current balance', value: formatEth(stats.balance), unit: 'ETH' },
    { label: 'Total released', value: formatEth(stats.totalReleased), unit: 'ETH' },
    { label: 'Milestones', value: String(stats.milestoneCount), unit: '' },
  ];
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

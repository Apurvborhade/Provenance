// Owner: Aditya — pure props.
import { formatEth, shortAddr, timeAgo } from '../lib/format';
import { href } from '../lib/router';
import type { Org } from '../lib/types';

export function OrgCard({ org }: { org: Org }) {
  const raised = org.totalDonated;
  const pct = (n: bigint) => (raised === 0n ? 0 : Number((n * 1000n) / raised) / 10);
  const proofed = org.releasedCount === 0 ? '—' : `${org.proofCount}/${org.releasedCount}`;
  const lagging = org.releasedCount > 0 && org.proofCount < org.releasedCount;

  return (
    <a className="org-card" href={href.org(org.id)}>
      <div className="org-card-head">
        <h3>{org.name}</h3>
        <span className="org-id">#{org.id}</span>
      </div>
      <p className="org-desc">{org.description || 'No description yet.'}</p>
      <div>
        <div className="progress" title={`Raised ${formatEth(raised)} ETH`}>
          <span className="released" style={{ width: `${pct(org.totalReleased)}%` }} />
          <span className="escrow" style={{ width: `${pct(org.balance)}%` }} />
        </div>
        <div className="progress-legend">
          <span>{formatEth(org.totalReleased)} paid out</span>
          <span>{formatEth(raised)} ETH raised</span>
        </div>
      </div>
      <div className="org-meta">
        <div><span className="label">In escrow</span><strong>{formatEth(org.balance)}</strong></div>
        <div><span className="label">Donors</span><strong>{org.donorCount}</strong></div>
        <div><span className="label">Receipts</span><strong className={lagging ? 'warn-text' : ''}>{proofed}</strong></div>
      </div>
      <div className="org-foot">by <span className="mono">{shortAddr(org.owner)}</span> · {timeAgo(org.createdAt)}</div>
    </a>
  );
}

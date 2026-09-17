// Owner: Aditya — pure props.
import { formatEth, shortAddr, timeAgo } from '../lib/format';
import { href } from '../lib/router';
import type { Org } from '../lib/types';

export function OrgCard({ org }: { org: Org }) {
  return (
    <a className="org-card" href={href.org(org.id)}>
      <div className="org-card-head">
        <h3>{org.name}</h3>
        <span className="pill mono">#{org.id}</span>
      </div>
      <p className="org-desc">{org.description || <span className="muted">No description</span>}</p>
      <div className="org-meta">
        <div><span className="label">Raised</span><strong>{formatEth(org.totalDonated)} ETH</strong></div>
        <div><span className="label">In escrow</span><strong>{formatEth(org.balance)} ETH</strong></div>
        <div><span className="label">Donors</span><strong>{org.donorCount}</strong></div>
        <div>
          <span className="label">Proofed</span>
          <strong className={org.releasedCount > 0 && org.proofCount < org.releasedCount ? 'warn-text' : ''}>
            {org.releasedCount === 0 ? '—' : `${org.proofCount}/${org.releasedCount}`}
          </strong>
        </div>
      </div>
      <div className="org-foot muted">
        by <span className="mono">{shortAddr(org.owner)}</span> · {timeAgo(org.createdAt)}
      </div>
    </a>
  );
}

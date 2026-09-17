// Owner: Aditya — pure props. `renderActions` lets ManagePanel inject Approve/Release buttons.
import type { ReactNode } from 'react';
import { Badge } from './ui';
import { formatEth, formatDate, shortAddr, addrUrl } from '../lib/format';
import type { Milestone } from '../lib/types';

interface Props {
  milestones: Milestone[];
  renderActions?: (m: Milestone) => ReactNode;
}

export function MilestoneTable({ milestones, renderActions }: Props) {
  if (milestones.length === 0) return <div className="empty">No milestones yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Payee</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Released</th>
            <th>Proof</th>
            {renderActions && <th />}
          </tr>
        </thead>
        <tbody>
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="mono">{m.id}</td>
              <td>{m.description}</td>
              <td><a href={addrUrl(m.payee)} target="_blank" rel="noreferrer" className="mono">{shortAddr(m.payee)}</a></td>
              <td className="mono">{formatEth(m.amount)} ETH</td>
              <td><Badge status={m.status} /></td>
              <td className="muted">{formatDate(m.createdAt)}</td>
              <td className="muted">{m.releasedAt ? formatDate(m.releasedAt) : '—'}</td>
              <td>
                {m.proof ? (
                  <a href={m.proof.uri} target="_blank" rel="noreferrer" title={m.proof.hash} className="proof ok">✓ receipt ↗</a>
                ) : m.status === 'released' ? (
                  <span className="proof missing">awaiting proof</span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              {renderActions && <td>{renderActions(m)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

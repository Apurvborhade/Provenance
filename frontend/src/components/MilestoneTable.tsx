// Owner: Aditya — pure props. `renderActions` lets OrgPanel inject Approve/Release buttons.
import type { ReactNode } from 'react';
import { Badge } from './ui';
import { formatEth, formatDate } from '../lib/format';
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
            <th>Amount</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Released</th>
            {renderActions && <th />}
          </tr>
        </thead>
        <tbody>
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="mono">{m.id}</td>
              <td>{m.description}</td>
              <td className="mono">{formatEth(m.amount)} ETH</td>
              <td><Badge status={m.status} /></td>
              <td className="muted">{formatDate(m.createdAt)}</td>
              <td className="muted">{m.releasedAt ? formatDate(m.releasedAt) : '—'}</td>
              {renderActions && <td>{renderActions(m)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

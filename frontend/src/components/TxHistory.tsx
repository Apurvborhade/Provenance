// Owner: Aditya — pure props.
import { formatEth, shortAddr, txUrl, addrUrl, timeAgo } from '../lib/format';
import type { HistoryItem } from '../lib/types';

const LABEL: Record<HistoryItem['kind'], string> = {
  donated: 'Donation',
  requested: 'Milestone requested',
  approved: 'Milestone approved',
  released: 'Funds released',
};

function describe(h: HistoryItem) {
  switch (h.kind) {
    case 'donated':
      return (
        <>
          <a href={addrUrl(h.actor!)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.actor!)}</a>
          {' donated '}<strong>{formatEth(h.amount!)} ETH</strong>
        </>
      );
    case 'requested':
      return <>#{h.milestoneId} “{h.description}” — {formatEth(h.amount!)} ETH</>;
    case 'approved':
      return <>Milestone #{h.milestoneId}</>;
    case 'released':
      return <>Milestone #{h.milestoneId} — <strong>{formatEth(h.amount!)} ETH</strong> to org</>;
  }
}

export function TxHistory({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) return <div className="empty">No on-chain activity yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Event</th><th>Details</th><th>When</th><th>Tx</th></tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={`${h.txHash}-${h.kind}-${h.milestoneId ?? ''}`}>
              <td>{LABEL[h.kind]}</td>
              <td>{describe(h)}</td>
              <td className="muted">{h.timestamp ? timeAgo(h.timestamp) : `block ${h.blockNumber.toString()}`}</td>
              <td><a href={txUrl(h.txHash)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.txHash, 6)} ↗</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

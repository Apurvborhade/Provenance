// Owner: Aditya — pure props.
import { formatEth, shortAddr, txUrl, addrUrl, timeAgo, resolveUri, isIpfsUri } from '../lib/format';
import { href } from '../lib/router';
import type { HistoryItem } from '../lib/types';

const LABEL: Record<HistoryItem['kind'], string> = {
  orgCreated: 'Org created',
  donated: 'Donation',
  requested: 'Milestone requested',
  approved: 'Milestone approved',
  released: 'Funds released',
  proofAttached: 'Proof attached',
};

function describe(h: HistoryItem) {
  switch (h.kind) {
    case 'orgCreated':
      return <><strong>{h.name}</strong> by <a href={addrUrl(h.actor!)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.actor!)}</a></>;
    case 'donated':
      return (
        <>
          <a href={addrUrl(h.actor!)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.actor!)}</a>
          {' gave '}<strong>{formatEth(h.amount!)} ETH</strong>
          {h.message && <span className="muted"> — “{h.message}”</span>}
        </>
      );
    case 'requested':
      return <>#{h.milestoneId} “{h.description}” — {formatEth(h.amount!)} ETH to <a href={addrUrl(h.payee!)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.payee!)}</a></>;
    case 'approved':
      return <>Milestone #{h.milestoneId} approved by admin</>;
    case 'released':
      return <>Milestone #{h.milestoneId} — <strong>{formatEth(h.amount!)} ETH</strong> paid to <a href={addrUrl(h.payee!)} target="_blank" rel="noreferrer" className="mono">{shortAddr(h.payee!)}</a></>;
    case 'proofAttached':
      return <>Milestone #{h.milestoneId} — <a href={resolveUri(h.proofUri!)} target="_blank" rel="noreferrer">{isIpfsUri(h.proofUri!) ? 'IPFS receipt' : 'receipt'} ↗</a> hashed on-chain</>;
  }
}

export function TxHistory({ items, showOrg = false }: { items: HistoryItem[]; showOrg?: boolean }) {
  if (items.length === 0) return <div className="empty">No on-chain activity yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{showOrg && <th>Org</th>}<th>Event</th><th>Details</th><th>When</th><th>Tx</th></tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={`${h.txHash}-${h.kind}-${h.orgId}-${h.milestoneId ?? ''}`}>
              {showOrg && <td><a href={href.org(h.orgId)} className="mono">#{h.orgId}</a></td>}
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

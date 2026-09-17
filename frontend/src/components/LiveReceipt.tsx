// The hero's thesis object: a receipt printed from real chain events. Pure props.
import { formatEth, shortAddr, timeAgo } from '../lib/format';
import { DONATION_PLATFORM_ADDRESS } from '../config/contract';
import type { HistoryItem } from '../lib/types';

function line(h: HistoryItem): { k: string; v: string; dir?: 'in' | 'out'; sub?: string } {
  switch (h.kind) {
    case 'orgCreated':
      return { k: `ORG #${h.orgId} REGISTERED`, v: '', sub: h.name };
    case 'donated':
      return { k: `DONATION → ORG #${h.orgId}`, v: `+${formatEth(h.amount!)}`, dir: 'in', sub: h.message ? `“${h.message}” — ${shortAddr(h.actor!)}` : shortAddr(h.actor!) };
    case 'requested':
      return { k: `REQUEST #${h.milestoneId} · ORG #${h.orgId}`, v: `${formatEth(h.amount!)} ETH`, sub: h.description };
    case 'approved':
      return { k: `APPROVED #${h.milestoneId} · ORG #${h.orgId}`, v: '', sub: 'by platform admin' };
    case 'released':
      return { k: `RELEASED #${h.milestoneId} · ORG #${h.orgId}`, v: `−${formatEth(h.amount!)}`, dir: 'out', sub: `paid to ${shortAddr(h.payee!)}` };
    case 'proofAttached':
      return { k: `RECEIPT #${h.milestoneId} · ORG #${h.orgId}`, v: 'IPFS', sub: 'hash committed on-chain' };
  }
}

export function LiveReceipt({ items, loading }: { items: HistoryItem[]; loading: boolean }) {
  const rows = items.slice(0, 7);
  return (
    <div className="receipt" aria-label="Latest on-chain activity">
      <div className="receipt-head">
        <strong>PROVENANCE</strong>
        <span>BASE SEPOLIA · LIVE</span>
      </div>
      <div className="receipt-rows">
        {loading && rows.length === 0 && <div className="receipt-empty">reading chain…</div>}
        {!loading && rows.length === 0 && <div className="receipt-empty">no activity yet — be the first donor</div>}
        {rows.map((h, i) => {
          const l = line(h);
          return (
            <div className="receipt-row" key={`${h.txHash}-${h.kind}-${h.milestoneId ?? ''}`} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="k">{l.k}</span>
              <span className={`v ${l.dir ?? ''}`}>{l.v}{l.dir ? ' ETH' : ''}</span>
              {l.sub && <span className="sub">{l.sub}{h.timestamp ? ` · ${timeAgo(h.timestamp)}` : ''}</span>}
            </div>
          );
        })}
      </div>
      <div className="receipt-foot">
        <span>{shortAddr(DONATION_PLATFORM_ADDRESS, 6)}</span>
        <span>nothing self-reported</span>
      </div>
    </div>
  );
}

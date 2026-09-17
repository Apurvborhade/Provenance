// Owner: Aditya (layout). Per-org view with Overview / Donate / Manage tabs.
import { useState } from 'react';
import { StatsBar, ethTile, numTile } from '../components/StatsBar';
import { MilestoneTable } from '../components/MilestoneTable';
import { TxHistory } from '../components/TxHistory';
import { DonateForm } from '../components/DonateForm';
import { ManagePanel } from '../components/ManagePanel';
import { Card, Banner, Spinner } from '../components/ui';
import { useOrg } from '../hooks/useOrg';
import { useTxHistory } from '../hooks/useTxHistory';
import { addrUrl, shortAddr, formatDate } from '../lib/format';
import { href } from '../lib/router';

type Tab = 'overview' | 'donate' | 'manage';

export function OrgPage({ orgId }: { orgId: number }) {
  const [tab, setTab] = useState<Tab>('overview');
  const { org, milestones, unproofed, isOrgOwner, isAdmin, admin, isLoading, notFound, error } = useOrg(orgId);
  const history = useTxHistory(orgId);

  if (notFound) return <Banner kind="error">Organisation #{orgId} does not exist. <a href={href.orgs()}>Back to all orgs</a></Banner>;
  if (isLoading || !org) return <div className="empty"><Spinner /> Loading organisation…</div>;

  const canManage = isOrgOwner || isAdmin;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Ledger' },
    { id: 'donate', label: 'Donate' },
    { id: 'manage', label: canManage ? 'Manage' : 'Manage 🔒' },
  ];

  return (
    <>
      <a className="back" href={href.orgs()}>← Organisations</a>
      <div className="org-header">
        <h1>{org.name} <span className="org-id">#{org.id}</span></h1>
        {org.description && <p className="desc">{org.description}</p>}
        <p className="meta">
          Owner <a href={addrUrl(org.owner)} target="_blank" rel="noreferrer" className="mono">{shortAddr(org.owner)}</a> · registered {formatDate(org.createdAt)}
        </p>
      </div>

      {error && <Banner kind="error">{error.message.split('\n')[0]}</Banner>}
      {unproofed.length > 0 && !isOrgOwner && (
        <Banner kind="warn">This org has {unproofed.length} released milestone{unproofed.length > 1 ? 's' : ''} without proof-of-spend yet. It cannot request more funds until proof is attached.</Banner>
      )}

      <StatsBar tiles={[ethTile('Raised', org.totalDonated), ethTile('In escrow', org.balance), ethTile('Paid to vendors', org.totalReleased), numTile('Donors', org.donorCount), { label: 'Receipts', value: org.releasedCount === 0 ? '—' : `${org.proofCount}/${org.releasedCount}` }]} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <Card title="Spend requests" subtitle="Every milestone this org has asked for, with status, payee and receipt.">
            <MilestoneTable milestones={milestones} />
          </Card>
          <Card title="On-chain history" subtitle="Reconstructed from contract events. Click any tx to verify on Basescan.">
            {history.isLoading ? <div className="empty"><Spinner /> Fetching logs…</div> : <TxHistory items={history.data ?? []} />}
          </Card>
        </>
      )}
      {tab === 'donate' && <DonateForm org={org} />}
      {tab === 'manage' && <ManagePanel org={org} milestones={milestones} unproofed={unproofed} isOrgOwner={isOrgOwner} isAdmin={isAdmin} admin={admin} />}
    </>
  );
}

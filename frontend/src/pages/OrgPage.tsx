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
  const { org, milestones, isOrgOwner, isAdmin, admin, isLoading, notFound, error } = useOrg(orgId);
  const history = useTxHistory(orgId);

  if (notFound) return <Banner kind="error">Organisation #{orgId} does not exist. <a href={href.home()}>Back to all orgs</a></Banner>;
  if (isLoading || !org) return <div className="empty"><Spinner /> Loading organisation…</div>;

  const canManage = isOrgOwner || isAdmin;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'donate', label: 'Donate' },
    { id: 'manage', label: canManage ? 'Manage' : 'Manage 🔒' },
  ];

  return (
    <>
      <p><a href={href.home()}>← All organisations</a></p>
      <div className="org-header">
        <div>
          <h1>{org.name} <span className="pill mono">#{org.id}</span></h1>
          <p className="muted">{org.description}</p>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Owner <a href={addrUrl(org.owner)} target="_blank" rel="noreferrer" className="mono">{shortAddr(org.owner)}</a> · created {formatDate(org.createdAt)}
          </p>
        </div>
      </div>

      {error && <Banner kind="error">{error.message.split('\n')[0]}</Banner>}

      <StatsBar tiles={[ethTile('Raised', org.totalDonated), ethTile('In escrow', org.balance), ethTile('Released', org.totalReleased), numTile('Donors', org.donorCount), numTile('Milestones', milestones.length)]} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <Card title="Milestones" subtitle="Every spend request and its current status.">
            <MilestoneTable milestones={milestones} />
          </Card>
          <Card title="On-chain history" subtitle="Click any tx to verify on Basescan.">
            {history.isLoading ? <div className="empty"><Spinner /> Fetching logs…</div> : <TxHistory items={history.data ?? []} />}
          </Card>
        </>
      )}
      {tab === 'donate' && <DonateForm org={org} />}
      {tab === 'manage' && <ManagePanel org={org} milestones={milestones} isOrgOwner={isOrgOwner} isAdmin={isAdmin} admin={admin} />}
    </>
  );
}

// Owner: Apurva (wiring). Role-aware: org owner requests/releases, platform admin approves.
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button, Card, Input, TxStatus, Banner } from './ui';
import { MilestoneTable } from './MilestoneTable';
import { useMilestoneActions } from '../hooks/useMilestoneActions';
import { shortAddr, addrUrl } from '../lib/format';
import type { Milestone, Org } from '../lib/types';

interface Props {
  org: Org;
  milestones: Milestone[];
  isOrgOwner: boolean;
  isAdmin: boolean;
  admin?: `0x${string}`;
}

export function ManagePanel({ org, milestones, isOrgOwner, isAdmin, admin }: Props) {
  const { isConnected } = useAccount();
  const { addMilestone, approveMilestone, releaseMilestone, tx, activeFn, activeId } = useMilestoneActions(org.id);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('0.005');

  const busy = tx.isPending || tx.isConfirming;

  if (!isConnected) return <Banner kind="warn">Connect a wallet to manage this organisation.</Banner>;
  if (!isOrgOwner && !isAdmin)
    return (
      <Banner kind="warn">
        Only the org owner (<a href={addrUrl(org.owner)} target="_blank" rel="noreferrer" className="mono">{shortAddr(org.owner)}</a>)
        can request and release funds; only the platform admin
        {admin && <> (<a href={addrUrl(admin)} target="_blank" rel="noreferrer" className="mono">{shortAddr(admin)}</a>)</>} can approve.
      </Banner>
    );

  const actions = (m: Milestone) => {
    const rowBusy = busy && activeId === m.id;
    if (m.status === 'pending' && isAdmin)
      return <Button size="sm" loading={rowBusy} disabled={busy} onClick={() => approveMilestone(m.id)}>Approve</Button>;
    if (m.status === 'pending' && !isAdmin) return <span className="muted">Awaiting admin</span>;
    if (m.status === 'approved' && isOrgOwner) {
      const insufficient = org.balance < m.amount;
      return (
        <Button size="sm" variant="secondary" loading={rowBusy} disabled={busy || insufficient} title={insufficient ? 'Insufficient org balance' : undefined} onClick={() => releaseMilestone(m.id)}>
          Release
        </Button>
      );
    }
    if (m.status === 'approved') return <span className="muted">Awaiting org release</span>;
    return null;
  };

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        {isOrgOwner && <span className="pill"><span className="dot" />You own this org</span>}
        {isAdmin && <span className="pill"><span className="dot" />You are the platform admin</span>}
      </div>

      {isOrgOwner && (
        <Card title="Request a release" subtitle="Record what the funds are for. Public and permanent; the platform admin must approve before you can release.">
          <Input label="Description" placeholder="Purchased 50 textbooks" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={busy} />
          <Input label="Amount (ETH)" type="number" min="0" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
          <Button loading={busy && activeFn === 'addMilestone'} disabled={busy || !desc.trim() || Number(amount) <= 0} onClick={() => addMilestone(desc.trim(), amount)}>
            Add milestone
          </Button>
        </Card>
      )}

      <Card title="Milestones" subtitle={isAdmin ? 'Approve pending requests. Approval is recorded on-chain under your address.' : 'Release approved milestones. ETH goes from escrow to your wallet.'}>
        <MilestoneTable milestones={milestones} renderActions={actions} />
        <div style={{ marginTop: 12 }}><TxStatus tx={tx} /></div>
      </Card>
    </>
  );
}

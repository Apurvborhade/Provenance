// Owner: Apurva (wiring) — uses Aditya's MilestoneTable + ui kit.
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button, Card, Input, TxStatus, Banner } from './ui';
import { MilestoneTable } from './MilestoneTable';
import { useDonationTracker } from '../hooks/useDonationTracker';
import { useMilestoneActions } from '../hooks/useMilestoneActions';
import { shortAddr, addrUrl } from '../lib/format';
import type { Milestone } from '../lib/types';

export function OrgPanel() {
  const { isConnected } = useAccount();
  const { owner, isOwner, milestones, stats } = useDonationTracker();
  const { addMilestone, approveMilestone, releaseMilestone, tx, activeFn, activeId } = useMilestoneActions();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('0.005');

  const busy = tx.isPending || tx.isConfirming;

  if (!isConnected) return <Banner kind="warn">Connect the organisation wallet to manage milestones.</Banner>;
  if (!isOwner)
    return (
      <Banner kind="warn">
        Only the organisation wallet can manage milestones. Owner:{' '}
        {owner && <a href={addrUrl(owner)} target="_blank" rel="noreferrer" className="mono">{shortAddr(owner)}</a>}
      </Banner>
    );

  const actions = (m: Milestone) => {
    const rowBusy = busy && activeId === m.id;
    if (m.status === 'pending')
      return <Button size="sm" loading={rowBusy} disabled={busy} onClick={() => approveMilestone(m.id)}>Approve</Button>;
    if (m.status === 'approved') {
      const insufficient = stats.balance < m.amount;
      return (
        <Button size="sm" variant="secondary" loading={rowBusy} disabled={busy || insufficient} title={insufficient ? 'Insufficient balance' : undefined} onClick={() => releaseMilestone(m.id)}>
          Release
        </Button>
      );
    }
    return null;
  };

  return (
    <>
      <Card title="Request a release" subtitle="Record what the funds are for. This is public and permanent.">
        <Input label="Description" placeholder="Purchased 50 textbooks" value={desc} onChange={(e) => setDesc(e.target.value)} disabled={busy} />
        <Input label="Amount (ETH)" type="number" min="0" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
        <Button loading={busy && activeFn === 'addMilestone'} disabled={busy || !desc.trim() || Number(amount) <= 0} onClick={() => addMilestone(desc.trim(), amount)}>
          Add milestone
        </Button>
        <div style={{ marginTop: 12 }}><TxStatus tx={tx} /></div>
      </Card>
      <Card title="Milestones" subtitle="Approve, then release. Release sends ETH from the contract to the org wallet.">
        <MilestoneTable milestones={milestones} renderActions={actions} />
      </Card>
    </>
  );
}

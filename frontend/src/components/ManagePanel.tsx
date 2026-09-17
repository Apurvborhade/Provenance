// Owner: Apurva (wiring). Role-aware: org owner requests/releases/attaches proof, platform admin approves.
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Button, Card, Input, TxStatus, Banner } from './ui';
import { MilestoneTable } from './MilestoneTable';
import { AttachProofForm } from './AttachProofForm';
import { useMilestoneActions } from '../hooks/useMilestoneActions';
import { shortAddr, addrUrl } from '../lib/format';
import type { Milestone, Org } from '../lib/types';

interface Props {
  org: Org;
  milestones: Milestone[];
  unproofed: Milestone[];
  isOrgOwner: boolean;
  isAdmin: boolean;
  admin?: `0x${string}`;
}

export function ManagePanel({ org, milestones, unproofed, isOrgOwner, isAdmin, admin }: Props) {
  const { isConnected } = useAccount();
  const { addMilestone, approveMilestone, releaseMilestone, attachProof, tx, activeFn, activeId } = useMilestoneActions(org.id);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('0.005');
  const [payee, setPayee] = useState<string>(org.owner);
  const [proofFor, setProofFor] = useState<number | null>(null);

  const busy = tx.isPending || tx.isConfirming;
  const blocked = unproofed.length > 0;
  const payeeValid = isAddress(payee);

  if (!isConnected) return <Banner kind="warn">Connect a wallet to manage this organisation.</Banner>;
  if (!isOrgOwner && !isAdmin)
    return (
      <Banner kind="warn">
        Only the org owner (<a href={addrUrl(org.owner)} target="_blank" rel="noreferrer" className="mono">{shortAddr(org.owner)}</a>)
        can request, release and attach proof; only the platform admin
        {admin && <> (<a href={addrUrl(admin)} target="_blank" rel="noreferrer" className="mono">{shortAddr(admin)}</a>)</>} can approve.
      </Banner>
    );

  const actions = (m: Milestone) => {
    const rowBusy = busy && activeId === m.id;
    if (m.status === 'pending' && isAdmin)
      return <Button size="sm" loading={rowBusy} disabled={busy} onClick={() => approveMilestone(m.id)}>Approve</Button>;
    if (m.status === 'pending') return <span className="muted">Awaiting admin</span>;
    if (m.status === 'approved' && isOrgOwner) {
      const insufficient = org.balance < m.amount;
      return (
        <Button size="sm" variant="secondary" loading={rowBusy} disabled={busy || insufficient} title={insufficient ? 'Insufficient org balance' : undefined} onClick={() => releaseMilestone(m.id)}>
          Release to {shortAddr(m.payee)}
        </Button>
      );
    }
    if (m.status === 'approved') return <span className="muted">Awaiting org release</span>;
    if (m.status === 'released' && !m.proof && isOrgOwner)
      return <Button size="sm" loading={rowBusy && activeFn === 'attachProof'} disabled={busy} onClick={() => setProofFor(m.id)}>Attach proof</Button>;
    return null;
  };

  const proofTarget = proofFor !== null ? milestones.find((m) => m.id === proofFor) : undefined;

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        {isOrgOwner && <span className="pill"><span className="dot" />You own this org</span>}
        {isAdmin && <span className="pill"><span className="dot" />You are the platform admin</span>}
      </div>

      {isOrgOwner && blocked && (
        <Banner kind="warn">
          <strong>Proof required.</strong> Milestone{unproofed.length > 1 ? 's' : ''} #{unproofed.map((m) => m.id).join(', #')} {unproofed.length > 1 ? 'were' : 'was'} released without proof-of-spend.
          The contract will reject new requests until you attach a receipt below.
        </Banner>
      )}

      {isOrgOwner && (
        <Card title="Request a release" subtitle="Say what the money is for and who gets paid. Funds go directly to the payee — never through your wallet. The admin must approve first.">
          <Input label="Description" placeholder="Purchased 50 textbooks" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={busy || blocked} />
          <Input label="Amount (ETH)" type="number" min="0" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy || blocked} />
          <Input label="Payee address (vendor / contractor)" className="mono" placeholder="0x…" value={payee} onChange={(e) => setPayee(e.target.value)} disabled={busy || blocked} />
          {!payeeValid && payee && <p className="muted" style={{ marginTop: -6, fontSize: '0.8rem' }}>Not a valid address.</p>}
          {payee.toLowerCase() === org.owner.toLowerCase() && <p className="muted" style={{ marginTop: -6, fontSize: '0.8rem' }}>Payee is your own wallet — name the vendor directly for a stronger audit trail.</p>}
          <Button loading={busy && activeFn === 'addMilestone'} disabled={busy || blocked || !desc.trim() || Number(amount) <= 0 || !payeeValid} onClick={() => addMilestone(desc.trim(), amount, payee as `0x${string}`)}>
            Add milestone
          </Button>
        </Card>
      )}

      {proofTarget && (
        <Card title="Attach proof-of-spend">
          <AttachProofForm
            milestone={proofTarget}
            busy={busy}
            onSubmit={(id, hash, uri) => { attachProof(id, hash, uri); setProofFor(null); }}
            onCancel={() => setProofFor(null)}
          />
        </Card>
      )}

      <Card title="Milestones" subtitle={isAdmin ? 'Approve pending requests — you are approving the purpose, the amount and the payee.' : 'Release approved milestones to their payee, then attach a receipt.'}>
        <MilestoneTable milestones={milestones} renderActions={actions} />
        <div style={{ marginTop: 12 }}><TxStatus tx={tx} /></div>
      </Card>
    </>
  );
}

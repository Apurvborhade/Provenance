// Owner: Apurva (wiring) — uses Aditya's ui kit.
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button, Card, Input, TxStatus, Banner } from './ui';
import { useCreateOrg } from '../hooks/useCreateOrg';
import { useNetworkGuard } from '../hooks/useNetworkGuard';
import { href, navigate } from '../lib/router';

export function CreateOrgForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { isConnected } = useAccount();
  const { isWrongNetwork } = useNetworkGuard();
  const { createOrg, createdOrgId, tx } = useCreateOrg();

  const busy = tx.isPending || tx.isConfirming;

  useEffect(() => {
    if (createdOrgId !== undefined) navigate(href.org(createdOrgId));
  }, [createdOrgId]);

  return (
    <Card title="Create an organisation" subtitle="Your connected wallet becomes the org owner — it's the only wallet that can request and release funds.">
      {!isConnected && <Banner kind="warn">Connect a wallet to create an organisation.</Banner>}
      {isWrongNetwork && <Banner kind="warn">Switch to Base Sepolia first.</Banner>}
      <Input label="Name" placeholder="Sunrise Primary School" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
      <div className="field">
        <label htmlFor="org-desc">Description</label>
        <textarea id="org-desc" className="input" rows={3} maxLength={500} placeholder="What will donations fund?" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
      </div>
      <Button onClick={() => createOrg(name.trim(), description.trim())} loading={busy} disabled={!isConnected || isWrongNetwork || !name.trim()}>
        {tx.isPending ? 'Confirm in wallet…' : tx.isConfirming ? 'Creating…' : 'Create organisation'}
      </Button>
      <div style={{ marginTop: 12 }}><TxStatus tx={tx} /></div>
    </Card>
  );
}

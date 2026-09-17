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
    <Card title="Register an organisation" subtitle="Your connected wallet becomes the owner — the only wallet that can request, release and attach receipts for this org.">
      {!isConnected && <Banner kind="warn">Connect a wallet to create an organisation.</Banner>}
      {isWrongNetwork && <Banner kind="warn">Switch to Base Sepolia first.</Banner>}
      <div className="form">
        <Input label="Name" placeholder="Sunrise Primary School" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        <div className="field">
          <label htmlFor="org-desc">Description</label>
          <textarea id="org-desc" className="input" rows={3} maxLength={500} placeholder="What will donations fund? Who benefits?" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
          <span className="hint">Shown on your org card. Can be edited later by the owner wallet.</span>
        </div>
        <div>
          <Button size="lg" onClick={() => createOrg(name.trim(), description.trim())} loading={busy} disabled={!isConnected || isWrongNetwork || !name.trim()}>
            {tx.isPending ? 'Confirm in wallet…' : tx.isConfirming ? 'Registering…' : 'Register organisation'}
          </Button>
        </div>
      </div>
      <div className="tx-status"><TxStatus tx={tx} /></div>
    </Card>
  );
}

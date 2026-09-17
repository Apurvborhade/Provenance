// Owner: Apurva (wiring) — uses Aditya's ui kit.
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button, Card, Input, TxStatus, Banner } from './ui';
import { useDonate } from '../hooks/useDonate';
import { useNetworkGuard } from '../hooks/useNetworkGuard';
import type { Org } from '../lib/types';

export function DonateForm({ org }: { org: Org }) {
  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('');
  const { isConnected } = useAccount();
  const { isWrongNetwork } = useNetworkGuard();
  const { donate, tx } = useDonate(org.id);

  const busy = tx.isPending || tx.isConfirming;
  const valid = Number(amount) > 0;

  return (
    <Card title={`Donate to ${org.name}`} subtitle="Goes into escrow for this org. Recorded on-chain against your address.">
      {!isConnected && <Banner kind="warn">Connect a wallet to donate.</Banner>}
      {isWrongNetwork && <Banner kind="warn">Switch to Base Sepolia to donate.</Banner>}
      <div className="form">
        <Input label="Amount (ETH)" className="mono" type="number" min="0" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
        <Input label="Message (optional)" placeholder="For the kids" maxLength={140} hint="Written on-chain with your donation. Public, permanent." value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
        <div>
          <Button size="lg" onClick={() => donate(amount, message.trim())} loading={busy} disabled={!isConnected || isWrongNetwork || !valid}>
            {tx.isPending ? 'Confirm in wallet…' : tx.isConfirming ? 'Confirming…' : `Donate ${amount || '0'} ETH`}
          </Button>
        </div>
      </div>
      <div className="tx-status"><TxStatus tx={tx} /></div>
    </Card>
  );
}

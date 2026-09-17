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
    <Card title={`Donate to ${org.name}`} subtitle="Recorded on-chain against your address. Your message is public and permanent.">
      {!isConnected && <Banner kind="warn">Connect a wallet to donate.</Banner>}
      {isWrongNetwork && <Banner kind="warn">Switch to Base Sepolia to donate.</Banner>}
      <Input label="Amount (ETH)" type="number" min="0" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
      <Input label="Message (optional)" placeholder="For the kids 💙" maxLength={140} value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
      <Button onClick={() => donate(amount, message.trim())} loading={busy} disabled={!isConnected || isWrongNetwork || !valid}>
        {tx.isPending ? 'Confirm in wallet…' : tx.isConfirming ? 'Confirming…' : `Donate ${amount || '0'} ETH`}
      </Button>
      <div style={{ marginTop: 12 }}><TxStatus tx={tx} /></div>
    </Card>
  );
}

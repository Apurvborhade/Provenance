// Renders the 3-state tx lifecycle. Pure props — no wagmi.
import type { TxState } from '../../lib/types';
import { txUrl } from '../../lib/format';
import { Banner } from './Banner';

export function TxStatus({ tx }: { tx: TxState }) {
  if (tx.error) {
    const msg = tx.error.message.split('\n')[0];
    return <Banner kind="error">Transaction failed: {msg}</Banner>;
  }
  if (tx.isPending) return <Banner kind="info">Confirm in your wallet…</Banner>;
  if (tx.isConfirming) return <Banner kind="info">Confirming on Base Sepolia…</Banner>;
  if (tx.isSuccess && tx.hash)
    return (
      <Banner kind="success">
        Done ✓ —{' '}
        <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer">
          view on Basescan
        </a>
      </Banner>
    );
  return null;
}

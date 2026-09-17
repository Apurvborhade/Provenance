// Owner: Apurva
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './ui';
import { shortAddr } from '../lib/format';
import { useNetworkGuard } from '../hooks/useNetworkGuard';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isWrongNetwork, switchToTarget, isSwitching, targetName } = useNetworkGuard();

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <Button loading={isPending} onClick={() => injected && connect({ connector: injected })} disabled={!injected}>
        Connect wallet
      </Button>
    );
  }

  return (
    <div className="row">
      {isWrongNetwork ? (
        <Button variant="danger" size="sm" loading={isSwitching} onClick={switchToTarget}>
          Switch to {targetName}
        </Button>
      ) : (
        <span className="pill"><span className="dot" />{targetName}</span>
      )}
      <span className="pill mono">{shortAddr(address!)}</span>
      <Button variant="secondary" size="sm" onClick={() => disconnect()}>Disconnect</Button>
    </div>
  );
}

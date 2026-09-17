// Owner: Aditya (layout). Platform overview + org directory.
import { StatsBar, ethTile, numTile } from '../components/StatsBar';
import { OrgList } from '../components/OrgList';
import { TxHistory } from '../components/TxHistory';
import { Card, Banner, Spinner, Button } from '../components/ui';
import { usePlatform } from '../hooks/usePlatform';
import { useTxHistory } from '../hooks/useTxHistory';
import { DONATION_PLATFORM_ADDRESS } from '../config/contract';
import { addrUrl, shortAddr } from '../lib/format';
import { href } from '../lib/router';

export function HomePage() {
  const { stats, orgs, isLoading, error, refetchAll } = usePlatform();
  const history = useTxHistory();

  return (
    <>
      <Banner kind="info">
        Reading live from Base Sepolia · contract{' '}
        <a href={addrUrl(DONATION_PLATFORM_ADDRESS)} target="_blank" rel="noreferrer" className="mono">{shortAddr(DONATION_PLATFORM_ADDRESS, 6)} ↗</a>
        {' '}— nothing on this page is self-reported.
        <Button size="sm" variant="secondary" style={{ marginLeft: 12 }} onClick={refetchAll}>Refresh</Button>
      </Banner>

      {error && <Banner kind="error">Could not read contract: {error.message.split('\n')[0]}</Banner>}
      {isLoading ? (
        <div className="empty"><Spinner /> Loading chain state…</div>
      ) : (
        <StatsBar tiles={[ethTile('Total donated', stats.totalDonated), ethTile('In escrow', stats.balance), ethTile('Total released', stats.totalReleased), numTile('Organisations', stats.orgCount)]} />
      )}

      <Card title="Organisations" subtitle="Pick an org to donate or inspect its spending.">
        <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
          <a className="btn" href={href.create()}>+ Create organisation</a>
        </div>
        <OrgList orgs={orgs} />
      </Card>

      <Card title="Platform activity" subtitle="Every event across all orgs, reconstructed from logs.">
        {history.isLoading ? <div className="empty"><Spinner /> Fetching logs…</div> : <TxHistory items={history.data ?? []} showOrg />}
      </Card>
    </>
  );
}

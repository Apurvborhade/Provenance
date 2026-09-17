// Owner: Aditya (layout). Org directory + platform-wide activity.
import { StatsBar, ethTile, numTile } from '../components/StatsBar';
import { OrgList } from '../components/OrgList';
import { TxHistory } from '../components/TxHistory';
import { Card, Banner, Spinner, Button } from '../components/ui';
import { usePlatform } from '../hooks/usePlatform';
import { useTxHistory } from '../hooks/useTxHistory';
import { href } from '../lib/router';

export function OrgsPage() {
  const { stats, orgs, isLoading, error, refetchAll } = usePlatform();
  const history = useTxHistory();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>Organisations</h1>
        </div>
        <div className="row">
          <Button variant="secondary" size="sm" onClick={refetchAll}>Refresh</Button>
          <a className="btn" href={href.create()}>+ Register an org</a>
        </div>
      </div>

      {error && <Banner kind="error">Could not read contract: {error.message.split('\n')[0]}</Banner>}
      {isLoading ? (
        <div className="empty"><Spinner /> Reading chain…</div>
      ) : (
        <StatsBar tiles={[ethTile('Donated', stats.totalDonated), ethTile('In escrow', stats.balance), ethTile('Paid to vendors', stats.totalReleased), numTile('Organisations', stats.orgCount)]} />
      )}

      <div className="stack">
        <OrgList orgs={orgs} />
        <Card title="Platform activity" subtitle="Every event across all orgs, reconstructed from logs. Click a tx to verify on Basescan.">
          {history.isLoading ? <div className="empty"><Spinner /> Fetching logs…</div> : <TxHistory items={history.data ?? []} showOrg />}
        </Card>
      </div>
    </>
  );
}

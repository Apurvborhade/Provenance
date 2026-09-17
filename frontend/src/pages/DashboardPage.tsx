// Owner: Aditya (layout). Data comes from Apurva's hooks; set VITE_USE_MOCK=true to use mock.ts instead.
import { StatsBar } from '../components/StatsBar';
import { MilestoneTable } from '../components/MilestoneTable';
import { TxHistory } from '../components/TxHistory';
import { Card, Banner, Spinner, Button } from '../components/ui';
import { useDonationTracker } from '../hooks/useDonationTracker';
import { useTxHistory } from '../hooks/useTxHistory';
import { DONATION_TRACKER_ADDRESS } from '../config/contract';
import { addrUrl, shortAddr } from '../lib/format';

export function DashboardPage() {
  const { stats, milestones, isLoading, error, refetchAll } = useDonationTracker();
  const history = useTxHistory();

  return (
    <>
      <Banner kind="info">
        Reading live from Base Sepolia · contract{' '}
        <a href={addrUrl(DONATION_TRACKER_ADDRESS)} target="_blank" rel="noreferrer" className="mono">
          {shortAddr(DONATION_TRACKER_ADDRESS, 6)} ↗
        </a>
        {' '}— nothing on this page is self-reported.
        <Button size="sm" variant="secondary" style={{ marginLeft: 12 }} onClick={refetchAll}>Refresh</Button>
      </Banner>

      {error && <Banner kind="error">Could not read contract: {error.message.split('\n')[0]}</Banner>}
      {isLoading ? <div className="empty"><Spinner /> Loading chain state…</div> : <StatsBar stats={stats} />}

      <Card title="Milestones" subtitle="Every spend request and its current status.">
        <MilestoneTable milestones={milestones} />
      </Card>

      <Card title="On-chain history" subtitle="Reconstructed from contract events. Click any tx to verify on Basescan.">
        {history.isLoading ? <div className="empty"><Spinner /> Fetching logs…</div> : <TxHistory items={history.data ?? []} />}
      </Card>
    </>
  );
}

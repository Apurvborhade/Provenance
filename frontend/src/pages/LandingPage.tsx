// Owner: Aditya (layout/copy). Data from Apurva's hooks.
import { LiveReceipt } from '../components/LiveReceipt';
import { OrgList } from '../components/OrgList';
import { StatsBar, ethTile, numTile } from '../components/StatsBar';
import { usePlatform } from '../hooks/usePlatform';
import { useTxHistory } from '../hooks/useTxHistory';
import { DONATION_PLATFORM_ADDRESS } from '../config/contract';
import { addrUrl, shortAddr } from '../lib/format';
import { href } from '../lib/router';

const STATIONS = [
  { n: 1, title: 'Donate', body: 'Anyone sends ETH to an org, with a message. It sits in escrow — the org can’t touch it.', who: 'donor' },
  { n: 2, title: 'Request', body: 'The org names what the money is for, how much, and the vendor who’ll be paid.', who: 'org owner' },
  { n: 3, title: 'Approve', body: 'The platform admin signs off on purpose, amount and payee together.', who: 'admin', admin: true },
  { n: 4, title: 'Release', body: 'Funds go straight from escrow to the vendor. They never pass through the org’s wallet.', who: 'org owner' },
  { n: 5, title: 'Prove', body: 'The org attaches the receipt — hashed, pinned to IPFS. No receipt, no next request.', who: 'org owner' },
];

const PRINCIPLES = [
  {
    title: 'Nothing is self-reported',
    body: 'Every number on this site is read from the contract when you load the page. There is no database of claims to trust.',
    fn: 'getOrgs() · getMilestones() · getLogs()',
    glyph: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12h16M12 4v16" /><circle cx="12" cy="12" r="9" /></svg>,
  },
  {
    title: 'Money never touches the org',
    body: 'A release pays the vendor the admin approved. The organisation requests and accounts for money; it doesn’t hold it.',
    fn: 'releaseMilestone → payee',
    glyph: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h13M12 6l6 6-6 6" /><path d="M21 5v14" /></svg>,
  },
  {
    title: 'No receipt, no more money',
    body: 'After each release the org must commit a receipt hash on-chain before it can request again. The chain enforces it.',
    fn: 'addMilestone reverts ProofRequired',
    glyph: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h6M9 16h6" /></svg>,
  },
];

export function LandingPage() {
  const { stats, orgs, isLoading } = usePlatform();
  const history = useTxHistory();
  const proofed = orgs.reduce((a, o) => a + o.proofCount, 0);
  const released = orgs.reduce((a, o) => a + o.releasedCount, 0);

  return (
    <>
      <section className="hero">
        <div>
          <span className="kicker"><span className="dot" />Live on Base Sepolia · contract verified</span>
          <h1>Donations you can <em>audit</em>, not just trust.</h1>
          <p className="lede">
            Provenance is a public ledger for charitable money. Every donation, spend request, approval, vendor payment and receipt is an on-chain event — so you check the chain, not the charity’s word.
          </p>
          <div className="cta">
            <a className="btn lg" href={href.orgs()}>Explore organisations</a>
            <a className="btn lg ghost" href={href.create()}>Register an org</a>
          </div>
          <p className="contract-line">
            <span>contract</span>
            <a href={addrUrl(DONATION_PLATFORM_ADDRESS)} target="_blank" rel="noreferrer">{shortAddr(DONATION_PLATFORM_ADDRESS, 8)} ↗</a>
            <span>· source verified on Basescan</span>
          </p>
        </div>
        <LiveReceipt items={history.data ?? []} loading={history.isLoading} />
      </section>

      <StatsBar tiles={[
        ethTile('Donated, all orgs', stats.totalDonated),
        ethTile('Held in escrow', stats.balance),
        ethTile('Paid to vendors', stats.totalReleased),
        numTile('Organisations', stats.orgCount),
        { label: 'Receipts on file', value: released === 0 ? '—' : `${proofed}/${released}` },
      ]} />

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">How money moves</p>
            <h2>Five stations. Each one is a transaction.</h2>
            <p>The order is enforced by the contract, not by policy. An org cannot skip a step or run them out of sequence.</p>
          </div>
        </div>
        <div className="rail">
          {STATIONS.map((s) => (
            <div className={`station ${s.admin ? 'admin' : ''}`} key={s.n}>
              <div className="node">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="who">{s.who}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Why it holds up</p>
            <h2>Accountable by construction.</h2>
            <p>The chain can’t see textbooks. So the contract makes the parts it <em>can</em> see impossible to fake or skip.</p>
          </div>
        </div>
        <div className="principles">
          {PRINCIPLES.map((p) => (
            <div className="principle" key={p.title}>
              <div className="glyph">{p.glyph}</div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <span className="fn">{p.fn}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Organisations</p>
            <h2>{orgs.length === 0 ? 'No organisations yet.' : 'Pick one to inspect its ledger.'}</h2>
          </div>
          <a className="btn secondary" href={href.orgs()}>All organisations →</a>
        </div>
        {isLoading ? <div className="empty"><span className="spinner" /> Reading chain…</div> : <OrgList orgs={orgs.slice(0, 3)} />}
      </section>
    </>
  );
}

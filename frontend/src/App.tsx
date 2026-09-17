// Owner: Aditya — shell + routing. ConnectButton is Apurva's.
import { ConnectButton } from './components/ConnectButton';
import { LandingPage } from './pages/LandingPage';
import { OrgsPage } from './pages/OrgsPage';
import { OrgPage } from './pages/OrgPage';
import { CreateOrgPage } from './pages/CreateOrgPage';
import { useRoute, href } from './lib/router';
import { USE_MOCK } from './lib/mock';
import { DONATION_PLATFORM_ADDRESS } from './config/contract';
import { addrUrl, shortAddr } from './lib/format';

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32"><path d="M9 23V9h7.5a4.5 4.5 0 0 1 0 9H13" fill="none" stroke="#3ddc84" strokeWidth="3.5" strokeLinecap="round" /></svg>
    </span>
  );
}

export default function App() {
  const route = useRoute();
  const is = (p: string) => (route.page === p ? 'active' : '');

  return (
    <>
      <header className="site-header">
        <div className="container">
          <a className="brand" href={href.home()}><Mark />Provenance</a>
          <nav className="nav" aria-label="Primary">
            <a href={href.orgs()} className={is('orgs') || is('org')}>Organisations</a>
            <a href={href.create()} className={is('create')}>Register</a>
          </nav>
          <div className="header-right">
            {USE_MOCK && <span className="pill warn"><span className="dot" />mock data</span>}
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container">
        {route.page === 'home' && <LandingPage />}
        {route.page === 'orgs' && <OrgsPage />}
        {route.page === 'create' && <CreateOrgPage />}
        {route.page === 'org' && <OrgPage key={route.orgId} orgId={route.orgId} />}
      </main>

      <footer className="site-footer">
        <div className="container">
          <span>Provenance · Hack2Ignite WB-05 · all data read live from Base Sepolia</span>
          <a href={addrUrl(DONATION_PLATFORM_ADDRESS)} target="_blank" rel="noreferrer" className="mono">{shortAddr(DONATION_PLATFORM_ADDRESS, 6)} ↗</a>
        </div>
      </footer>
    </>
  );
}

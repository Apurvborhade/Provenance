// Owner: Aditya — shell + routing. ConnectButton is Apurva's.
import { ConnectButton } from './components/ConnectButton';
import { HomePage } from './pages/HomePage';
import { OrgPage } from './pages/OrgPage';
import { CreateOrgPage } from './pages/CreateOrgPage';
import { useRoute, href } from './lib/router';
import { USE_MOCK } from './lib/mock';

export default function App() {
  const route = useRoute();

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href={href.home()}>Prove<span>nance</span></a>
        <div className="right">
          {USE_MOCK && <span className="pill warn"><span className="dot" />mock data</span>}
          <ConnectButton />
        </div>
      </header>

      <main>
        {route.page === 'home' && <HomePage />}
        {route.page === 'create' && <CreateOrgPage />}
        {route.page === 'org' && <OrgPage key={route.orgId} orgId={route.orgId} />}
      </main>

      <footer className="footer">All data read live from Base Sepolia · nothing is self-reported · Hack2Ignite WB-05</footer>
    </div>
  );
}

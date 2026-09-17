// Owner: Aditya — shell + tabs. ConnectButton is Apurva's.
import { useState } from 'react';
import { ConnectButton } from './components/ConnectButton';
import { DashboardPage } from './pages/DashboardPage';
import { DonatePage } from './pages/DonatePage';
import { OrgPage } from './pages/OrgPage';
import { USE_MOCK } from './lib/mock';

type Tab = 'dashboard' | 'donate' | 'org';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'donate', label: 'Donate' },
  { id: 'org', label: 'Org' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="container">
      <header className="header">
        <div className="brand">Prove<span>nance</span></div>
        <div className="right">
          {USE_MOCK && <span className="pill warn"><span className="dot" />mock data</span>}
          <ConnectButton />
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'donate' && <DonatePage />}
        {tab === 'org' && <OrgPage />}
      </main>

      <footer className="footer">All data read live from Base Sepolia · nothing is self-reported · Hack2Ignite WB-05</footer>
    </div>
  );
}

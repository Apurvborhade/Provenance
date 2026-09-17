// Owner: Aditya — pure props.
import { OrgCard } from './OrgCard';
import { href } from '../lib/router';
import type { Org } from '../lib/types';

export function OrgList({ orgs }: { orgs: Org[] }) {
  if (orgs.length === 0)
    return (
      <div className="empty">
        No organisations yet. <a href={href.create()}>Register the first one</a>.
      </div>
    );
  return <div className="org-grid">{orgs.map((o) => <OrgCard key={o.id} org={o} />)}</div>;
}

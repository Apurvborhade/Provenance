// Tiny hash router so org pages are shareable (#/org/3) without pulling in react-router.
import { useEffect, useState } from 'react';

export type Route = { page: 'home' } | { page: 'org'; orgId: number } | { page: 'create' };

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === 'create') return { page: 'create' };
  const m = h.match(/^org\/(\d+)$/);
  if (m) return { page: 'org', orgId: Number(m[1]) };
  return { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = {
  home: () => '#/',
  create: () => '#/create',
  org: (id: number) => `#/org/${id}`,
};

export const navigate = (to: string) => {
  window.location.hash = to;
};

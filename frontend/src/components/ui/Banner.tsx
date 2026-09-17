import type { ReactNode } from 'react';

export function Banner({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'error' | 'success'; children: ReactNode }) {
  return <div className={`banner ${kind}`}>{children}</div>;
}

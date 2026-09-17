import type { ReactNode } from 'react';

export function Card({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {subtitle && <p className="sub">{subtitle}</p>}
      {children}
    </section>
  );
}

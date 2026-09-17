// Owner: Aditya — never import wagmi here.
import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...rest }: Props) {
  const cls = ['btn', variant !== 'primary' ? variant : '', size === 'sm' ? 'sm' : '', className].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

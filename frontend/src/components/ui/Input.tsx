import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, ...rest }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} className="input" {...rest} />
    </div>
  );
}

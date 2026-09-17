// Owner: Apurva (wiring). Hashes a receipt file in-browser (keccak256) — the file itself never leaves the user's machine.
// If no file is chosen, the URI string is hashed instead so there's always a non-zero commitment.
import { useState } from 'react';
import { keccak256, toBytes, type Hex } from 'viem';
import { Button, Input } from './ui';
import type { Milestone } from '../lib/types';

interface Props {
  milestone: Milestone;
  busy: boolean;
  onSubmit: (id: number, hash: Hex, uri: string) => void;
  onCancel: () => void;
}

export function AttachProofForm({ milestone, busy, onSubmit, onCancel }: Props) {
  const [uri, setUri] = useState('');
  const [fileHash, setFileHash] = useState<Hex | null>(null);
  const [fileName, setFileName] = useState('');

  const onFile = async (f: File | undefined) => {
    if (!f) return setFileHash(null);
    const buf = new Uint8Array(await f.arrayBuffer());
    setFileHash(keccak256(buf));
    setFileName(f.name);
  };

  const hash: Hex | null = fileHash ?? (uri.trim() ? keccak256(toBytes(uri.trim())) : null);

  return (
    <div className="proof-form">
      <p className="sub">Proof for milestone #{milestone.id} “{milestone.description}”. This is permanent and public.</p>
      <Input label="Receipt / invoice URL" placeholder="https://… or ipfs://…" value={uri} onChange={(e) => setUri(e.target.value)} disabled={busy} />
      <div className="field">
        <label htmlFor="proof-file">Receipt file (optional — hashed locally, not uploaded)</label>
        <input id="proof-file" type="file" className="input" onChange={(e) => void onFile(e.target.files?.[0])} disabled={busy} />
        {fileHash && <span className="muted mono" style={{ fontSize: '0.75rem' }}>{fileName}: {fileHash.slice(0, 18)}…</span>}
      </div>
      <div className="row">
        <Button size="sm" loading={busy} disabled={!hash || !uri.trim()} onClick={() => onSubmit(milestone.id, hash!, uri.trim())}>Attach proof on-chain</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

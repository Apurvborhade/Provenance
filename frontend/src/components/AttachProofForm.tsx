// Owner: Apurva (wiring). Pick a receipt → the app hashes it locally (keccak256), uploads it to the backend
// (which hashes it again and stores it by hash), refuses to continue if the two hashes disagree, then
// commits hash + URL on-chain. The user never types a URL or a hash.
import { useState } from 'react';
import { keccak256, type Hex } from 'viem';
import { Button } from './ui';
import { uploadReceipt, BACKEND_CONFIGURED } from '../lib/api';
import type { Milestone } from '../lib/types';

interface Props {
  milestone: Milestone;
  busy: boolean;
  onSubmit: (id: number, hash: Hex, uri: string) => void;
  onCancel: () => void;
}

type Step = 'idle' | 'hashing' | 'uploading' | 'ready' | 'error';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.heic,.txt';
const MAX_BYTES = 10 * 1024 * 1024;

export function AttachProofForm({ milestone, busy, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [localHash, setLocalHash] = useState<Hex | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [stored, setStored] = useState<{ storage: 'ipfs' | 'local'; cid?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setStep('idle'); setLocalHash(null); setUri(null); setStored(null); setError(null); };

  const onFile = async (f: File | undefined) => {
    reset();
    if (!f) return setFile(null);
    setFile(f);
    if (f.size > MAX_BYTES) { setStep('error'); return setError('File is larger than 10 MB.'); }
    try {
      setStep('hashing');
      const hash = keccak256(new Uint8Array(await f.arrayBuffer()));
      setLocalHash(hash);

      setStep('uploading');
      const r = await uploadReceipt(milestone.orgId, milestone.id, f);
      if (r.hash.toLowerCase() !== hash.toLowerCase()) {
        throw new Error('Server returned a different hash than computed locally — refusing to continue.');
      }
      setUri(r.uri);
      setStored({ storage: r.storage, cid: r.cid });
      setStep('ready');
    } catch (e) {
      setStep('error');
      setError((e as Error).message);
    }
  };

  const working = step === 'hashing' || step === 'uploading';

  return (
    <div className="proof-form">
      <p className="sub">Receipt for milestone #{milestone.id} “{milestone.description}”. The file is hashed in your browser, pinned to IPFS, and the hash + IPFS address are written on-chain permanently.</p>

      {!BACKEND_CONFIGURED && <p className="proof missing">Backend not configured — set <code>VITE_API_URL</code> to enable receipt uploads.</p>}

      <div className="field">
        <label htmlFor="proof-file">Receipt / invoice / photo (pdf, png, jpg, webp, heic, txt — max 10 MB)</label>
        <input id="proof-file" type="file" className="input" accept={ACCEPT} onChange={(e) => void onFile(e.target.files?.[0])} disabled={busy || working || !BACKEND_CONFIGURED} />
      </div>

      {file && (
        <ul className="proof-steps">
          <li className={localHash ? 'done' : step === 'hashing' ? 'active' : ''}>Hash locally {localHash && <span className="mono muted">{localHash.slice(0, 14)}…</span>}</li>
          <li className={uri ? 'done' : step === 'uploading' ? 'active' : ''}>
            Pin to IPFS &amp; verify server hash matches
            {stored?.storage === 'ipfs' && stored.cid && <> <span className="mono muted">{stored.cid.slice(0, 12)}…</span></>}
            {stored?.storage === 'local' && <> <span className="proof missing">(IPFS unavailable — stored on backend)</span></>}
          </li>
          <li className={step === 'ready' ? 'active' : ''}>Commit hash on-chain</li>
        </ul>
      )}

      {error && <p className="proof missing">{error}</p>}

      <div className="row">
        <Button size="sm" loading={busy || working} disabled={step !== 'ready' || !localHash || !uri} onClick={() => onSubmit(milestone.id, localHash!, uri!)}>
          {working ? (step === 'hashing' ? 'Hashing…' : 'Uploading…') : 'Attach proof on-chain'}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy || working} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

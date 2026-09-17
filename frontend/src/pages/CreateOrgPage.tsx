import { CreateOrgForm } from '../components/CreateOrgForm';
import { href } from '../lib/router';

export function CreateOrgPage() {
  return (
    <>
      <a className="back" href={href.orgs()}>← Organisations</a>
      <div className="page-head">
        <div>
          <p className="eyebrow">New organisation</p>
          <h1>Register on-chain</h1>
        </div>
      </div>
      <CreateOrgForm />
    </>
  );
}

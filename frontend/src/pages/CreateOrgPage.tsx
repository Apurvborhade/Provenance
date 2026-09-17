import { CreateOrgForm } from '../components/CreateOrgForm';
import { href } from '../lib/router';

export function CreateOrgPage() {
  return (
    <>
      <p><a href={href.home()}>← All organisations</a></p>
      <CreateOrgForm />
    </>
  );
}

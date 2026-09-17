import type { MilestoneStatus } from '../../lib/types';

export function Badge({ status }: { status: MilestoneStatus }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

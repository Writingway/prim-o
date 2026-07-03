import { EMP_AVATAR } from './dashStyles';

type Props = { initials: string };

// Initials badge for an employee/manager row - shared by the Manager and Owner
// dashboards and the redistribution block.
export default function Avatar({ initials }: Props) {
  return <div className={EMP_AVATAR}>{initials}</div>;
}

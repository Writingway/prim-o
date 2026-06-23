import { EMP_AVATAR } from './dashStyles';

type Props = { initials: string };

// Pastille d'initiales (employé / manager). Partagée Manager + Owner + redistribution.
export default function Avatar({ initials }: Props) {
  return <div className={EMP_AVATAR}>{initials}</div>;
}

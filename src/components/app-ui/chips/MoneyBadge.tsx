import { Chip } from './Chip';

export type MoneyBadgeProps = {
  value: string;
  label?: string;
  className?: string;
};

export function MoneyBadge({ value, label = 'Giá trị', className = '' }: MoneyBadgeProps) {
  return (
    <Chip className={className} tone="success">
      <span className="text-[color:var(--text-muted)]">{label}</span>
      <span className="font-semibold nums">{value}</span>
    </Chip>
  );
}

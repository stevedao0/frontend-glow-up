import { Chip, type ChipProps } from './Chip';

export type DomainChipProps = Omit<ChipProps, 'tone'>;

export function DomainChip(props: DomainChipProps) {
  return <Chip tone="primary" {...props} />;
}

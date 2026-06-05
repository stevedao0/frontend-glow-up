import type { OverflowAction } from '../ActionOverflowMenu';
import { ActionOverflowMenu } from '../ActionOverflowMenu';

export type MoreActionsProps = {
  actions: OverflowAction[];
  label?: string;
};

export function MoreActions({ actions, label }: MoreActionsProps) {
  return <ActionOverflowMenu actions={actions} label={label} />;
}

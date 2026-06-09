import React from 'react';
import { formatCurrency } from '../../../lib/format';
import { EnterpriseBadge, EnterpriseChip } from '../primitives';

export function EnterpriseContractNoCell({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold text-[12.5px] leading-snug">{primary}</div>
      {secondary ? <div className="mt-1 text-[11px] vc-enterprise-subtle">{secondary}</div> : null}
    </div>
  );
}

export function EnterpriseCustomerCell({
  name,
  secondary,
}: {
  name: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold text-[13px] leading-snug text-zinc-900">{name}</div>
      {secondary ? <div className="mt-1 text-[12px] vc-enterprise-subtle">{secondary}</div> : null}
    </div>
  );
}

export function EnterpriseLocationCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-[12.5px] leading-snug vc-enterprise-subtle">{children}</div>;
}

export function EnterpriseAmountCell({
  amount,
}: {
  amount: number | null;
}) {
  if (amount == null) {
    return <span className="text-zinc-400 italic text-xs">Chưa có</span>;
  }

  if (amount === 0) {
    return <span className="text-zinc-500 text-xs">Chưa tính</span>;
  }

  return <span className="money-strong tabular-nums text-[13.5px]">{formatCurrency(amount)}</span>;
}

export function EnterpriseStatusPair({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 items-start">
      {primary}
      {secondary}
    </div>
  );
}

export function EnterpriseUsageChips({
  items,
  extra,
  detail,
}: {
  items: string[];
  extra?: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-1">
      {items.map((item, index) => (
        <EnterpriseChip key={`${String(item)}-${index}`} tone="teal" className="usage-area-chip">{item}</EnterpriseChip>
      ))}
      {extra ? <EnterpriseBadge tone="neutral" className="usage-extra-chip">{extra}</EnterpriseBadge> : null}
      {detail}
    </div>
  );
}

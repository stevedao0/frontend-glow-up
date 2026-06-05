import type React from 'react';
import { ContentCard } from '../ContentCard';

export type FilterPanelProps = {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FilterPanel({ title = 'Bộ lọc', description, actions, children, className = '' }: FilterPanelProps) {
  return (
    <ContentCard title={title} description={description} actions={actions} className={className}>
      {children}
    </ContentCard>
  );
}

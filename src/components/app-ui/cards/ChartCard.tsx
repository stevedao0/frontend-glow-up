import type React from 'react';
import { ContentCard } from '../ContentCard';

export type ChartCardProps = {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, description, actions, children, className = '' }: ChartCardProps) {
  return (
    <ContentCard title={title} description={description} actions={actions} className={className}>
      {children}
    </ContentCard>
  );
}

"use client";

import { useTranslations } from 'next-intl';
import { AgentDetail } from '@/components/AgentDetail';

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <AgentDetail id={params.id} />
    </div>
  );
} 
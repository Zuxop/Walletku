'use client';

import { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateInsights, type FinancialInsight } from '@/lib/utils/insights';
import type { Transaksi, Budget } from '@/types/database';
import Link from 'next/link';

interface InsightsCardProps {
  transaksi: Transaksi[];
  budget: Budget[];
  previousMonthTransaksi?: Transaksi[];
}

export function InsightsCard({ transaksi, budget, previousMonthTransaksi }: InsightsCardProps) {
  const insights = useMemo(() => {
    return generateInsights(transaksi, budget, previousMonthTransaksi);
  }, [transaksi, budget, previousMonthTransaksi]);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insight Keuangan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <InsightItem key={index} insight={insight} />
        ))}
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }: { insight: FinancialInsight }) {
  const icons = {
    warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    tip: <Lightbulb className="h-5 w-5 text-yellow-500" />
  };

  const bgColors = {
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
    tip: 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${bgColors[insight.type]} flex gap-3`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[insight.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{insight.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
        {insight.action && (
          <Link href={insight.action}>
            <Button variant="link" size="sm" className="p-0 h-auto mt-2">
              Lihat Detail
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { CustomerSummary } from '@/api/types';
import { formatMoney, getRiskTier } from '@/lib/format';
import { ShieldAlert } from 'lucide-react';

interface CustomerCardProps {
  customer: CustomerSummary;
  isSelected: boolean;
  onSelect: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, isSelected, onSelect }) => {
  const risk = getRiskTier(customer.risk_score);
  const overdue = customer.overdue_balance || 0;
  const limit = customer.credit_limit || 1;
  const overduePercent = Math.min(100, Math.round((overdue / limit) * 100));

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${
        isSelected
          ? 'bg-white/[0.08] border-brass/40 shadow-sm'
          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Top row: Customer ID, Business Type, Name & Risk score badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="font-mono text-[10px] font-semibold text-brass bg-brass-dim px-1.5 py-0.5 rounded border border-brass/25 tracking-wider">
              {customer.id}
            </span>
            <span className="text-[10px] font-mono text-muted/80 truncate">
              {customer.business_type || 'Commercial SME'}
            </span>
          </div>
          <h4
            className={`font-sans text-sm font-medium truncate ${
              isSelected ? 'text-chalk font-semibold' : 'text-chalk/90 group-hover:text-chalk'
            }`}
          >
            {customer.name}
          </h4>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0 mt-0.5">
          {customer.isPartOfRing && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider bg-brass-dim text-brass border border-brass/30 flex items-center space-x-0.5"
              title="Connected to delinquent entities or contact-sharing syndicate"
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              <span>RING</span>
            </span>
          )}

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${risk.badgeBg} ${risk.colorClass} ${risk.badgeBorder}`}
          >
            {customer.risk_score}
          </span>
        </div>
      </div>

      {/* Exposure / limit bar */}
      <div className="mt-2.5 space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-baseline text-muted">
          <span>Limit: {formatMoney(customer.credit_limit, true)}</span>
          <span className={overdue > 0 ? 'text-vermilion-light font-medium' : 'text-muted/60'}>
            {overdue > 0 ? `Overdue: ${formatMoney(overdue, true)}` : 'Clean'}
          </span>
        </div>

        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overdue > 0 ? 'bg-vermilion' : 'bg-dollar-green/40'
            }`}
            style={{ width: `${Math.max(4, overduePercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

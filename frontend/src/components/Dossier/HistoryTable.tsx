import React from 'react';
import { PaymentHistoryItem } from '@/api/types';
import { formatMoney, formatDate } from '@/lib/format';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface HistoryTableProps {
  history: PaymentHistoryItem[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-black/[0.02] border border-black/5 text-ink-muted text-xs font-mono">
        No past invoice or settlement history recorded for this customer.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
        <span className="uppercase tracking-wider font-semibold">Trade History & Disputes</span>
        <span>{history.length} records</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 shadow-sm bg-white/70">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-black/5 border-b border-black/10 text-[10px] uppercase text-ink-muted">
            <tr>
              <th className="py-2 px-3">Invoice</th>
              <th className="py-2 px-3">Due Date</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Amount</th>
              <th className="py-2 px-3">Dispute / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {history.map((item, idx) => {
              const isOverdue = item.invoice_status === 'OVERDUE';
              const isPaid = item.invoice_status === 'PAID';

              return (
                <tr key={idx} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-ink">{item.invoice_number}</td>
                  <td className="py-2.5 px-3 text-ink-muted">{formatDate(item.due_date)}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isOverdue
                          ? 'bg-vermilion-dim text-vermilion border border-vermilion/30'
                          : isPaid
                          ? 'bg-naira-green-dim text-naira-green border border-naira-green/30'
                          : 'bg-brass-dim text-brass border border-brass/30'
                      }`}
                    >
                      {isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                      {isPaid && <CheckCircle className="w-2.5 h-2.5" />}
                      <span>{item.invoice_status}</span>
                      {isOverdue && item.days_overdue > 0 && (
                        <span>({item.days_overdue}d)</span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-ink">
                    {formatMoney(item.invoice_amount, true)}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-ink-muted font-sans">
                    {item.dispute_reason ? (
                      <span className="text-vermilion font-medium">
                        {item.dispute_reason} ({item.dispute_severity || 'Open'})
                      </span>
                    ) : item.paid_amount ? (
                      <span className="text-naira-green">
                        Settled {formatMoney(item.paid_amount, true)} on {formatDate(item.payment_date)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

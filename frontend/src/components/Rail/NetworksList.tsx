import React from 'react';
import { NetworkRing } from '@/api/types';
import { formatMoney } from '@/lib/format';
import { Phone, Mail, MapPin, Users, AlertTriangle } from 'lucide-react';

interface NetworksListProps {
  rings: NetworkRing[];
  selectedRingId: string | null;
  onSelectRing: (ring: NetworkRing) => void;
}

export const NetworksList: React.FC<NetworksListProps> = ({ rings, selectedRingId, onSelectRing }) => {
  if (rings.length === 0) {
    return (
      <div className="p-6 text-center text-muted font-mono text-xs">
        No contact-sharing syndicates detected in current ledger.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      <div className="px-2 py-1 text-[11px] font-mono text-muted/80 flex items-center justify-between">
        <span>COLLUSION & SYNDICATES</span>
        <span>{rings.length} DETECTED</span>
      </div>

      {rings.map((ring) => {
        const isSelected = selectedRingId === ring.id;
        const icon =
          ring.type === 'phone' ? (
            <Phone className="w-3.5 h-3.5 text-brass" />
          ) : ring.type === 'email' ? (
            <Mail className="w-3.5 h-3.5 text-brass" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-brass" />
          );

        return (
          <div
            key={ring.id}
            onClick={() => onSelectRing(ring)}
            className={`p-3 rounded-lg cursor-pointer transition-all border ${
              isSelected
                ? 'bg-brass/10 border-brass/50 shadow-sm'
                : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
            }`}
          >
            {/* Header: Shared attribute */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 min-w-0">
                {icon}
                <span className="font-mono text-xs text-chalk truncate font-medium">{ring.sharedValue}</span>
              </div>
              <span className="font-mono text-[10px] text-brass bg-brass-dim px-1.5 py-0.5 rounded border border-brass/30 flex items-center space-x-1">
                <Users className="w-2.5 h-2.5" />
                <span>{ring.members.length}</span>
              </span>
            </div>

            {/* Financial Totals */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-[11px] pt-2 border-t border-white/5">
              <div>
                <span className="text-[10px] uppercase text-muted block">Syndicate Limit</span>
                <span className="text-chalk/90 font-medium">{formatMoney(ring.totalCreditLimit, true)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted block">Delinquent Overdue</span>
                <span
                  className={`font-semibold ${
                    ring.totalOverdue > 0 ? 'text-vermilion-light' : 'text-dollar-green'
                  }`}
                >
                  {formatMoney(ring.totalOverdue, true)}
                </span>
              </div>
            </div>

            {/* Member list chips */}
            <div className="mt-2 flex flex-wrap gap-1">
              {ring.members.map((m) => (
                <span
                  key={m.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-white/5 text-chalk/80 border border-white/5"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

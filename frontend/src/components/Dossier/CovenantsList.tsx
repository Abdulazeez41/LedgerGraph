import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CovenantsListProps {
  conditions: string[];
}

export const CovenantsList: React.FC<CovenantsListProps> = ({ conditions }) => {
  if (!conditions || conditions.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-black/[0.02] border border-black/5 text-ink-muted text-xs font-mono">
        No conditional covenants mandated for this evaluation.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
        <ShieldAlert className="w-3.5 h-3.5 text-brass" />
        <span className="uppercase tracking-wider font-semibold">Recommended Trade Covenants</span>
      </div>

      <div className="space-y-1.5">
        {conditions.map((condition, idx) => (
          <div
            key={idx}
            className="flex items-start space-x-2.5 p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm text-xs font-sans text-ink"
          >
            <CheckCircle2 className="w-4 h-4 text-brass flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{condition}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

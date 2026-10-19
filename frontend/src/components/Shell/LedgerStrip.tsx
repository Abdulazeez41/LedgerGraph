import React from 'react';
import { useStore } from '@/store/useStore';
import { formatCompactMoney } from '@/lib/format';
import { UploadCloud, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';

export const LedgerStrip: React.FC = () => {
  const { health, customers, rings, openModal, seedData, isAgentWorking } = useStore();

  const totalCapital = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  }, [customers]);

  const totalOverdue = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.overdue_balance || 0), 0);
  }, [customers]);

  const delinquentCount = React.useMemo(() => {
    return customers.filter((c) => (c.overdue_balance || 0) > 0).length;
  }, [customers]);

  const isHealthy = health?.status === 'healthy';

  return (
    <header className="fixed top-3 left-4 right-4 z-40 h-14 rounded-xl glass-panel flex items-center justify-between px-5 py-2 select-none">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-4">
        <div className="flex items-baseline space-x-2">
          <span className="font-display text-lg tracking-tight text-chalk font-semibold">LedgerGraph</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted/70 hidden sm:inline">
            The Ledger Room
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 hidden md:block" />

        {/* Live FalkorDB Connectivity Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full glass-pill text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-dollar-green shadow-[0_0_8px_rgba(30,127,85,0.8)]' : 'bg-vermilion animate-pulse'
            }`}
          />
          <span className="text-chalk/90 font-medium">
            FalkorDB :{health?.port || 6380}
          </span>
          <span className="text-muted/60">•</span>
          <span className="text-muted">
            {health?.node_count ?? 305} nodes / {health?.relationship_count ?? 815} edges
          </span>
        </div>
      </div>

      {/* Center Running Aggregates (from loaded graph) */}
      <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted">Monitored Capital</span>
          <span className="text-chalk font-semibold text-sm">{formatCompactMoney(totalCapital)}</span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted">Overdue Exposure</span>
          <span
            className={`font-semibold text-sm ${
              totalOverdue > 0 ? 'text-vermilion-light' : 'text-dollar-green'
            }`}
          >
            {formatCompactMoney(totalOverdue)}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted">Delinquent</span>
          <span className="text-chalk font-medium text-sm">
            {delinquentCount} / {customers.length}
          </span>
        </div>

        {rings.length > 0 && (
          <>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-brass flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Rings</span>
              </span>
              <span className="text-brass font-medium text-sm">{rings.length} syndicates</span>
            </div>
          </>
        )}
      </div>

      {/* Right Operational Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => openModal('transcript')}
          className="px-2.5 py-1.5 rounded-lg glass-pill hover:bg-white/10 transition-colors text-xs font-mono text-chalk flex items-center space-x-1.5"
          title="Open conversation audit transcript"
        >
          <MessageSquare className="w-3.5 h-3.5 text-muted" />
          <span className="hidden sm:inline">Transcript</span>
        </button>

        <button
          onClick={() => openModal('upload')}
          className="px-2.5 py-1.5 rounded-lg glass-pill hover:bg-white/10 transition-colors text-xs font-mono text-chalk flex items-center space-x-1.5"
          title="Upload CSV Ledger (customers, invoices, payments...)"
        >
          <UploadCloud className="w-3.5 h-3.5 text-brass" />
          <span className="hidden sm:inline">Upload CSV</span>
        </button>

        <button
          onClick={() => {
            if (confirm('Re-ingest default seed data into FalkorDB?')) {
              seedData();
            }
          }}
          disabled={isAgentWorking}
          className="px-2.5 py-1.5 rounded-lg glass-pill hover:bg-white/10 transition-colors text-xs font-mono text-muted hover:text-chalk flex items-center space-x-1.5 disabled:opacity-50"
          title="Re-seed demo topology from CSV"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Re-Seed</span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { useStore } from '@/store/useStore';
import { CustomerCard } from './CustomerCard';
import { NetworksList } from './NetworksList';
import { Search, SlidersHorizontal, Users, ShieldAlert, ArrowUpDown } from 'lucide-react';

export const TheBook: React.FC = () => {
  const {
    customers,
    rings,
    activeRailTab,
    setActiveRailTab,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedCustomerName,
    selectCustomer,
    selectedRingId,
    selectRing,
  } = useStore();

  const filteredCustomers = React.useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.business_type?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'risk') return (b.risk_score || 0) - (a.risk_score || 0);
      if (sortBy === 'balance') return (b.overdue_balance || 0) - (a.overdue_balance || 0);
      if (sortBy === 'limit') return (b.credit_limit || 0) - (a.credit_limit || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [customers, searchQuery, sortBy]);

  return (
    <aside className="fixed left-4 top-20 bottom-4 w-80 md:w-96 rounded-xl glass-panel flex flex-col z-30 select-none overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 p-1 bg-black/20 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveRailTab('customers')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center space-x-1.5 ${
                activeRailTab === 'customers'
                  ? 'bg-white/10 text-chalk font-medium shadow-sm'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>The Ledger ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveRailTab('networks')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center space-x-1.5 ${
                activeRailTab === 'networks'
                  ? 'bg-brass/20 text-brass font-medium border border-brass/30 shadow-sm'
                  : 'text-muted hover:text-brass'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rings ({rings.length})</span>
            </button>
          </div>

          {/* Sort selector dropdown / toggle */}
          {activeRailTab === 'customers' && (
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort customers"
                className="bg-black/30 text-chalk text-[11px] font-mono rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-brass/50 cursor-pointer appearance-none pr-5"
              >
                <option value="risk">Risk: High to Low</option>
                <option value="balance">Overdue: High to Low</option>
                <option value="limit">Credit Limit</option>
                <option value="name">Name: A-Z</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-muted absolute right-1.5 top-2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Search bar */}
        {activeRailTab === 'customers' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by customer, phone, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 text-chalk placeholder:text-muted/60 text-xs font-sans rounded-lg pl-8 pr-3 py-1.5 border border-white/5 focus:outline-none focus:border-brass/40"
            />
          </div>
        )}
      </div>

      {/* Scrollable list content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {activeRailTab === 'customers' ? (
          filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <CustomerCard
                key={c.id || c.name}
                customer={c}
                isSelected={selectedCustomerName === c.name}
                onSelect={() => selectCustomer(c.name)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted font-mono">No matching accounts found.</div>
          )
        ) : (
          <NetworksList rings={rings} selectedRingId={selectedRingId} onSelectRing={selectRing} />
        )}
      </div>
    </aside>
  );
};

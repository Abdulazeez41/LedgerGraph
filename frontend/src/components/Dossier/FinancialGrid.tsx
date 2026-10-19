import React from "react";
import { CustomerProfile } from "@/api/types";
import { formatMoney, formatDate } from "@/lib/format";
import {
  AlertCircle,
  Building2,
  Hash,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface FinancialGridProps {
  profile: CustomerProfile | null;
}

export const FinancialGrid: React.FC<FinancialGridProps> = ({ profile }) => {
  if (!profile) return null;

  const overdue = profile.overdue_balance || 0;
  const customerId = profile.customer_id || profile.id || "CUST--";
  const availableCredit =
    profile.available_credit ??
    Math.max(0, profile.credit_limit - profile.outstanding_balance);
  const utilization =
    profile.credit_utilization_pct ??
    (profile.credit_limit > 0
      ? Math.round((profile.outstanding_balance / profile.credit_limit) * 100)
      : 0);

  return (
    <div className="space-y-4">
      {/* Entity KYC & Graph Identifiers Card */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-black/10 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-black/5 pb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brass" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              KYC & Entity Master Record
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-brass bg-brass-dim px-2 py-0.5 rounded border border-brass/30 flex items-center space-x-1">
            <Hash className="w-3 h-3" />
            <span>{customerId}</span>
          </span>
        </div>

        {/* Master Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Customer ID:
            </span>
            <span className="font-bold text-ink truncate select-text">
              {customerId}
            </span>
          </div>

          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Legal Name:
            </span>
            <span className="font-semibold text-ink truncate select-text">
              {profile.name}
            </span>
          </div>

          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Business Type:
            </span>
            <span className="text-ink truncate font-medium">
              {profile.business_type || "Commercial Enterprise"}
            </span>
          </div>

          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Phone:
            </span>
            <span className="text-ink truncate select-text flex items-center space-x-1">
              <Phone className="w-2.5 h-2.5 text-ink-subtle" />
              <span>{profile.phone || "-"}</span>
            </span>
          </div>

          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Email:
            </span>
            <span className="text-ink truncate select-text flex items-center space-x-1">
              <Mail className="w-2.5 h-2.5 text-ink-subtle" />
              <span>{profile.email || "-"}</span>
            </span>
          </div>

          <div className="flex items-start space-x-1.5">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Onboarded:
            </span>
            <span className="text-ink truncate flex items-center space-x-1">
              <Calendar className="w-2.5 h-2.5 text-ink-subtle" />
              <span>{formatDate(profile.created_at)}</span>
            </span>
          </div>

          <div className="flex items-start space-x-1.5 sm:col-span-2">
            <span className="text-[10px] uppercase text-ink-muted w-24 flex-shrink-0">
              Address:
            </span>
            <span className="text-ink truncate select-text flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5 text-ink-subtle flex-shrink-0" />
              <span className="truncate">{profile.address || "-"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Financial Exposure Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <span className="uppercase tracking-wider font-semibold">
            Ledger Financial Exposure
          </span>
          <span>Utilization: {utilization}%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Credit Limit */}
          <div className="p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-ink-muted block">
              Credit Limit
            </span>
            <span className="text-sm font-mono font-bold text-ink mt-0.5 block">
              {formatMoney(profile.credit_limit, true)}
            </span>
          </div>

          {/* Available Credit */}
          <div className="p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-ink-muted block">
              Available Credit
            </span>
            <span className="text-sm font-mono font-bold text-dollar-green mt-0.5 block">
              {formatMoney(availableCredit, true)}
            </span>
          </div>

          {/* Total Invoiced */}
          <div className="p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-ink-muted block">
              Total Invoiced
            </span>
            <span className="text-sm font-mono font-semibold text-ink mt-0.5 block">
              {formatMoney(profile.total_invoiced, true)}
            </span>
          </div>

          {/* Total Settled */}
          <div className="p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-ink-muted block">
              Total Settled
            </span>
            <span className="text-sm font-mono font-semibold text-dollar-green mt-0.5 block">
              {formatMoney(profile.total_paid, true)}
            </span>
          </div>

          {/* Outstanding Balance */}
          <div className="p-3 rounded-lg bg-white/70 border border-black/5 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-ink-muted block">
              Outstanding Balance
            </span>
            <span className="text-sm font-mono font-semibold text-ink mt-0.5 block">
              {formatMoney(profile.outstanding_balance, true)}
            </span>
          </div>

          {/* Overdue Balance */}
          <div
            className={`p-3 rounded-lg border shadow-sm ${
              overdue > 0
                ? "bg-vermilion-dim border-vermilion/30"
                : "bg-white/70 border-black/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-ink-muted">
                Overdue Balance
              </span>
              {overdue > 0 && (
                <AlertCircle className="w-3.5 h-3.5 text-vermilion" />
              )}
            </div>
            <span
              className={`text-sm font-mono font-bold mt-0.5 block ${
                overdue > 0 ? "text-vermilion" : "text-dollar-green"
              }`}
            >
              {formatMoney(overdue, true)}
            </span>
            {overdue > 0 && (
              <span className="text-[10px] font-mono text-vermilion-light block mt-0.5">
                {profile.overdue_invoices_count || 1} delinquent invoices
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { panelSlideVariants } from "@/lib/motionTokens";
import { TraceBar } from "./TraceBar";
import { VerdictStamp } from "./VerdictStamp";
import { RationaleView } from "./RationaleView";
import { CovenantsList } from "./CovenantsList";
import { FinancialGrid } from "./FinancialGrid";
import { CypherViewer } from "./CypherViewer";
import { HistoryTable } from "./HistoryTable";
import { DecisionsJournal } from "./DecisionsJournal";
import { DossierActions } from "./DossierActions";
import { formatMoney } from "@/lib/format";
import {
  X,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  FileSpreadsheet,
  Terminal,
  History,
  Info,
} from "lucide-react";

export const TheDossier: React.FC = () => {
  const {
    dossierOpen,
    setDossierOpen,
    profile,
    lastChatResponse,
    activeDossierTab,
    setActiveDossierTab,
    history,
    connectedRisks,
    decisions,
    isLoadingCustomerData,
  } = useStore();

  if (!dossierOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        variants={panelSlideVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-20 right-4 bottom-4 w-full sm:w-[520px] lg:w-[560px] z-30 flex flex-col rounded-xl glass-panel-elevated overflow-hidden shadow-glass-lg border border-white/10 select-none"
      >
        {/* Solid Paper Ledger Container */}
        <div className="flex-1 flex flex-col bg-paper text-ink overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-black/[0.04] border-b border-black/10 flex items-start justify-between">
            <div className="min-w-0 pr-4 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  Commercial Dossier
                </span>
                <span className="font-mono text-[10px] font-bold text-brass bg-brass-dim px-2 py-0.5 rounded border border-brass/30">
                  ID: {profile?.customer_id || profile?.id || "-"}
                </span>
                {profile?.business_type && (
                  <span className="font-mono text-[10px] text-ink-muted bg-black/5 px-2 py-0.5 rounded border border-black/10 truncate max-w-[220px]">
                    {profile.business_type}
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl font-bold text-ink truncate mt-0.5">
                {profile?.name || "Customer Account"}
              </h2>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] font-mono text-ink-muted">
                {profile?.phone && (
                  <span className="flex items-center space-x-1 select-text">
                    <Phone className="w-3 h-3 text-ink-subtle" />
                    <span>{profile.phone}</span>
                  </span>
                )}
                {profile?.email && (
                  <span className="flex items-center space-x-1 select-text">
                    <Mail className="w-3 h-3 text-ink-subtle" />
                    <span>{profile.email}</span>
                  </span>
                )}
                {profile?.address && (
                  <span
                    className="flex items-center space-x-1 truncate max-w-[220px] select-text"
                    title={profile.address}
                  >
                    <MapPin className="w-3 h-3 text-ink-subtle flex-shrink-0" />
                    <span className="truncate">{profile.address}</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setDossierOpen(false)}
              className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors flex-shrink-0"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Risk Alert Banner (if connected entities are delinquent) */}
          {connectedRisks && connectedRisks.length > 0 && (
            <div className="px-4 py-2.5 bg-vermilion-dim border-b border-vermilion/30 flex items-start space-x-2 text-xs font-mono text-vermilion">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-vermilion" />
              <div className="min-w-0">
                <span className="font-bold">
                  COLLUSION / DELINQUENT RING DETECTED:
                </span>
                <p className="text-[11px] text-ink font-sans mt-0.5">
                  Connected to {connectedRisks.length} account(s) with shared
                  contacts (
                  {connectedRisks.map((cr) => cr.connected_customer).join(", ")}
                  ). Total ring overdue:{" "}
                  <span className="font-bold text-vermilion">
                    {formatMoney(
                      connectedRisks.reduce((sum, cr) => sum + (cr.overdue_amount || 0), 0),
                      true
                    )}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Computed Cypher Trace Bar */}
          <TraceBar
            queries={lastChatResponse?.cypher_queries}
            latencyMs={lastChatResponse?.latency_ms}
            evidenceNodeCount={lastChatResponse?.evidence_nodes?.length}
          />

          {/* Stamped Verdict if evaluated, or status badge */}
          {lastChatResponse && (
            <VerdictStamp
              verdict={lastChatResponse.recommendation}
              confidence={lastChatResponse.confidence}
              riskScore={lastChatResponse.risk_score ?? profile?.risk_score}
            />
          )}

          {/* Dossier Navigation Tabs */}
          <div className="flex border-b border-black/10 bg-black/[0.02] px-3 pt-2 space-x-1 font-mono text-xs">
            <button
              onClick={() => setActiveDossierTab("overview")}
              className={`px-3 py-1.5 rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                activeDossierTab === "overview"
                  ? "border-ink text-ink font-bold bg-white/70 shadow-sm"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Rationale</span>
            </button>

            <button
              onClick={() => setActiveDossierTab("history")}
              className={`px-3 py-1.5 rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                activeDossierTab === "history"
                  ? "border-ink text-ink font-bold bg-white/70 shadow-sm"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>History ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveDossierTab("cypher")}
              className={`px-3 py-1.5 rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                activeDossierTab === "cypher"
                  ? "border-ink text-ink font-bold bg-white/70 shadow-sm"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>
                Cypher ({lastChatResponse?.cypher_queries?.length || 0})
              </span>
            </button>

            <button
              onClick={() => setActiveDossierTab("journal")}
              className={`px-3 py-1.5 rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                activeDossierTab === "journal"
                  ? "border-ink text-ink font-bold bg-white/70 shadow-sm"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Journal</span>
            </button>
          </div>

          {/* Dossier Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {isLoadingCustomerData ? (
              <div className="p-12 text-center text-xs font-mono text-ink-muted">
                Traversing account relationships in FalkorDB...
              </div>
            ) : activeDossierTab === "overview" ? (
              <>
                {lastChatResponse && (
                  <RationaleView
                    explanation={lastChatResponse.business_explanation}
                    evidenceNodes={lastChatResponse.evidence_nodes}
                  />
                )}

                {lastChatResponse?.recommended_conditions && (
                  <CovenantsList
                    conditions={lastChatResponse.recommended_conditions}
                  />
                )}

                <FinancialGrid profile={profile} />
              </>
            ) : activeDossierTab === "history" ? (
              <HistoryTable history={history} />
            ) : activeDossierTab === "cypher" ? (
              <CypherViewer queries={lastChatResponse?.cypher_queries || []} />
            ) : (
              <DecisionsJournal decisions={decisions} />
            )}
          </div>

          {/* Operational Action Bar at base */}
          <DossierActions />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

import React from "react";
import { CustomerDecisionsResponse } from "@/api/types";
import { formatDate } from "@/lib/format";
import { History, Brain, CheckSquare, MessageCircle } from "lucide-react";

interface DecisionsJournalProps {
  decisions: CustomerDecisionsResponse | null;
}

export const DecisionsJournal: React.FC<DecisionsJournalProps> = ({
  decisions,
}) => {
  if (!decisions) {
    return (
      <div className="p-4 rounded-lg bg-black/[0.02] border border-black/5 text-ink-muted text-xs font-mono">
        No cross-session memory or decisions loaded.
      </div>
    );
  }

  const { decisions: decList = [], memories = [], tasks = [] } = decisions;

  return (
    <div className="space-y-4">
      {/* Past Decisions & Owner Overrides */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
          <History className="w-3.5 h-3.5 text-brass" />
          <span className="uppercase tracking-wider font-semibold">
            Prior Agent Decisions & Overrides
          </span>
        </div>

        {decList.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/60 border border-black/5 text-xs font-mono text-ink-muted">
            No previous credit decisions recorded for this account.
          </div>
        ) : (
          <div className="space-y-2">
            {decList.map((d: any, idx: number) => {
              const decId = d.id || d.decision_id || `dec-${idx}`;
              const dateVal = d.decision_date || d.created_at;

              return (
                <div
                  key={decId}
                  className="p-3 rounded-lg bg-white/80 border border-black/10 shadow-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-ink uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/5 border border-black/10">
                        {d.recommendation || "EVALUATED"}
                      </span>
                      <span className="font-bold text-brass bg-brass-dim px-1.5 py-0.2 rounded border border-brass/25 text-[10px]">
                        ID: {decId}
                      </span>
                    </div>
                    <span className="text-ink-muted text-[10px]">
                      {formatDate(dateVal)}
                    </span>
                  </div>

                  <p className="text-xs font-sans text-ink leading-snug">
                    {d.question || d.rationale || "-"}
                  </p>

                  {d.user_feedback && (
                    <div className="mt-1 pt-1 border-t border-black/5 text-[11px] font-mono text-brass flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>Owner Feedback: {d.user_feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cross-Session Graph Memories */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
          <Brain className="w-3.5 h-3.5 text-dollar-green" />
          <span className="uppercase tracking-wider font-semibold">
            Cross-Session Memories ({memories.length})
          </span>
        </div>

        {memories.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/60 border border-black/5 text-xs font-mono text-ink-muted">
            No memories saved yet for this customer.
          </div>
        ) : (
          <div className="space-y-1.5">
            {memories.map((m: any, idx: number) => {
              const memId = m.id || m.memory_id || `mem-${idx}`;

              return (
                <div
                  key={memId}
                  className="p-2.5 rounded-lg bg-white/80 border border-black/5 shadow-sm text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-dollar-green uppercase">
                        {m.memory_type || "FACT"}
                      </span>
                      <span className="text-brass font-bold text-[9px] bg-brass-dim px-1 rounded border border-brass/20">
                        {memId}
                      </span>
                    </div>
                    <span className="text-ink-muted">
                      Importance {m.importance ?? 5}/10
                    </span>
                  </div>
                  <p className="font-sans text-ink leading-tight">
                    {m.content || "-"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Tasks */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
          <CheckSquare className="w-3.5 h-3.5 text-brass" />
          <span className="uppercase tracking-wider font-semibold">
            Follow-Up Action Tasks ({tasks.length})
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/60 border border-black/5 text-xs font-mono text-ink-muted">
            No pending operational tasks.
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((t: any, idx: number) => {
              const taskId = t.id || t.task_id || `task-${idx}`;

              return (
                <div
                  key={taskId}
                  className="p-2.5 rounded-lg bg-white/80 border border-black/5 shadow-sm text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-brass font-bold text-[10px] font-mono bg-brass-dim px-1.5 py-0.2 rounded border border-brass/25">
                        {taskId}
                      </span>
                      <h5 className="font-semibold text-ink truncate">
                        {t.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {t.description}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 text-ink border border-black/10 flex-shrink-0">
                    {t.status || "PENDING"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

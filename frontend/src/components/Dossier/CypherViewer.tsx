import React, { useState } from 'react';
import { CypherQueryTrace } from '@/api/types';
import { CypherHighlight } from '@/lib/cypherHighlight';
import { ChevronDown, ChevronRight, Copy, Check, Terminal } from 'lucide-react';

interface CypherViewerProps {
  queries: CypherQueryTrace[];
}

export const CypherViewer: React.FC<CypherViewerProps> = ({ queries }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!queries || queries.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-black/[0.02] border border-black/5 text-ink-muted text-xs font-mono">
        No Cypher queries logged for current view.
      </div>
    );
  }

  const handleCopy = (query: string, index: number) => {
    navigator.clipboard.writeText(query);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-brass" />
          <span className="uppercase tracking-wider font-semibold">Cypher Traceability Trail</span>
        </div>
        <span>{queries.length} queries executed</span>
      </div>

      <div className="space-y-2">
        {queries.map((q, idx) => {
          const isExpanded = expandedIndex === idx;
          const isCopied = copiedIndex === idx;

          return (
            <div
              key={idx}
              className="rounded-lg border border-black/10 overflow-hidden bg-[#101915] shadow-sm"
            >
              {/* Header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="px-3 py-2 bg-black/40 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors select-none"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-brass flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  )}
                  <span className="font-mono text-xs text-chalk truncate font-medium">
                    {q.description || `Query #${idx + 1}`}
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {q.latency_ms !== undefined && (
                    <span className="text-[10px] font-mono text-muted">{q.latency_ms}ms</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(q.query, idx);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-muted hover:text-chalk transition-colors"
                    title="Copy Cypher query"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-dollar-green" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              {isExpanded && (
                <div className="p-3 border-t border-white/5 overflow-x-auto">
                  <CypherHighlight code={q.query} />
                  {q.params && Object.keys(q.params).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[10px] text-muted">
                      <span className="text-brass uppercase block mb-0.5">Parameters:</span>
                      <pre className="text-chalk/80">{JSON.stringify(q.params, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

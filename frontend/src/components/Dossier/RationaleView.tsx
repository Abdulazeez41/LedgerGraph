import React from 'react';
import { useStore } from '@/store/useStore';
import { Compass } from 'lucide-react';

interface RationaleViewProps {
  explanation: string;
  evidenceNodes?: any[];
}

function getEvidenceNodeDisplay(node: any): { id: string; displayName: string; label?: string } {
  if (typeof node === 'string') {
    return { id: node, displayName: node };
  }
  if (!node || typeof node !== 'object') {
    return { id: String(node || ''), displayName: String(node || '') };
  }

  const id = String(node.id || node.name || node.invoice_number || node.title || 'node');
  const label = node.label ? String(node.label) : undefined;

  let displayName = '';
  if (node.name) {
    displayName = String(node.name);
  } else if (node.invoice_number) {
    displayName = `${node.invoice_number}${node.status ? ` (${node.status})` : ''}`;
  } else if (node.reason) {
    displayName = `Dispute: ${node.reason}`;
  } else if (node.recommendation) {
    displayName = `Decision: ${node.recommendation}`;
  } else if (node.content) {
    const text = String(node.content);
    displayName = `${node.type || 'Memory'}: ${text.length > 28 ? text.slice(0, 28) + '...' : text}`;
  } else if (node.title) {
    displayName = String(node.title);
  } else if (node.amount !== undefined) {
    displayName = `${label || 'Payment'}: ${node.amount}`;
  } else {
    displayName = id || label || 'Evidence Node';
  }

  return { id, displayName, label };
}

export const RationaleView: React.FC<RationaleViewProps> = ({
  explanation,
  evidenceNodes = [],
}) => {
  const { setFocusedNode } = useStore();

  // Parse [e1], [e2] or [NodeName] evidence markers in text
  const renderTextWithEvidenceChips = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[e\d+\]|\[.*?\])/g);

    return parts.map((part, idx) => {
      const match = part.match(/^\[(.*?)\]$/);
      if (match) {
        const marker = match[1];
        let targetId = marker;
        const eIndexMatch = marker.match(/^e(\d+)$/);
        if (eIndexMatch) {
          const index = parseInt(eIndexMatch[1], 10) - 1;
          if (evidenceNodes[index]) {
            const parsed = getEvidenceNodeDisplay(evidenceNodes[index]);
            targetId = parsed.id;
          }
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => setFocusedNode(targetId)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-medium bg-brass-dim text-brass border border-brass/40 hover:bg-brass hover:text-white transition-colors"
            title={`Focus 3D constellation on ${targetId}`}
          >
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
        <span className="uppercase tracking-wider font-semibold">Reasoning & Business Explanation</span>
        <span className="text-[10px] text-ink-subtle">Ground Truth from FalkorDB</span>
      </div>

      <div className="font-sans text-sm leading-relaxed text-ink whitespace-pre-line bg-black/[0.02] p-4 rounded-lg border border-black/5">
        {renderTextWithEvidenceChips(
          explanation || 'Select an account from the ledger rail or submit an inquiry to evaluate credit.'
        )}
      </div>

      {evidenceNodes.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] font-mono uppercase text-ink-muted block mb-1.5 flex items-center space-x-1">
            <Compass className="w-3 h-3 text-brass" />
            <span>Active Evidence Nodes Traversed:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {evidenceNodes.map((rawNode, idx) => {
              const { id, displayName, label } = getEvidenceNodeDisplay(rawNode);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFocusedNode(id)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/60 hover:bg-white text-ink border border-black/10 hover:border-brass transition-all flex items-center space-x-1.5 shadow-sm max-w-full"
                  title={`Focus node ${id}`}
                >
                  <span className="text-brass font-bold">[{idx + 1}]</span>
                  {label && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 text-ink-muted">
                      {label}
                    </span>
                  )}
                  <span className="truncate max-w-[200px]">{displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

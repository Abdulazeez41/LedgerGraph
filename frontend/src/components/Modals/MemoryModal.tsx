import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/api/client';
import { X, Brain, Loader2 } from 'lucide-react';

export const MemoryModal: React.FC = () => {
  const { activeModal, modalData, closeModal, selectCustomer } = useStore();
  const [memoryType, setMemoryType] = useState('POLICY');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'memory') return null;

  const customerName = modalData?.customerName || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.createMemory({
        customer_name: customerName,
        memory_type: memoryType,
        content: content.trim(),
        importance: Number(importance),
      });
      alert('Graph memory saved and linked to customer.');
      await selectCustomer(customerName, true);
      closeModal();
    } catch (err: any) {
      alert(`Failed to save memory: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg rounded-xl glass-panel-elevated bg-paper text-ink p-6 border border-white/20 shadow-glass-lg space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              Agent Knowledge Store
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Add Graph Memory: {customerName}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <label className="text-[10px] uppercase text-ink-muted block mb-1">Memory Type</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                className="w-full bg-white text-ink border border-black/15 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-brass"
              >
                <option value="POLICY">POLICY (Trading rules / restrictions)</option>
                <option value="PREFERENCE">PREFERENCE (Commercial quirks)</option>
                <option value="FACT">FACT (Verified field observation)</option>
                <option value="OUTCOME">OUTCOME (Past resolution result)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-ink-muted block mb-1">
                Importance Level (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full bg-white text-ink border border-black/15 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-brass"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Memory Content & Empirical Knowledge
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. BrightMart never accepts deliveries without prior packing slip stamp from procurement desk."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-brass"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/10">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg hover:bg-black/5 font-mono text-xs text-ink-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 rounded-lg bg-dollar-green text-white font-mono text-xs font-semibold hover:bg-dollar-green-light transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              <span>Save to Agent Memory</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

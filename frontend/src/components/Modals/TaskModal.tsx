import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/api/client';
import { X, CheckSquare, Loader2 } from 'lucide-react';

export const TaskModal: React.FC = () => {
  const { activeModal, modalData, closeModal, selectCustomer } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'task') return null;

  const customerName = modalData?.customerName || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.createTask({
        customer_name: customerName,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || undefined,
      });
      alert('Action task created and linked in FalkorDB graph.');
      await selectCustomer(customerName, true);
      closeModal();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
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
              Operational Action Desk
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Create Follow-Up Task: {customerName}
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
          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inspect warehouse collateral / Request bank guarantee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-brass"
            />
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Description & Protocol Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions for commercial field officers or accounts team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-brass"
            />
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-brass"
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
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 rounded-lg bg-brass text-white font-mono text-xs font-semibold hover:bg-brass-light transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
              <span>Create Task Node</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

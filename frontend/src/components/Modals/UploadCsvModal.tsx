import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/api/client';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const UploadCsvModal: React.FC = () => {
  const { activeModal, closeModal, fetchCustomers, fetchHealth } = useStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (activeModal !== 'upload') return null;

  const validFiles = [
    'customers.csv',
    'orders.csv',
    'invoices.csv',
    'payments.csv',
    'disputes.csv',
    'suppliers.csv',
    'products.csv',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStatusMessage(null);
      setIsError(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setStatusMessage('Uploading and re-ingesting into FalkorDB...');
    setIsError(false);

    try {
      const res = await apiClient.uploadCsv(selectedFile);
      setStatusMessage(res.message || 'Dataset imported successfully!');
      setIsError(false);
      await fetchHealth();
      await fetchCustomers();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg rounded-xl glass-panel-elevated bg-paper text-ink p-6 border border-white/20 shadow-glass-lg space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              Demo Data Ingestion Desk
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Upload Ledger CSV
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 font-sans text-xs">
          <p className="text-ink-muted leading-relaxed">
            Select an updated CSV file to re-ingest into FalkorDB. Allowed filenames:{' '}
            <span className="font-mono text-ink font-medium">{validFiles.join(', ')}</span>.
          </p>

          <div className="border-2 border-dashed border-black/15 rounded-xl p-6 text-center hover:border-brass transition-colors bg-white/40">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <UploadCloud className="w-8 h-8 text-brass" />
              <span className="font-mono text-xs font-semibold text-ink">
                {selectedFile ? selectedFile.name : 'Click to select CSV file'}
              </span>
              <span className="text-[11px] text-ink-muted">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'or drag and drop here'}
              </span>
            </label>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg flex items-center space-x-2 text-xs font-mono ${
                isError
                  ? 'bg-vermilion-dim text-vermilion border border-vermilion/30'
                  : 'bg-dollar-green-dim text-dollar-green border border-dollar-green/30'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="leading-tight">{statusMessage}</span>
            </div>
          )}
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
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            className="px-4 py-2 rounded-lg bg-brass text-white font-mono text-xs font-semibold hover:bg-brass-light transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>Upload & Ingest to Graph</span>
          </button>
        </div>
      </div>
    </div>
  );
};

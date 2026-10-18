import React, { useEffect, Suspense, lazy } from 'react';
import { useStore } from '@/store/useStore';
import { GrainOverlay } from '@/components/Shell/GrainOverlay';
import { LedgerStrip } from '@/components/Shell/LedgerStrip';
import { TheBook } from '@/components/Rail/TheBook';
import { TheDossier } from '@/components/Dossier/TheDossier';
import { QuestionBar } from '@/components/Stage/QuestionBar';
import { OverrideModal } from '@/components/Modals/OverrideModal';
import { ReminderModal } from '@/components/Modals/ReminderModal';
import { TaskModal } from '@/components/Modals/TaskModal';
import { MemoryModal } from '@/components/Modals/MemoryModal';
import { UploadCsvModal } from '@/components/Modals/UploadCsvModal';
import { TranscriptModal } from '@/components/Modals/TranscriptModal';

// Lazy-load 3D canvas so the rail, inputs, and dossier are usable immediately
const GraphCanvas = lazy(() => import('@/three/GraphCanvas'));

export const App: React.FC = () => {
  const {
    fetchHealth,
    fetchCustomers,
    customers,
    selectedCustomerName,
    selectCustomer,
    closeModal,
    activeModal,
    setDossierOpen,
  } = useStore();

  // Load initial graph health and customers on mount
  useEffect(() => {
    fetchHealth();
    fetchCustomers();
  }, [fetchHealth, fetchCustomers]);

  // Pre-select first customer or BrightMart if available to populate 3D constellation
  useEffect(() => {
    if (!selectedCustomerName && customers.length > 0) {
      const brightMart = customers.find((c) => c.name.includes('BrightMart'));
      const defaultTarget = brightMart ? brightMart.name : customers[0].name;
      selectCustomer(defaultTarget, false);
    }
  }, [customers, selectedCustomerName, selectCustomer]);

  // Global keybindings (Escape closes modal or dossier)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          closeModal();
        } else {
          setDossierOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal, setDossierOpen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stage select-none font-sans">
      {/* Subtle film grain stage texture */}
      <GrainOverlay />

      {/* 3D Graph Constellation Lazy-Loaded Canvas */}
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
            Calibrating graph optics...
          </div>
        }
      >
        <GraphCanvas />
      </Suspense>

      {/* Top Floating Glass Instrument (LedgerStrip) */}
      <LedgerStrip />

      {/* Left Glass Rail (TheBook) */}
      <TheBook />

      {/* Right Sliding Frame (TheDossier) */}
      <TheDossier />

      {/* Bottom Floating Glass Input (QuestionBar) */}
      <QuestionBar />

      {/* Interactive Modals */}
      <OverrideModal />
      <ReminderModal />
      <TaskModal />
      <MemoryModal />
      <UploadCsvModal />
      <TranscriptModal />
    </div>
  );
};

export default App;

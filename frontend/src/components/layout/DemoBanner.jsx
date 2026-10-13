import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Database, ArrowRight, X } from 'lucide-react';

export function DemoBanner() {
  const { isDemoMode, setActiveView } = useCrm();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isDemoMode || isDismissed) {
    return null;
  }

  return (
    <aside aria-label="Demo mode notice" className="bg-amber-50/90 border-b border-amber-200/90 px-4 py-2.5 text-xs text-amber-900 sticky top-0 z-20 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-amber-200/90 text-amber-900 border border-amber-300">
            <Database className="w-3 h-3" />
            DEMO MODE
          </span>
          <span className="text-amber-800 font-medium">
            Active dataset is populated with realistic seeded customers & orders. Live WooCommerce synchronization requires credentials in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px] text-amber-950">backend/.env</code>.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('integration')}
            className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2 hover:no-underline cursor-pointer"
          >
            Configure Live Store
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:text-amber-900 p-0.5 rounded transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

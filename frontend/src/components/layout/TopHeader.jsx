import React from 'react';
import { useCrm } from '../../context/CrmContext';
import { RefreshCw, Plus, X, Info, CheckCircle2 } from 'lucide-react';

export function TopHeader() {
  const {
    activeView,
    isSyncing,
    syncResult,
    clearSyncResult,
    triggerSync,
    openNewTaskModal,
  } = useCrm();

  const getTitleAndSubtitle = () => {
    switch (activeView) {
      case 'dashboard':
        return {
          title: 'CRM Overview',
          subtitle: 'Real-time customer metrics, revenue tracking and high-priority action items',
        };
      case 'customers':
        return {
          title: 'Customer Directory',
          subtitle: 'Search and inspect customer profiles, billing addresses, and order history',
        };
      case 'orders':
        return {
          title: 'Orders Management',
          subtitle: 'Filter and inspect e-commerce transactions, line items, and fulfillment statuses',
        };
      case 'followups':
        return {
          title: 'Customer Follow-up Center',
          subtitle: 'Actionable rule-based retention alerts and interactive task tracking',
        };
      default:
        return {
          title: 'CustomerHub CRM',
          subtitle: 'E-commerce customer relationship management',
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle();

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/90">
      <header className="px-8 py-4.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* New Follow-up Quick Action */}
          <button
            type="button"
            onClick={() => openNewTaskModal()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>New Follow-up</span>
          </button>

          {/* Sync Now Action */}
          <button
            type="button"
            onClick={triggerSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-2xs cursor-pointer ${
              isSyncing
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
            }`}
            title="Trigger synchronization from WooCommerce API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </header>

      {/* Sync Response Banner (when Sync Now is triggered) */}
      {syncResult && (
        <aside aria-label="Sync result notice" className="px-8 py-3 bg-slate-50 border-t border-slate-150 flex items-start justify-between gap-4 text-xs animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {syncResult.success ? 'Store Sync Completed' : 'Sync Request Response'}
                </span>
                {syncResult.syncedAt && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatTimestamp(syncResult.syncedAt)}
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-normal max-w-3xl">
                {syncResult.message}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-0.5">
                <span>Customers: <strong className="text-slate-700">{syncResult.customerCount}</strong></span>
                <span>•</span>
                <span>Orders: <strong className="text-slate-700">{syncResult.orderCount}</strong></span>
                <span>•</span>
                <span>Duration: <strong className="text-slate-700">{syncResult.durationMs}ms</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearSyncResult}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}
    </div>
  );
}

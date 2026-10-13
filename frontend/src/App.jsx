import React from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { OrdersView } from './views/OrdersView';
import { FollowUpsView } from './views/FollowUpsView';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { NewTaskModal } from './components/followups/NewTaskModal';

function MainContent() {
  const { activeView } = useCrm();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'customers':
        return <CustomersView />;
      case 'orders':
        return <OrdersView />;
      case 'followups':
        return <FollowUpsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      {/* Top Header with title and Sync Now */}
      <TopHeader />

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {renderView()}
      </main>

      {/* Subtle, honest dataset footer */}
      <footer className="px-8 py-4 border-t border-slate-200/60 max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">CustomerHub CRM</span>
          <span>•</span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/80"
            title="Running in sample dataset mode. Live synchronization requires WooCommerce API credentials in backend/.env"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Sample dataset
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Populated with seeded CRM records. Live store sync requires WooCommerce credentials in backend/.env.
        </p>
      </footer>

      {/* Slide-over Modals */}
      <CustomerDetailModal />
      <OrderDetailModal />
      <NewTaskModal />
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
        <Sidebar />
        <MainContent />
      </div>
    </CrmProvider>
  );
}

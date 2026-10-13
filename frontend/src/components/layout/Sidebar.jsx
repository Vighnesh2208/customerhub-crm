import React from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CheckSquare,
  Layers
} from 'lucide-react';

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    customers,
    orders,
    followUpTasks,
  } = useCrm();

  const pendingTasksCount = followUpTasks.filter(t => t.status !== 'completed').length;
  const pendingOrdersCount = orders.filter(o => ['pending', 'processing'].includes(o.status.toLowerCase())).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: customers.length ? String(customers.length) : null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: orders.length ? String(orders.length) : null,
      subBadge: pendingOrdersCount > 0 ? `${pendingOrdersCount} pending` : null,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  ];

  return (
    <aside aria-label="Sidebar navigation" className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand & App Info */}
      <div className="p-5 border-b border-slate-150">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">CustomerHub</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none">CRM</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">E-Commerce Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav aria-label="Main menu" className="flex-1 p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.subBadge && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                    {item.subBadge}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

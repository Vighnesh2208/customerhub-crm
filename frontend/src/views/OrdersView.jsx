import React, { useState, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  ShoppingBag,
  Search,
  RotateCcw,
  X
} from 'lucide-react';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import { TableSkeletonRows } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function OrdersView() {
  const {
    orders,
    ordersLoading,
    ordersError,
    fetchOrders,
    openOrderModal,
    openCustomerModal,
  } = useCrm();

  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Status Tab options with dynamic counts
  const statusTabs = useMemo(() => {
    const counts = {
      all: orders.length,
      completed: 0,
      processing: 0,
      pending: 0,
      'on-hold': 0,
      cancelled: 0,
    };

    orders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;
    });

    return [
      { id: 'all', label: 'All Orders', count: counts.all },
      { id: 'completed', label: 'Completed', count: counts.completed },
      { id: 'processing', label: 'Processing', count: counts.processing },
      { id: 'pending', label: 'Pending', count: counts.pending },
      { id: 'on-hold', label: 'On Hold', count: counts['on-hold'] },
      { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    ];
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeStatusTab !== 'all') {
        if ((order.status || '').toLowerCase() !== activeStatusTab) {
          return false;
        }
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const orderIdStr = String(order.id);
        const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.toLowerCase();
        const email = (order.billing?.email || '').toLowerCase();
        const items = (order.line_items || []).map(li => li.name.toLowerCase()).join(' ');

        if (
          !orderIdStr.includes(q) &&
          !customerName.includes(q) &&
          !email.includes(q) &&
          !items.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeStatusTab, searchTerm]);

  // Aggregate stats for current view
  const aggregateStats = useMemo(() => {
    const totalCount = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);
    return { totalCount, totalAmount };
  }, [filteredOrders]);

  const formatCurrency = (amt, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(amt || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Status Filter Tabs */}
      <div className="border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {statusTabs.map(tab => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Aggregated Filter Volume */}
        <div className="text-xs text-slate-500 pb-2">
          <span>Total in filter: </span>
          <strong className="text-slate-900 font-bold">{formatCurrency(aggregateStats.totalAmount)}</strong>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer, email, or item name..."
            className="w-full pl-9 pr-9 py-2 text-xs text-slate-800 bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredOrders.length}</strong> orders
          </span>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh orders from store"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {ordersError && (
        <ErrorState
          title="Failed to load orders"
          message={ordersError}
          onRetry={() => fetchOrders()}
        />
      )}

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Date Placed</th>
                <th className="px-4 py-3.5">Purchased Items</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordersLoading ? (
                <TableSkeletonRows rows={6} cols={8} />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={ShoppingBag}
                      title="No orders found"
                      description={`No transactions found in "${activeStatusTab}" status matching your search.`}
                      actionLabel="Clear Filters"
                      onAction={() => {
                        setActiveStatusTab('all');
                        setSearchTerm('');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => openOrderModal(order.id)}
                  >
                    {/* Order ID */}
                    <td className="px-5 py-3.5">
                      <span className="font-bold font-mono text-indigo-700 group-hover:underline block leading-tight">
                        #{order.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {order.order_key ? order.order_key.slice(0, 16) : 'WooCommerce'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5" onClick={(e) => {
                      if (order.customer_id) {
                        e.stopPropagation();
                        openCustomerModal(order.customer_id);
                      }
                    }}>
                      <div className="space-y-0.5">
                        <span className={`font-semibold text-slate-900 block leading-tight ${order.customer_id ? 'hover:text-indigo-600 hover:underline' : ''}`}>
                          {order.billing?.first_name} {order.billing?.last_name}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                          {order.billing?.email}
                        </span>
                      </div>
                    </td>

                    {/* Date Placed */}
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="block font-medium text-slate-800">{formatDate(order.date_created)}</span>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="max-w-[200px] truncate">
                        <span className="font-medium text-slate-800">
                          {order.line_items?.[0] ? `${order.line_items[0].quantity}x ${order.line_items[0].name}` : 'No items recorded'}
                        </span>
                        {order.line_items?.length > 1 && (
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            +{order.line_items.length - 1} more item(s)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="block font-medium text-slate-800">
                        {order.payment_method_title || order.payment_method || 'Online'}
                      </span>
                      {order.transaction_id && (
                        <span className="text-[10px] font-mono text-slate-400 truncate block max-w-[100px]">
                          {order.transaction_id}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(order.total, order.currency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openOrderModal(order.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

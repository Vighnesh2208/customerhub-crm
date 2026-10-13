import React, { useEffect, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import api from '../../api/client';
import { OrderStatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import {
  X,
  ShoppingBag,
  MapPin,
  Plus,
  Truck,
  ArrowRight
} from 'lucide-react';

export function OrderDetailModal() {
  const {
    activeOrderModalId,
    closeOrderModal,
    openCustomerModal,
    openNewTaskModal,
  } = useCrm();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeOrderModalId) {
      return;
    }

    let isCurrent = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getOrderById(activeOrderModalId);
        if (!isCurrent) return;
        setOrder(res.data.data || res.data);
      } catch (err) {
        if (!isCurrent) return;
        setError(err.message || 'Failed to load order details');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isCurrent = false;
    };
  }, [activeOrderModalId]);

  if (!activeOrderModalId) return null;

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(amount || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-2xs flex justify-end">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Order #{activeOrderModalId}
                </h2>
                {order && <OrderStatusBadge status={order.status} />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">WooCommerce Order Details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (order) {
                  openNewTaskModal({
                    id: order.customer_id,
                    first_name: order.billing?.first_name || 'Customer',
                    last_name: order.billing?.last_name || '',
                    email: order.billing?.email || '',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Follow-up Task
            </button>
            <button
              type="button"
              onClick={closeOrderModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && <LoadingSpinner message="Fetching order details and items..." />}

          {error && (
            <ErrorState
              title="Could not load order"
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
              }}
            />
          )}

          {!loading && !error && order && (
            <>
              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/70">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Date Placed</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{formatDate(order.date_created)}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/70">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Payment Method</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{order.payment_method_title || order.payment_method || 'Online'}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/70">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Transaction ID</span>
                  <span className="text-xs font-mono font-medium text-slate-700 mt-0.5 block truncate" title={order.transaction_id}>
                    {order.transaction_id || 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200/80 bg-indigo-50/50">
                  <span className="text-[11px] font-medium text-indigo-700 block uppercase tracking-wider">Grand Total</span>
                  <span className="text-sm font-bold text-indigo-900 mt-0.5 block">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>
              </div>

              {/* Linked Customer Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {order.billing?.first_name?.[0] || 'C'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {order.billing?.first_name} {order.billing?.last_name}
                    </h4>
                    <p className="text-xs text-slate-500">{order.billing?.email} • {order.billing?.phone || 'No phone'}</p>
                    {order.billing?.company && (
                      <p className="text-[11px] text-slate-400 font-medium">{order.billing.company}</p>
                    )}
                  </div>
                </div>

                {order.customer_id ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeOrderModal();
                      openCustomerModal(order.customer_id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    View Customer Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Guest Checkout</span>
                )}
              </div>

              {/* Line items Table */}
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items ({order.line_items?.length || 0})</span>
                  <span className="text-[11px] text-slate-500 font-mono">Currency: {order.currency || 'USD'}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.line_items?.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-semibold text-slate-900">{item.name}</h5>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {item.sku && <span>SKU: <code className="font-mono text-slate-600">{item.sku}</code></span>}
                          <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                          <span>Unit Price: {formatCurrency(item.price || (item.total / item.quantity), order.currency)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 block">
                          {formatCurrency(item.total, order.currency)}
                        </span>
                        {item.total_tax && parseFloat(item.total_tax) > 0 && (
                          <span className="text-[11px] text-slate-400 block">
                            Tax: {formatCurrency(item.total_tax, order.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary Breakdown */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Discount Total:</span>
                    <span>{formatCurrency(order.discount_total || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Total:</span>
                    <span>{formatCurrency(order.shipping_total || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (Cart + Shipping):</span>
                    <span>{formatCurrency(order.total_tax || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-indigo-700">{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Billing and Shipping Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-1.5 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Billing Address
                  </h5>
                  <p className="font-semibold text-slate-800">{order.billing?.first_name} {order.billing?.last_name}</p>
                  <p>{order.billing?.address_1} {order.billing?.address_2}</p>
                  <p>{order.billing?.city}, {order.billing?.state} {order.billing?.postcode}</p>
                  <p className="text-slate-500">{order.billing?.country}</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-1.5 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    Shipping Address
                  </h5>
                  <p className="font-semibold text-slate-800">{order.shipping?.first_name} {order.shipping?.last_name}</p>
                  <p>{order.shipping?.address_1} {order.shipping?.address_2}</p>
                  <p>{order.shipping?.city}, {order.shipping?.state} {order.shipping?.postcode}</p>
                  <p className="text-slate-500">{order.shipping?.country}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

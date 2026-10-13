import React, { useEffect, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import api from '../../api/client';
import { OrderStatusBadge, CustomerTierBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Plus,
  ChevronRight,
  Tag,
  Copy,
  Check
} from 'lucide-react';

export function CustomerDetailModal() {
  const {
    activeCustomerModalId,
    closeCustomerModal,
    openOrderModal,
    openNewTaskModal,
  } = useCrm();

  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!activeCustomerModalId) {
      return;
    }

    let isCurrent = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch specific customer by ID
        const res = await api.getCustomerById(activeCustomerModalId);
        if (!isCurrent) return;
        setCustomer(res.data.data || res.data);

        // Fetch customer's orders
        const ordersRes = await api.getOrders({ customer: activeCustomerModalId, perPage: 20 });
        if (!isCurrent) return;
        setCustomerOrders(ordersRes.data.orders || ordersRes.data.data || []);
      } catch (err) {
        if (!isCurrent) return;
        setError(err.message || 'Failed to load customer profile');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isCurrent = false;
    };
  }, [activeCustomerModalId]);

  if (!activeCustomerModalId) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const getTierFromMeta = (meta = []) => {
    const tierMeta = meta.find(m => m.key === 'crm_tier');
    return tierMeta?.value || (customer?.is_paying_customer ? 'Paying Customer' : 'Standard');
  };

  const getLeadSource = (meta = []) => {
    const srcMeta = meta.find(m => m.key === 'lead_source');
    return srcMeta?.value || 'Direct';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Customer Profile #{activeCustomerModalId}
              </h2>
              <p className="text-xs text-slate-500">WooCommerce Customer Record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (customer) openNewTaskModal(customer);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Follow-up Task
            </button>
            <button
              type="button"
              onClick={closeCustomerModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && <LoadingSpinner message="Fetching customer details and purchase history..." />}

          {error && (
            <ErrorState
              title="Could not load customer"
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
              }}
            />
          )}

          {!loading && !error && customer && (
            <>
              {/* Customer Hero Card */}
              <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={`${customer.first_name} ${customer.last_name}`}
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 shadow-2xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                        {customer.first_name?.[0] || 'C'}{customer.last_name?.[0] || ''}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {customer.first_name} {customer.last_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">@{customer.username || 'user'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <CustomerTierBadge tier={getTierFromMeta(customer.meta_data)} />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          Source: {getLeadSource(customer.meta_data)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Customer Since</span>
                    <span className="text-xs font-semibold text-slate-700">{formatDate(customer.date_created)}</span>
                  </div>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-150">
                    <div className="flex items-center gap-2 truncate text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email || 'No email provided'}</span>
                    </div>
                    {customer.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.email, 'email')}
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-150">
                    <div className="flex items-center gap-2 truncate text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.billing?.phone || 'No phone provided'}</span>
                    </div>
                    {customer.billing?.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.billing.phone, 'phone')}
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lifetime Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Orders</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block">{customer.orders_count || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">Lifetime Spend</span>
                  <span className="text-xl font-bold text-indigo-700 mt-0.5 block">{formatCurrency(customer.total_spent)}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">Average Order</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                    {formatCurrency(
                      (customer.orders_count && customer.total_spent)
                        ? (parseFloat(customer.total_spent) / customer.orders_count)
                        : 0
                    )}
                  </span>
                </div>
              </div>

              {/* Addresses section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Billing Address */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      Billing Address
                    </span>
                    {customer.billing?.company && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {customer.billing.company}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{customer.billing?.first_name} {customer.billing?.last_name}</p>
                    {customer.billing?.address_1 ? (
                      <>
                        <p>{customer.billing.address_1}</p>
                        {customer.billing.address_2 && <p>{customer.billing.address_2}</p>}
                        <p>{customer.billing.city}, {customer.billing.state} {customer.billing.postcode}</p>
                        <p className="text-slate-500">{customer.billing.country}</p>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">No billing address recorded</p>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                      Shipping Address
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{customer.shipping?.first_name} {customer.shipping?.last_name}</p>
                    {customer.shipping?.address_1 ? (
                      <>
                        <p>{customer.shipping.address_1}</p>
                        {customer.shipping.address_2 && <p>{customer.shipping.address_2}</p>}
                        <p>{customer.shipping.city}, {customer.shipping.state} {customer.shipping.postcode}</p>
                        <p className="text-slate-500">{customer.shipping.country}</p>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">Same as billing address</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">Purchase History ({customerOrders.length})</h4>
                  </div>
                  <span className="text-xs text-slate-500">Linked WooCommerce Orders</span>
                </div>

                {customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">No orders found for this customer.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden">
                    {customerOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          closeCustomerModal();
                          openOrderModal(order.id);
                        }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-700 font-mono group-hover:underline">
                              #{order.id}
                            </span>
                            <OrderStatusBadge status={order.status} />
                            <span className="text-[11px] text-slate-400">{formatDate(order.date_created)}</span>
                          </div>
                          <p className="text-xs text-slate-600 truncate max-w-sm">
                            {order.line_items?.map(li => `${li.quantity}x ${li.name}`).join(', ') || 'No item details'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(order.total)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

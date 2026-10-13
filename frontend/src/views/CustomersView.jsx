import React, { useState, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  X
} from 'lucide-react';
import { CustomerTierBadge } from '../components/common/StatusBadge';
import { TableSkeletonRows } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function CustomersView() {
  const {
    customers,
    customersLoading,
    customersError,
    fetchCustomers,
    openCustomerModal,
    openNewTaskModal,
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');

  // Trigger search on backend if desired, or client-side filter
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const company = (customer.billing?.company || '').toLowerCase();
        const username = (customer.username || '').toLowerCase();
        const phone = (customer.billing?.phone || '').toLowerCase();

        if (
          !fullName.includes(q) &&
          !email.includes(q) &&
          !company.includes(q) &&
          !username.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }

      // Role filter
      if (selectedRole !== 'all') {
        if ((customer.role || '').toLowerCase() !== selectedRole.toLowerCase()) {
          return false;
        }
      }

      // Tier filter
      if (selectedTier !== 'all') {
        const tierMeta = customer.meta_data?.find(m => m.key === 'crm_tier')?.value || '';
        if (selectedTier === 'vip') {
          if (!tierMeta.toLowerCase().includes('vip') && parseFloat(customer.total_spent || 0) < 1000) return false;
        } else if (selectedTier === 'paying') {
          if (!customer.is_paying_customer && customer.orders_count === 0) return false;
        }
      }

      return true;
    });
  }, [customers, searchTerm, selectedRole, selectedTier]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amt || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getTier = (customer) => {
    return customer.meta_data?.find(m => m.key === 'crm_tier')?.value || (customer.is_paying_customer ? 'Paying Customer' : 'Standard');
  };

  return (
    <div className="space-y-5">
      {/* Search and Filter Control Bar */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, email, company, username..."
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
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs text-slate-700 bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="administrator">Administrators</option>
            </select>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2 text-xs text-slate-700 bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="vip">VIP Accounts ($1K+)</option>
              <option value="paying">Paying Buyers</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredCustomers.length}</strong> of {customers.length}
          </span>
          <button
            type="button"
            onClick={() => fetchCustomers()}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh customer list"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error State */}
      {customersError && (
        <ErrorState
          title="Failed to load customer directory"
          message={customersError}
          onRetry={() => fetchCustomers()}
        />
      )}

      {/* Customers Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Company / Account</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">CRM Tier</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Lifetime Spend</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customersLoading ? (
                <TableSkeletonRows rows={6} cols={7} />
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No customers match your search"
                      description={`No records found matching "${searchTerm}". Try resetting your filter keywords.`}
                      actionLabel="Reset Search Filters"
                      onAction={() => {
                        setSearchTerm('');
                        setSelectedRole('all');
                        setSelectedTier('all');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => openCustomerModal(cust.id)}
                  >
                    {/* Customer Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cust.avatar_url ? (
                          <img
                            src={cust.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {cust.first_name?.[0] || 'C'}{cust.last_name?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block leading-tight">
                            {cust.first_name} {cust.last_name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ID #{cust.id} • @{cust.username || 'user'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3.5 text-slate-600">
                      {cust.billing?.company ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{cust.billing.company}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Individual</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                        {cust.billing?.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{cust.billing.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* CRM Tier */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <CustomerTierBadge tier={getTier(cust)} />
                        <span className="text-[10px] text-slate-400 block">
                          Joined {formatDate(cust.date_created)}
                        </span>
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900 inline-flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        {cust.orders_count || 0}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(cust.total_spent)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openNewTaskModal(cust)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Schedule follow-up"
                        >
                          Follow-up
                        </button>
                        <button
                          type="button"
                          onClick={() => openCustomerModal(cust.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View customer profile"
                        >
                          <ChevronRight className="w-4 h-4" />
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

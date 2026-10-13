import React, { useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { OrderStatusBadge } from '../components/common/StatusBadge';

export function DashboardView() {
  const {
    customers,
    customersLoading,
    orders,
    ordersLoading,
    followUpTasks,
    toggleTaskComplete,
    openCustomerModal,
    openOrderModal,
    setActiveView,
  } = useCrm();

  // Financial and KPI calculations
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const payingCustomers = customers.filter(c => c.is_paying_customer || c.orders_count > 0).length;

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingOrders = orders.filter(o => ['pending', 'processing', 'on-hold'].includes(o.status.toLowerCase()));

    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    return {
      totalCustomers,
      payingCustomers,
      totalOrders,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      totalRevenue,
      pendingRevenue,
      avgOrderValue,
    };
  }, [customers, orders]);

  // Chart: Order Status Distribution
  const statusChartData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const s = o.status || 'other';
      counts[s] = (counts[s] || 0) + 1;
    });

    const colors = {
      completed: '#10b981', // emerald-500
      processing: '#3b82f6', // blue-500
      pending: '#f59e0b', // amber-500
      'on-hold': '#f97316', // orange-500
      cancelled: '#94a3b8', // slate-400
      refunded: '#a855f7', // purple-500
    };

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name.toLowerCase()] || '#64748b',
    }));
  }, [orders]);

  // Chart: Revenue Timeline (sorted by date)
  const revenueTrendData = useMemo(() => {
    if (!orders.length) return [];

    const grouped = {};
    orders.forEach(o => {
      const dateKey = o.date_created ? o.date_created.slice(0, 7) : '2026-01'; // YYYY-MM
      if (!grouped[dateKey]) {
        grouped[dateKey] = { revenue: 0, count: 0 };
      }
      grouped[dateKey].revenue += parseFloat(o.total || 0);
      grouped[dateKey].count += 1;
    });

    return Object.keys(grouped)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return {
          month: label,
          revenue: Math.round(grouped[key].revenue),
          orders: grouped[key].count,
        };
      });
  }, [orders]);

  // Top Customers by Spend
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => parseFloat(b.total_spent || 0) - parseFloat(a.total_spent || 0))
      .slice(0, 4);
  }, [customers]);

  // Recent 5 Orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date_created || 0) - new Date(a.date_created || 0))
      .slice(0, 5);
  }, [orders]);

  // Priority follow-up tasks (first 4 uncompleted)
  const urgentTasks = useMemo(() => {
    return followUpTasks.filter(t => t.status !== 'completed').slice(0, 4);
  }, [followUpTasks]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {customersLoading ? '—' : metrics.totalCustomers}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{metrics.payingCustomers} paying</span>
              <span>•</span>
              <span>100% indexed</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {ordersLoading ? '—' : metrics.totalOrders}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{metrics.completedOrdersCount} fulfilled</span>
              <span>•</span>
              <span>Order records</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {ordersLoading ? '—' : formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Avg order:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(metrics.avgOrderValue)}</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {ordersLoading ? '—' : metrics.pendingOrdersCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700">
              <span className="font-semibold">{formatCurrency(metrics.pendingRevenue)} pending</span>
              <span>requires fulfillment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Volume Over Time */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue & Order Trend</h2>
              <p className="text-xs text-slate-500">Monthly billing volume and transaction frequency</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              Monthly Performance
            </span>
          </div>

          <div className="h-64 w-full">
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading revenue statistics...
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Order Status Breakdown</h2>
            <p className="text-xs text-slate-500">Distribution of all order states</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} orders`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Loading chart...</div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {statusChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Urgent Follow-up Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Stream */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-500">Latest transactions from your store</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('orders')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              View All Orders
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => openOrderModal(order.id)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-indigo-700 group-hover:underline">
                      #{order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    <span className="text-[11px] text-slate-400">{formatDate(order.date_created)}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    {order.billing?.first_name} {order.billing?.last_name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{formatCurrency(order.total)}</span>
                  <span className="text-[11px] text-slate-400 block">{order.payment_method_title || 'Card'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Follow-ups Engine */}
        <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Follow-up Retention Queue</h2>
                <p className="text-xs text-slate-500">Automated rule-based customer tasks</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('followups')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Manage Tasks
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200/70">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">All customer follow-ups are up to date!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Rule engine monitors orders and high-value buyers continuously.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskComplete(task.id)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      title="Mark task completed"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-800">{task.title}</h3>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                          task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                        {task.customerName && <span>Customer: <strong className="text-slate-600">{task.customerName}</strong></span>}
                        <span>•</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {task.customerId && (
                    <button
                      type="button"
                      onClick={() => openCustomerModal(task.customerId)}
                      className="text-slate-400 hover:text-indigo-600 p-1 shrink-0"
                      title="View Customer Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Spending VIP Customers Bar */}
      <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Spending Customers</h2>
              <p className="text-xs text-slate-500">Highest lifetime value accounts in CustomerHub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('customers')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            Customer Directory
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topCustomers.map((cust) => (
            <div
              key={cust.id}
              onClick={() => openCustomerModal(cust.id)}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {cust.first_name?.[0] || 'C'}{cust.last_name?.[0] || ''}
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                    {cust.first_name} {cust.last_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{cust.billing?.company || cust.email}</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">{cust.orders_count} orders</span>
                <span className="font-bold text-indigo-700">{formatCurrency(cust.total_spent)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

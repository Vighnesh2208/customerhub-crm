import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const CrmContext = createContext(null);

const STORAGE_KEY_TASKS = 'customerhub_followup_tasks_v1';

export function CrmProvider({ children }) {
  // Navigation
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'customers' | 'orders' | 'followups' | 'integration'

  // Modals
  const [activeCustomerModalId, setActiveCustomerModalId] = useState(null);
  const [activeOrderModalId, setActiveOrderModalId] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInitialCustomer, setNewTaskInitialCustomer] = useState(null);

  // System Health & Integration
  const [health, setHealth] = useState({ status: 'unknown', latencyMs: null, lastChecked: null, error: null });
  const [integration, setIntegration] = useState({
    isConfigured: false,
    mode: 'demo',
    storeUrl: null,
    consumerKeyMasked: null,
    timeoutMs: 10000,
    lastSync: null,
    message: '',
    error: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Global Datasets
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);
  const [customersMeta, setCustomersMeta] = useState({ total: 0, totalPages: 1, isDemo: true });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [ordersMeta, setOrdersMeta] = useState({ total: 0, totalPages: 1, isDemo: true });

  // Follow-up tasks (stored in state + localStorage)
  const [followUpTasks, setFollowUpTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved follow-up tasks', e);
    }
    return [];
  });

  // Save tasks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(followUpTasks));
    } catch (e) {
      console.warn('Failed to persist follow-up tasks', e);
    }
  }, [followUpTasks]);

  // Fetch Health Check
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await api.getHealth();
      const latency = Math.round(performance.now() - start);
      setHealth({
        status: res.data.status || 'healthy',
        latencyMs: latency,
        lastChecked: new Date().toISOString(),
        service: res.data.service,
        error: null,
      });
    } catch (err) {
      setHealth({
        status: 'error',
        latencyMs: null,
        lastChecked: new Date().toISOString(),
        error: err.message,
      });
    }
  }, []);

  // Fetch Integration Status
  const fetchIntegrationStatus = useCallback(async (ping = false) => {
    try {
      const res = await api.getIntegrationStatus(ping);
      const data = res.data;
      setIntegration({
        isConfigured: Boolean(data.isConfigured),
        mode: data.mode || (data.isConfigured ? 'live' : 'demo'),
        storeUrl: data.storeUrl || null,
        consumerKeyMasked: data.consumerKeyMasked || null,
        timeoutMs: data.timeoutMs || 10000,
        lastSync: data.lastSync || null,
        message: data.message || '',
        livePing: data.livePing || null,
        error: null,
      });
      return data;
    } catch (err) {
      setIntegration(prev => ({
        ...prev,
        error: err.message,
      }));
      return null;
    }
  }, []);

  // Fetch Customers
  const fetchCustomers = useCallback(async (params = {}) => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const res = await api.getCustomers({ perPage: 100, ...params });
      const customerList = res.data.customers || res.data.data || [];
      setCustomers(customerList);
      setCustomersMeta({
        total: res.data.total ?? customerList.length,
        totalPages: res.data.totalPages ?? 1,
        isDemo: Boolean(res.data.isDemo ?? (res.data.source === 'demo')),
      });
      return customerList;
    } catch (err) {
      setCustomersError(err.message || 'Failed to load customers');
      return [];
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async (params = {}) => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await api.getOrders({ perPage: 100, ...params });
      const orderList = res.data.orders || res.data.data || [];
      setOrders(orderList);
      setOrdersMeta({
        total: res.data.total ?? orderList.length,
        totalPages: res.data.totalPages ?? 1,
        isDemo: Boolean(res.data.isDemo ?? (res.data.source === 'demo')),
      });
      return orderList;
    } catch (err) {
      setOrdersError(err.message || 'Failed to load orders');
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Perform Synchronization
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncIntegration();
      setSyncResult(res.data);
      // Refresh integration status and datasets
      await Promise.all([
        fetchIntegrationStatus(),
        fetchCustomers(),
        fetchOrders(),
      ]);
      return res.data;
    } catch (err) {
      const errPayload = {
        success: false,
        error: err.message,
        message: err.data?.message || err.message || 'Sync request failed',
        syncedAt: new Date().toISOString(),
      };
      setSyncResult(errPayload);
      return errPayload;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchIntegrationStatus, fetchCustomers, fetchOrders]);

  // Initial Load
  useEffect(() => {
    checkHealth();
    fetchIntegrationStatus();
    fetchCustomers();
    fetchOrders();

    // Periodic health heartbeat every 60s
    const timer = setInterval(() => {
      checkHealth();
    }, 60000);
    return () => clearInterval(timer);
  }, [checkHealth, fetchIntegrationStatus, fetchCustomers, fetchOrders]);

  // Generate rule-based tasks whenever customers and orders are loaded and tasks are empty
  useEffect(() => {
    if (customers.length > 0 && orders.length > 0) {
      setFollowUpTasks(existingTasks => {
        // If user already has tasks saved, keep them and only seed missing rule-based suggestions
        const existingRuleIds = new Set(existingTasks.map(t => t.id));
        const newSuggested = [];

        // Rule 1: Pending / Processing Orders
        orders
          .filter(o => ['processing', 'pending', 'on-hold'].includes(o.status.toLowerCase()))
          .forEach(o => {
            const ruleId = `rule-order-${o.id}`;
            if (!existingRuleIds.has(ruleId)) {
              newSuggested.push({
                id: ruleId,
                title: `Order #${o.id} is ${o.status.toUpperCase()}`,
                description: `Order placed by ${o.billing?.first_name || 'Customer'} ${o.billing?.last_name || ''} for $${parseFloat(o.total || 0).toFixed(2)}. Verify fulfillment or send tracking update.`,
                customerId: o.customer_id,
                customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Valued Customer',
                customerEmail: o.billing?.email || '',
                orderId: o.id,
                priority: o.status === 'pending' ? 'high' : 'medium',
                type: 'order_status',
                status: 'pending',
                createdAt: o.date_created || new Date().toISOString(),
                dueDate: 'Today',
              });
            }
          });

        // Rule 2: High Value VIP check-in (spent > $1,000)
        customers
          .filter(c => parseFloat(c.total_spent || 0) >= 1000)
          .forEach(c => {
            const ruleId = `rule-vip-${c.id}`;
            if (!existingRuleIds.has(ruleId)) {
              newSuggested.push({
                id: ruleId,
                title: `VIP Retention: ${c.first_name} ${c.last_name}`,
                description: `Customer has spent $${parseFloat(c.total_spent).toFixed(2)} across ${c.orders_count} orders. Send executive thank-you note or exclusive discount perk.`,
                customerId: c.id,
                customerName: `${c.first_name} ${c.last_name}`.trim(),
                customerEmail: c.email,
                priority: 'high',
                type: 'vip_care',
                status: 'pending',
                createdAt: c.date_modified || new Date().toISOString(),
                dueDate: 'This week',
              });
            }
          });

        // Rule 3: Repeat Customer Check-in (orders_count >= 2 but not VIP)
        customers
          .filter(c => c.orders_count >= 2 && parseFloat(c.total_spent || 0) < 1000)
          .forEach(c => {
            const ruleId = `rule-repeat-${c.id}`;
            if (!existingRuleIds.has(ruleId)) {
              newSuggested.push({
                id: ruleId,
                title: `Loyalty Check-in: ${c.first_name} ${c.last_name}`,
                description: `Repeat buyer with ${c.orders_count} orders ($${parseFloat(c.total_spent).toFixed(2)}). Request a review or introduce new catalog releases.`,
                customerId: c.id,
                customerName: `${c.first_name} ${c.last_name}`.trim(),
                customerEmail: c.email,
                priority: 'medium',
                type: 'repeat_buyer',
                status: 'pending',
                createdAt: c.date_modified || new Date().toISOString(),
                dueDate: 'Next week',
              });
            }
          });

        if (newSuggested.length === 0) return existingTasks;
        return [...existingTasks, ...newSuggested];
      });
    }
  }, [customers, orders]);

  // Task Actions
  const toggleTaskComplete = useCallback((taskId) => {
    setFollowUpTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'pending' : 'completed',
              completedAt: task.status === 'completed' ? null : new Date().toISOString(),
            }
          : task
      )
    );
  }, []);

  const addTask = useCallback((taskData) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: taskData.title || 'Follow-up Task',
      description: taskData.description || '',
      customerId: taskData.customerId || null,
      customerName: taskData.customerName || 'Customer',
      customerEmail: taskData.customerEmail || '',
      orderId: taskData.orderId || null,
      priority: taskData.priority || 'medium',
      type: 'custom',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: taskData.dueDate || 'Soon',
    };
    setFollowUpTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const deleteTask = useCallback((taskId) => {
    setFollowUpTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Modal navigation shortcuts
  const openCustomerModal = useCallback((id) => {
    setActiveCustomerModalId(Number(id));
  }, []);

  const closeCustomerModal = useCallback(() => {
    setActiveCustomerModalId(null);
  }, []);

  const openOrderModal = useCallback((id) => {
    setActiveOrderModalId(Number(id));
  }, []);

  const closeOrderModal = useCallback(() => {
    setActiveOrderModalId(null);
  }, []);

  const openNewTaskModal = useCallback((customer = null) => {
    setNewTaskInitialCustomer(customer);
    setIsNewTaskModalOpen(true);
  }, []);

  const closeNewTaskModal = useCallback(() => {
    setIsNewTaskModalOpen(false);
    setNewTaskInitialCustomer(null);
  }, []);

  // Computed Demo Mode indicator
  const isDemoMode = Boolean(
    integration.mode === 'demo' ||
    customersMeta.isDemo ||
    ordersMeta.isDemo
  );

  const value = {
    // Navigation
    activeView,
    setActiveView,

    // Modals
    activeCustomerModalId,
    openCustomerModal,
    closeCustomerModal,
    activeOrderModalId,
    openOrderModal,
    closeOrderModal,
    isNewTaskModalOpen,
    newTaskInitialCustomer,
    openNewTaskModal,
    closeNewTaskModal,

    // Health & Integration
    health,
    checkHealth,
    integration,
    fetchIntegrationStatus,
    isDemoMode,
    isSyncing,
    syncResult,
    triggerSync,
    clearSyncResult: () => setSyncResult(null),

    // Datasets
    customers,
    customersLoading,
    customersError,
    customersMeta,
    fetchCustomers,

    orders,
    ordersLoading,
    ordersError,
    ordersMeta,
    fetchOrders,

    // Follow-ups
    followUpTasks,
    toggleTaskComplete,
    addTask,
    deleteTask,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}

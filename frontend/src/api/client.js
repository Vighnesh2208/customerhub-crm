/**
 * CustomerHub CRM - API Client
 * 
 * Centralized API client communicating with CustomerHub backend at http://localhost:3000
 * Handles error normalization, request timeouts, and demo mode flags.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Internal request helper with timeout and standardized response wrapping.
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const timeoutMs = options.timeout || 12000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return {
        ok: true,
        status: response.status,
        data,
        source: response.headers.get('X-Data-Source') || data?.source || (data?.isDemo ? 'demo' : 'live'),
        totalCount: response.headers.get('X-Total-Count'),
        totalPages: response.headers.get('X-Total-Pages'),
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      // Re-throw standardized error
      throw err;
    }
  }

  /**
   * Health Check
   * GET /api/health
   */
  async getHealth() {
    return this.request('/api/health');
  }

  /**
   * Integration Status
   * GET /api/integration/status
   * Optional ping=true to trigger connection test
   */
  async getIntegrationStatus(ping = false) {
    const query = ping ? '?ping=true' : '';
    return this.request(`/api/integration/status${query}`);
  }

  /**
   * Trigger Synchronization
   * POST /api/integration/sync
   */
  async syncIntegration() {
    return this.request('/api/integration/sync', {
      method: 'POST',
      timeout: 20000,
    });
  }

  /**
   * List Customers
   * GET /api/customers
   * Supports page, per_page, search, role
   */
  async getCustomers({ page = 1, perPage = 50, search = '', role = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (perPage) params.set('per_page', String(perPage));
    if (search) params.set('search', search.trim());
    if (role) params.set('role', role.trim());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/customers${query}`);
  }

  /**
   * Get Customer by ID
   * GET /api/customers/:id
   */
  async getCustomerById(id) {
    if (!id) throw new Error('Customer ID is required');
    return this.request(`/api/customers/${id}`);
  }

  /**
   * List Orders
   * GET /api/orders
   * Supports page, per_page, status, customer, search
   */
  async getOrders({ page = 1, perPage = 50, status = '', customer = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (perPage) params.set('per_page', String(perPage));
    if (status && status !== 'all') params.set('status', status.trim());
    if (customer) params.set('customer', String(customer));
    if (search) params.set('search', search.trim());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/orders${query}`);
  }

  /**
   * Get Order by ID
   * GET /api/orders/:id
   */
  async getOrderById(id) {
    if (!id) throw new Error('Order ID is required');
    return this.request(`/api/orders/${id}`);
  }
}

export const api = new ApiClient();
export default api;

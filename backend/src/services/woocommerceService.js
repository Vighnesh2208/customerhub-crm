/**
 * WooCommerce Service
 * 
 * Interacts with WooCommerce REST API v3 for customers and orders.
 * Automatically falls back to realistic seeded demo data when credentials
 * are missing or unconfigured.
 */

const axios = require('axios');
const { getWooCommerceConfig, getSanitizedStatus } = require('../config/woocommerce');
const seededCustomers = require('../data/seededCustomers');
const seededOrders = require('../data/seededOrders');

class WooCommerceService {
  constructor() {
    this.lastSyncState = null;
  }

  /**
   * Helper to inspect current config.
   */
  getConfig() {
    return getWooCommerceConfig();
  }

  /**
   * Returns whether live credentials are configured.
   */
  isConfigured() {
    return this.getConfig().isConfigured;
  }

  /**
   * Returns safe status reporting for clients.
   */
  getStatus() {
    return getSanitizedStatus(this.lastSyncState);
  }

  /**
   * Builds an Axios client configured for WooCommerce REST API v3.
   * Uses Basic Auth for HTTPS and query params fallback for HTTP.
   * 
   * @private
   */
  _createClient() {
    const config = this.getConfig();
    if (!config.isConfigured) {
      throw new Error('WooCommerce is not configured. Provide store URL, consumer key, and consumer secret.');
    }

    const isHttps = config.apiBaseUrl.startsWith('https:');

    const clientConfig = {
      baseURL: config.apiBaseUrl,
      timeout: config.timeoutMs,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'CustomerHub-CRM/1.0 (+https://github.com/customerhub-crm)',
      },
    };

    if (isHttps) {
      // Official standard for HTTPS in WooCommerce REST API
      clientConfig.auth = {
        username: config.consumerKey,
        password: config.consumerSecret,
      };
    } else {
      // Fallback query parameters for local HTTP testing
      clientConfig.params = {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      };
    }

    return axios.create(clientConfig);
  }

  /**
   * Normalizes errors into clean, descriptive responses.
   * 
   * @private
   */
  _handleAxiosError(err, context = 'WooCommerce API') {
    const errorDetails = {
      isWooCommerceError: true,
      context,
      message: 'Unknown error occurred while contacting WooCommerce',
      statusCode: 500,
      code: err.code || 'UNKNOWN_ERROR',
      details: null,
    };

    // Timeout handling
    if (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'))) {
      errorDetails.statusCode = 504;
      errorDetails.code = 'TIMEOUT';
      errorDetails.message = `${context} request timed out after ${this.getConfig().timeoutMs}ms. The remote WooCommerce server did not respond in time.`;
      return errorDetails;
    }

    // DNS / Network resolution failures
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH') {
      errorDetails.statusCode = 502;
      errorDetails.code = 'NETWORK_ERROR';
      errorDetails.message = `Unable to connect to WooCommerce store at "${this.getConfig().storeUrl}". Check your network connection and store URL.`;
      return errorDetails;
    }

    // HTTP Response errors from WordPress / WooCommerce
    if (err.response) {
      errorDetails.statusCode = err.response.status;
      const data = err.response.data;

      if (data && typeof data === 'object') {
        errorDetails.message = data.message || `WooCommerce returned HTTP ${err.response.status}`;
        errorDetails.code = data.code || `HTTP_${err.response.status}`;
        errorDetails.details = data.data || data;
      } else if (typeof data === 'string') {
        errorDetails.message = `WooCommerce returned HTTP ${err.response.status}: ${data.slice(0, 150)}`;
      }

      if (err.response.status === 401 || err.response.status === 403) {
        errorDetails.message = `WooCommerce authentication failed (${err.response.status}). Verify your Consumer Key and Consumer Secret.`;
        errorDetails.code = 'AUTH_FAILED';
      } else if (err.response.status === 404) {
        errorDetails.message = `WooCommerce REST endpoint not found (404). Ensure WooCommerce REST API is enabled on your WordPress site.`;
        errorDetails.code = 'ENDPOINT_NOT_FOUND';
      }

      return errorDetails;
    }

    // Generic error
    errorDetails.message = err.message || 'An unexpected error occurred';
    return errorDetails;
  }

  /**
   * Tests connection to WooCommerce store.
   */
  async testConnection() {
    const config = this.getConfig();
    if (!config.isConfigured) {
      return {
        connected: false,
        mode: 'demo',
        message: config.urlValidationError || 'Credentials not configured',
      };
    }

    try {
      const client = this._createClient();
      const startTime = Date.now();
      // Use lightweight endpoint to verify credentials
      await client.get('/orders', { params: { per_page: 1 } });
      const durationMs = Date.now() - startTime;

      return {
        connected: true,
        mode: 'live',
        durationMs,
        storeUrl: config.storeUrl,
        message: 'Successfully connected to WooCommerce REST API',
      };
    } catch (err) {
      const parsed = this._handleAxiosError(err, 'Test Connection');
      return {
        connected: false,
        mode: 'live',
        error: parsed,
        message: parsed.message,
      };
    }
  }

  /**
   * Fetches customers with pagination and filtering.
   * In demo mode, filters and paginates seeded data.
   */
  async getCustomers(query = {}) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || query.limit || '10', 10)));
    const search = (query.search || '').trim().toLowerCase();
    const role = (query.role || '').trim().toLowerCase();

    // DEMO MODE
    if (!this.isConfigured()) {
      let filtered = [...seededCustomers];

      if (search) {
        filtered = filtered.filter(c =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.billing?.company && c.billing.company.toLowerCase().includes(search)) ||
          (c.username && c.username.toLowerCase().includes(search))
        );
      }

      if (role) {
        filtered = filtered.filter(c => c.role.toLowerCase() === role);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage) || 1;
      const startIndex = (page - 1) * perPage;
      const paginated = filtered.slice(startIndex, startIndex + perPage);

      return {
        source: 'demo',
        isDemo: true,
        page,
        per_page: perPage,
        total,
        totalPages,
        count: paginated.length,
        data: paginated,
        customers: paginated,
      };
    }

    // LIVE MODE
    try {
      const client = this._createClient();
      const params = {
        page,
        per_page: perPage,
      };
      if (search) params.search = search;
      if (role) params.role = role;

      const response = await client.get('/customers', { params });
      const total = parseInt(response.headers['x-wp-total'] || response.data.length, 10);
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || 1, 10);

      return {
        source: 'live',
        isDemo: false,
        page,
        per_page: perPage,
        total,
        totalPages,
        count: response.data.length,
        data: response.data,
        customers: response.data,
      };
    } catch (err) {
      throw this._handleAxiosError(err, 'Get Customers');
    }
  }

  /**
   * Fetches single customer by ID.
   */
  async getCustomerById(id) {
    const customerId = parseInt(id, 10);

    if (!this.isConfigured()) {
      const customer = seededCustomers.find(c => c.id === customerId);
      if (!customer) {
        return null;
      }
      return {
        source: 'demo',
        isDemo: true,
        data: customer,
      };
    }

    try {
      const client = this._createClient();
      const response = await client.get(`/customers/${customerId}`);
      return {
        source: 'live',
        isDemo: false,
        data: response.data,
      };
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null;
      }
      throw this._handleAxiosError(err, `Get Customer #${id}`);
    }
  }

  /**
   * Fetches orders with pagination and filtering.
   * In demo mode, filters and paginates seeded orders.
   */
  async getOrders(query = {}) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || query.limit || '10', 10)));
    const status = (query.status || '').trim().toLowerCase();
    const customer = query.customer || query.customer_id;
    const search = (query.search || '').trim().toLowerCase();

    // DEMO MODE
    if (!this.isConfigured()) {
      let filtered = [...seededOrders];

      if (customer !== undefined && customer !== null && customer !== '') {
        const custId = parseInt(customer, 10);
        filtered = filtered.filter(o => o.customer_id === custId);
      }

      if (status && status !== 'any') {
        filtered = filtered.filter(o => o.status.toLowerCase() === status);
      }

      if (search) {
        filtered = filtered.filter(o =>
          String(o.id).includes(search) ||
          (o.order_key && o.order_key.toLowerCase().includes(search)) ||
          (o.billing?.first_name && o.billing.first_name.toLowerCase().includes(search)) ||
          (o.billing?.last_name && o.billing.last_name.toLowerCase().includes(search)) ||
          (o.billing?.email && o.billing.email.toLowerCase().includes(search)) ||
          (o.line_items && o.line_items.some(li => li.name.toLowerCase().includes(search)))
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage) || 1;
      const startIndex = (page - 1) * perPage;
      const paginated = filtered.slice(startIndex, startIndex + perPage);

      return {
        source: 'demo',
        isDemo: true,
        page,
        per_page: perPage,
        total,
        totalPages,
        count: paginated.length,
        data: paginated,
        orders: paginated,
      };
    }

    // LIVE MODE
    try {
      const client = this._createClient();
      const params = {
        page,
        per_page: perPage,
      };
      if (status && status !== 'any') params.status = status;
      if (customer) params.customer = customer;
      if (search) params.search = search;

      const response = await client.get('/orders', { params });
      const total = parseInt(response.headers['x-wp-total'] || response.data.length, 10);
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || 1, 10);

      return {
        source: 'live',
        isDemo: false,
        page,
        per_page: perPage,
        total,
        totalPages,
        count: response.data.length,
        data: response.data,
        orders: response.data,
      };
    } catch (err) {
      throw this._handleAxiosError(err, 'Get Orders');
    }
  }

  /**
   * Fetches single order by ID.
   */
  async getOrderById(id) {
    const orderId = parseInt(id, 10);

    if (!this.isConfigured()) {
      const order = seededOrders.find(o => o.id === orderId);
      if (!order) {
        return null;
      }
      return {
        source: 'demo',
        isDemo: true,
        data: order,
      };
    }

    try {
      const client = this._createClient();
      const response = await client.get(`/orders/${orderId}`);
      return {
        source: 'live',
        isDemo: false,
        data: response.data,
      };
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null;
      }
      throw this._handleAxiosError(err, `Get Order #${id}`);
    }
  }

  /**
   * Performs data sync from WooCommerce.
   * In Demo Mode: Honestly states that live sync cannot run and returns mock counts.
   * In Live Mode: Fetches customer and order counts/records and reports timing or honest failure.
   */
  async sync() {
    const config = this.getConfig();
    const syncTime = new Date().toISOString();

    // DEMO MODE: Never claim live sync succeeded
    if (!config.isConfigured) {
      const result = {
        success: false,
        mode: 'demo',
        syncedAt: syncTime,
        durationMs: 0,
        customerCount: seededCustomers.length,
        orderCount: seededOrders.length,
        message: 'Live sync is not available in demo mode. Configure WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in backend/.env to synchronize with your WooCommerce store.',
        warning: 'Demo mode active. Showing cached mock dataset counts only.',
      };

      if (config.urlValidationError) {
        result.message = `Sync cannot proceed: ${config.urlValidationError}`;
      }

      this.lastSyncState = result;
      return result;
    }

    // LIVE MODE: Execute actual sync
    const startTime = Date.now();
    try {
      const client = this._createClient();

      // Fetch sample of customers and orders in parallel to test and get totals
      const [customersRes, ordersRes] = await Promise.all([
        client.get('/customers', { params: { per_page: 100, page: 1 } }),
        client.get('/orders', { params: { per_page: 100, page: 1 } }),
      ]);

      const durationMs = Date.now() - startTime;
      const customerTotal = parseInt(customersRes.headers['x-wp-total'] || customersRes.data.length, 10);
      const orderTotal = parseInt(ordersRes.headers['x-wp-total'] || ordersRes.data.length, 10);

      const result = {
        success: true,
        mode: 'live',
        syncedAt: syncTime,
        durationMs,
        customerCount: customerTotal,
        orderCount: orderTotal,
        fetchedCustomers: customersRes.data.length,
        fetchedOrders: ordersRes.data.length,
        message: `Successfully synchronized ${customerTotal} customers and ${orderTotal} orders from WooCommerce store in ${durationMs}ms.`,
      };

      this.lastSyncState = result;
      return result;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const parsedError = this._handleAxiosError(err, 'WooCommerce Sync');

      const failureResult = {
        success: false,
        mode: 'live',
        syncedAt: syncTime,
        durationMs,
        customerCount: 0,
        orderCount: 0,
        error: parsedError.message,
        details: parsedError.details,
        statusCode: parsedError.statusCode,
        message: `Synchronization failed: ${parsedError.message}`,
      };

      this.lastSyncState = failureResult;
      return failureResult;
    }
  }
}

// Export singleton instance
const woocommerceService = new WooCommerceService();
module.exports = woocommerceService;

/**
 * WooCommerce Configuration Module
 * 
 * Safely loads and validates WooCommerce environment credentials.
 * Ensures secrets are never exposed to public/client endpoints.
 */

require('dotenv').config();

/**
 * Validates and normalizes the store URL.
 * Strips accidental trailing slashes and redundant wp-json paths.
 * 
 * @param {string} url 
 * @returns {{ valid: boolean, normalizedBaseUrl?: string, apiBaseUrl?: string, error?: string }}
 */
function normalizeStoreUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'Store URL is empty or undefined' };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Store URL must use http:// or https:// protocol' };
    }

    // Clean any trailing slashes or subpaths like /wp-json/wc/v3
    let clean = trimmed.replace(/\/+$/, '');
    clean = clean.replace(/\/wp-json\/wc\/v[123]\/?$/i, '');
    clean = clean.replace(/\/wp-json\/?$/i, '');

    return {
      valid: true,
      normalizedBaseUrl: clean,
      apiBaseUrl: `${clean}/wp-json/wc/v3`,
    };
  } catch (err) {
    return { valid: false, error: `Invalid URL format: ${err.message}` };
  }
}

/**
 * Masks a consumer key for safe display (e.g. "ck_1234...9abc")
 * 
 * @param {string} key 
 * @returns {string|null}
 */
function maskKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '****';
  const start = trimmed.slice(0, 5);
  const end = trimmed.slice(-4);
  return `${start}...${end}`;
}

/**
 * Gets the current WooCommerce configuration settings.
 */
function getWooCommerceConfig() {
  const storeUrlRaw = process.env.WOOCOMMERCE_STORE_URL || '';
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY || '').trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET || '').trim();
  const timeoutMs = parseInt(process.env.WOOCOMMERCE_TIMEOUT_MS || '10000', 10);

  const urlCheck = normalizeStoreUrl(storeUrlRaw);
  const hasKeys = Boolean(consumerKey && consumerSecret);
  const isConfigured = Boolean(urlCheck.valid && hasKeys);

  return {
    isConfigured,
    storeUrl: urlCheck.valid ? urlCheck.normalizedBaseUrl : null,
    apiBaseUrl: urlCheck.valid ? urlCheck.apiBaseUrl : null,
    consumerKey: consumerKey || null,
    consumerSecret: consumerSecret || null,
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? 10000 : timeoutMs,
    urlValidationError: urlCheck.valid ? null : (storeUrlRaw ? urlCheck.error : null),
  };
}

/**
 * Returns safe status information for frontend / public consumption.
 * NEVER returns the consumer secret or full consumer key.
 * 
 * @param {object} [lastSyncState]
 * @returns {object}
 */
function getSanitizedStatus(lastSyncState = null) {
  const config = getWooCommerceConfig();

  let message = 'Running in demo mode with sample data. Configure WOOCOMMERCE_* in backend/.env to connect to your live store.';
  if (config.isConfigured) {
    message = 'WooCommerce credentials configured. Live API mode is active.';
  } else if (config.urlValidationError) {
    message = `Configuration error: ${config.urlValidationError}`;
  } else if (process.env.WOOCOMMERCE_STORE_URL && (!config.consumerKey || !config.consumerSecret)) {
    message = 'Store URL provided, but Consumer Key or Consumer Secret is missing.';
  }

  return {
    isConfigured: config.isConfigured,
    mode: config.isConfigured ? 'live' : 'demo',
    storeUrl: config.storeUrl,
    consumerKeyMasked: maskKey(config.consumerKey),
    timeoutMs: config.timeoutMs,
    lastSync: lastSyncState ? {
      syncedAt: lastSyncState.syncedAt,
      durationMs: lastSyncState.durationMs,
      customerCount: lastSyncState.customerCount,
      orderCount: lastSyncState.orderCount,
      mode: lastSyncState.mode,
      success: lastSyncState.success,
    } : null,
    message,
  };
}

module.exports = {
  normalizeStoreUrl,
  maskKey,
  getWooCommerceConfig,
  getSanitizedStatus,
};

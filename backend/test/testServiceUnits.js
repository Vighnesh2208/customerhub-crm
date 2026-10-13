/**
 * Unit Test Script for WooCommerce Service & Configuration Logic
 * Tests URL normalization, key masking, timeouts, and error handling.
 */

const { normalizeStoreUrl, maskKey, getSanitizedStatus } = require('../src/config/woocommerce');
const woocommerceService = require('../src/services/woocommerceService');

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('--- Testing Config & URL Normalization ---');

// 1. URL Normalization
const url1 = normalizeStoreUrl('https://example.com');
assert(url1.valid && url1.apiBaseUrl === 'https://example.com/wp-json/wc/v3', 'Standard HTTPS URL normalizes to /wp-json/wc/v3');

const url2 = normalizeStoreUrl('https://example.com/wp-json/wc/v3/');
assert(url2.valid && url2.apiBaseUrl === 'https://example.com/wp-json/wc/v3', 'Trailing /wp-json/wc/v3 is cleaned and normalized');

const url3 = normalizeStoreUrl('https://example.com/wp-json/');
assert(url3.valid && url3.apiBaseUrl === 'https://example.com/wp-json/wc/v3', 'Trailing /wp-json is cleaned and normalized');

const url4 = normalizeStoreUrl('invalid-url-string');
assert(!url4.valid, 'Invalid URL string fails validation cleanly');

const url5 = normalizeStoreUrl('');
assert(!url5.valid, 'Empty URL string fails validation cleanly');

// 2. Key Masking
console.log('\n--- Testing Key Masking ---');
const masked1 = maskKey('ck_9f8d7e6c5b4a3210fedcba');
assert(masked1.startsWith('ck_9f') && masked1.endsWith('dcba') && masked1.includes('...'), 'Keys are masked correctly');
assert(maskKey(null) === null, 'Null key returns null');
assert(maskKey('') === null, 'Empty key returns null');

// 3. Error handler behavior
console.log('\n--- Testing Error Handling Normalization ---');

// Timeout error simulation
const timeoutErr = {
  code: 'ECONNABORTED',
  message: 'timeout of 10000ms exceeded',
};
const parsedTimeout = woocommerceService._handleAxiosError(timeoutErr, 'Order Fetch');
assert(parsedTimeout.statusCode === 504, 'Timeout yields 504 status code');
assert(parsedTimeout.code === 'TIMEOUT', 'Timeout code is TIMEOUT');
assert(parsedTimeout.message.includes('timed out'), 'Friendly timeout message returned');

// DNS / Network resolution error simulation
const dnsErr = {
  code: 'ENOTFOUND',
  message: 'getaddrinfo ENOTFOUND fake-store.test',
};
const parsedDns = woocommerceService._handleAxiosError(dnsErr, 'Customer Fetch');
assert(parsedDns.statusCode === 502, 'DNS failure yields 502 status code');
assert(parsedDns.code === 'NETWORK_ERROR', 'Network error code returned');

// Auth error simulation (401)
const authErr = {
  response: {
    status: 401,
    data: {
      code: 'woocommerce_rest_cannot_view',
      message: 'The signature provided did not match.',
    },
  },
};
const parsedAuth = woocommerceService._handleAxiosError(authErr, 'Sync');
assert(parsedAuth.statusCode === 401, '401 response yields 401 status');
assert(parsedAuth.code === 'AUTH_FAILED', 'Auth failed code returned');
assert(parsedAuth.message.includes('Verify your Consumer Key and Consumer Secret'), 'Helpful auth guidance message');

// 404 Endpoint error simulation
const notFoundErr = {
  response: {
    status: 404,
    data: {
      code: 'rest_no_route',
      message: 'No route was found matching the URL and request method.',
    },
  },
};
const parsedNotFound = woocommerceService._handleAxiosError(notFoundErr, 'Orders');
assert(parsedNotFound.statusCode === 404, '404 yields 404');
assert(parsedNotFound.code === 'ENDPOINT_NOT_FOUND', 'Endpoint not found code returned');

console.log('\n--- All Unit Tests Completed ---');

/**
 * Verification Script for CustomerHub CRM WooCommerce Integration Endpoints
 */

const http = require('http');
const app = require('../server');

let server;
const PORT = 3099; // Test port to avoid port conflict

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Integration Endpoint Tests ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Test 1: GET /api/health
    console.log('1. Testing GET /api/health...');
    const health = await makeRequest('/api/health');
    assert(health.statusCode === 200, 'Returns status 200');
    assert(health.body.status === 'healthy', 'Status is "healthy"');
    assert(Boolean(health.body.timestamp), 'Timestamp is present');

    // Test 2: GET /api/integration/status
    console.log('\n2. Testing GET /api/integration/status (Demo Mode)...');
    const status = await makeRequest('/api/integration/status');
    assert(status.statusCode === 200, 'Returns status 200');
    assert(status.body.mode === 'demo', 'Mode is "demo"');
    assert(status.body.isConfigured === false, 'isConfigured is false');
    assert(!status.body.consumerSecret, 'Consumer secret is NOT exposed');
    assert(!status.body.consumerKey, 'Raw consumer key is NOT exposed');
    assert(status.body.consumerKeyMasked === null, 'Masked key is null when empty');

    // Test 3: POST /api/integration/sync (Demo Mode)
    console.log('\n3. Testing POST /api/integration/sync (Demo Mode)...');
    const sync = await makeRequest('/api/integration/sync', { method: 'POST' });
    assert(sync.statusCode === 200, 'Returns status 200');
    assert(sync.body.success === false, 'Never claims live sync succeeded in demo mode (success === false)');
    assert(sync.body.mode === 'demo', 'Declares mode: demo');
    assert(sync.body.customerCount > 0, `Returns seeded customer count (${sync.body.customerCount})`);
    assert(sync.body.orderCount > 0, `Returns seeded order count (${sync.body.orderCount})`);
    assert(sync.body.message.includes('not available in demo mode'), 'Explains honest status in message');

    // Test 4: GET /api/customers
    console.log('\n4. Testing GET /api/customers...');
    const customers = await makeRequest('/api/customers');
    assert(customers.statusCode === 200, 'Returns status 200');
    assert(customers.body.source === 'demo', 'Source is "demo"');
    assert(customers.body.isDemo === true, 'isDemo is true');
    assert(customers.headers['x-data-source'] === 'demo', 'X-Data-Source header is "demo"');
    assert(Array.isArray(customers.body.data), 'Returns array of customer objects');
    assert(customers.body.total >= 6, `Returns at least 6 seeded customers (total: ${customers.body.total})`);

    // Test 5: GET /api/customers pagination & search
    console.log('\n5. Testing GET /api/customers?per_page=2&page=2 and search...');
    const custPaged = await makeRequest('/api/customers?per_page=2&page=2');
    assert(custPaged.body.page === 2, 'Page is 2');
    assert(custPaged.body.data.length === 2, 'Page length is 2');

    const custSearch = await makeRequest('/api/customers?search=jenkins');
    assert(custSearch.body.data.length === 1, 'Search finds Sarah Jenkins');
    assert(custSearch.body.data[0].id === 101, 'Found customer ID 101');

    // Test 6: GET /api/customers/101
    console.log('\n6. Testing GET /api/customers/:id...');
    const singleCustomer = await makeRequest('/api/customers/101');
    assert(singleCustomer.statusCode === 200, 'Returns status 200');
    assert(singleCustomer.body.data.id === 101, 'Customer ID is 101');
    assert(singleCustomer.body.data.billing.email === 'sarah.jenkins@example.com', 'Customer email matches');

    // Test 7: GET /api/orders
    console.log('\n7. Testing GET /api/orders...');
    const orders = await makeRequest('/api/orders');
    assert(orders.statusCode === 200, 'Returns status 200');
    assert(orders.body.source === 'demo', 'Source is "demo"');
    assert(orders.headers['x-data-source'] === 'demo', 'X-Data-Source header is "demo"');
    assert(Array.isArray(orders.body.data), 'Returns array of orders');
    assert(orders.body.total >= 10, `Returns at least 10 seeded orders (total: ${orders.body.total})`);

    // Test 8: Order customer filtering & single order
    console.log('\n8. Testing GET /api/orders?customer=101 and /api/orders/:id...');
    const customerOrders = await makeRequest('/api/orders?customer=101');
    assert(customerOrders.body.data.length === 3, 'Customer 101 has 3 orders');
    assert(customerOrders.body.data.every(o => o.customer_id === 101), 'All returned orders have customer_id 101');

    const singleOrder = await makeRequest('/api/orders/5001');
    assert(singleOrder.statusCode === 200, 'Returns status 200');
    assert(singleOrder.body.data.id === 5001, 'Order ID is 5001');
    assert(singleOrder.body.data.line_items.length > 0, 'Order has line items');

    // Test 9: 404 handling
    console.log('\n9. Testing 404 not found handling...');
    const missingCustomer = await makeRequest('/api/customers/99999');
    assert(missingCustomer.statusCode === 404, 'Non-existent customer returns 404');
    const missingRoute = await makeRequest('/api/non-existent-route');
    assert(missingRoute.statusCode === 404, 'Non-existent route returns 404');

    console.log(`\n========================================`);
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('Test execution failed:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

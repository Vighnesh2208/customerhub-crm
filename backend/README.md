# CustomerHub CRM - Backend

Lightweight, high-performance Node.js & Express backend for CustomerHub CRM, featuring a modular WooCommerce REST API v3 integration with an automatic fallback to realistic demo mode.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [WooCommerce API Configuration](#woocommerce-api-configuration)
   - [Generating WooCommerce API Keys](#generating-woocommerce-api-keys)
   - [Configuring Environment Variables](#configuring-environment-variables)
3. [How Demo Mode Works](#how-demo-mode-works)
4. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check)
   - [Integration Status](#integration-status)
   - [Data Synchronization](#data-synchronization)
   - [Customers API](#customers-api)
   - [Orders API](#orders-api)
5. [Running Tests](#running-tests)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### 3. Start the Server
```bash
npm start
```
The server will start at `http://localhost:3000`.

---

## WooCommerce API Configuration

CustomerHub CRM connects to WooCommerce stores using standard **WooCommerce REST API v3** endpoints (`/wp-json/wc/v3/`).

### Generating WooCommerce API Keys

1. Log into your WordPress administrator dashboard.
2. Navigate to **WooCommerce > Settings > Advanced > REST API**.
3. Click **Add key** (or **Create an API Key**).
4. Fill in the key details:
   - **Description**: `CustomerHub CRM`
   - **User**: Select an administrator or shop manager user account.
   - **Permissions**: Select **Read/Write** (or **Read** for read-only analytics).
5. Click **Generate API Key**.
6. WordPress will display:
   - **Consumer Key**: Starts with `ck_...`
   - **Consumer Secret**: Starts with `cs_...`
   > **Note:** Copy the Consumer Secret immediately; WordPress will not show it again.

### Configuring Environment Variables

Open `backend/.env` and supply your store URL and generated credentials:

```env
PORT=3000
FRONTEND_URL=http://localhost:5175

# WooCommerce REST API v3 Configuration
WOOCOMMERCE_STORE_URL=https://yourstore.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Request timeout in milliseconds (default: 10000ms / 10s)
WOOCOMMERCE_TIMEOUT_MS=10000
```

> **Security Guarantee:**
> - `WOOCOMMERCE_CONSUMER_SECRET` is strictly kept on the server and is **never** returned across any API endpoints or exposed to the client.
> - `backend/.env` is ignored by Git in `.gitignore` to prevent secret leaks.

---

## How Demo Mode Works

When `WOOCOMMERCE_STORE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, or `WOOCOMMERCE_CONSUMER_SECRET` are left empty or omitted:

1. **Automatic Activation:** The backend boots into **Demo Mode** with zero manual toggles.
2. **Realistic Seed Data:** Serves pre-configured, realistic customers and order histories that mirror real WooCommerce REST API v3 payloads:
   - Multi-tier customers with complete billing/shipping addresses, contact info, total spend, and order history.
   - Varied order statuses (`completed`, `processing`, `on-hold`, `refunded`) with realistic products, tax calculations, and payment methods.
3. **Transparent Labeling:**
   - Responses include `"source": "demo"` and `"isDemo": true`.
   - Responses include the HTTP header `X-Data-Source: demo`.
4. **Honest Synchronization:**
   - Calling `POST /api/integration/sync` in demo mode **never** falsely reports that live data was pulled.
   - It returns an honest message explaining that live sync is unavailable in demo mode, along with the seeded dataset counts.

---

## API Endpoints

### Health Check
- **`GET /api/health`**
- Verifies server health.
```json
{
  "status": "healthy",
  "service": "CustomerHub CRM Backend",
  "timestamp": "2026-10-13T09:30:00.000Z"
}
```

---

### Integration Status
- **`GET /api/integration/status`**
- Reports configuration state and masked credentials without leaking secrets.
- **Query Params:**
  - `ping=true` *(optional)*: Tests real-time connectivity against live WooCommerce if configured.

**Sample Response (Demo Mode):**
```json
{
  "isConfigured": false,
  "mode": "demo",
  "storeUrl": null,
  "consumerKeyMasked": null,
  "timeoutMs": 10000,
  "lastSync": null,
  "message": "Running in demo mode with sample data. Configure WOOCOMMERCE_* in backend/.env to connect to your live store."
}
```

**Sample Response (Live Mode):**
```json
{
  "isConfigured": true,
  "mode": "live",
  "storeUrl": "https://mystore.com",
  "consumerKeyMasked": "ck_9f...dcba",
  "timeoutMs": 10000,
  "lastSync": {
    "syncedAt": "2026-10-13T09:40:00.000Z",
    "durationMs": 420,
    "customerCount": 124,
    "orderCount": 540,
    "mode": "live",
    "success": true
  },
  "message": "WooCommerce credentials configured. Live API mode is active."
}
```

---

### Data Synchronization
- **`POST /api/integration/sync`**
- Fetches customers and orders, returns record counts and execution duration.

**Demo Mode Response:**
```json
{
  "success": false,
  "mode": "demo",
  "syncedAt": "2026-10-13T09:41:00.000Z",
  "durationMs": 0,
  "customerCount": 6,
  "orderCount": 11,
  "message": "Live sync is not available in demo mode. Configure WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in backend/.env to synchronize with your WooCommerce store.",
  "warning": "Demo mode active. Showing cached mock dataset counts only."
}
```

**Live Mode Success Response:**
```json
{
  "success": true,
  "mode": "live",
  "syncedAt": "2026-10-13T09:45:10.000Z",
  "durationMs": 512,
  "customerCount": 240,
  "orderCount": 890,
  "fetchedCustomers": 100,
  "fetchedOrders": 100,
  "message": "Successfully synchronized 240 customers and 890 orders from WooCommerce store in 512ms."
}
```

---

### Customers API
- **`GET /api/customers`**
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `per_page`: Records per page (default: 10, max: 100)
  - `search`: Filter by name, email, company, or username
  - `role`: Filter by customer role (e.g., `customer`)

- **`GET /api/customers/:id`**
- Returns a single customer by WooCommerce ID.

---

### Orders API
- **`GET /api/orders`**
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `per_page`: Records per page (default: 10, max: 100)
  - `customer`: Filter by customer ID (e.g. `?customer=101`)
  - `status`: Filter by status (`completed`, `processing`, `on-hold`, `refunded`, etc.)
  - `search`: Search by order ID, order key, billing name, or product item name

- **`GET /api/orders/:id`**
- Returns a single order by ID with line items, totals, billing, and shipping details.

---

## Running Tests

Run the full automated test suite verifying endpoints, security checks, and error handling:
```bash
npm test
```

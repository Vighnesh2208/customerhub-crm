/**
 * Integration Routes
 * 
 * Manages WooCommerce connection status and synchronizations.
 * Base path: /api/integration
 */

const express = require('express');
const router = express.Router();
const woocommerceService = require('../services/woocommerceService');

/**
 * GET /api/integration/status
 * Reports whether WooCommerce credentials are configured and returns status info.
 * Never exposes consumer secret or full keys.
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = woocommerceService.getStatus();

    // If caller specifically requests a live check and credentials are set
    if (req.query.ping === 'true' && status.isConfigured) {
      const pingResult = await woocommerceService.testConnection();
      return res.json({
        ...status,
        livePing: pingResult,
      });
    }

    return res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/integration/sync
 * Initiates customer & order synchronization from WooCommerce.
 * Reports counts and sync time, or reports failures honestly.
 * In demo mode, clearly declares that live sync is unavailable.
 */
router.post('/sync', async (req, res, next) => {
  try {
    const result = await woocommerceService.sync();

    // If it was in live mode but failed due to API / network errors
    if (!result.success && result.mode === 'live') {
      return res.status(result.statusCode || 502).json(result);
    }

    // Demo mode: Return honest status explaining credentials needed (200 with success: false)
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

/**
 * Order Routes
 * 
 * Manages order listing and details.
 * Automatically serves WooCommerce live data when configured,
 * or labeled realistic demo data otherwise.
 * Base path: /api/orders
 */

const express = require('express');
const router = express.Router();
const woocommerceService = require('../services/woocommerceService');

/**
 * GET /api/orders
 * Query params: page, per_page, status, customer, search
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await woocommerceService.getOrders(req.query);

    res.set({
      'X-Data-Source': result.source,
      'X-Total-Count': String(result.total),
      'X-Total-Pages': String(result.totalPages),
    });

    return res.json(result);
  } catch (err) {
    if (err.isWooCommerceError) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      });
    }
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Fetches a single order by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await woocommerceService.getOrderById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${req.params.id} not found`,
      });
    }

    res.set('X-Data-Source', result.source);
    return res.json(result);
  } catch (err) {
    if (err.isWooCommerceError) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      });
    }
    next(err);
  }
});

module.exports = router;

/**
 * Customer Routes
 * 
 * Manages customer listing and details.
 * Automatically serves WooCommerce live data when configured,
 * or labeled realistic demo data otherwise.
 * Base path: /api/customers
 */

const express = require('express');
const router = express.Router();
const woocommerceService = require('../services/woocommerceService');

/**
 * GET /api/customers
 * Query params: page, per_page, search, role
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await woocommerceService.getCustomers(req.query);

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
 * GET /api/customers/:id
 * Fetches a single customer by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await woocommerceService.getCustomerById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID ${req.params.id} not found`,
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

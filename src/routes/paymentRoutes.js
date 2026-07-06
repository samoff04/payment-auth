const express = require('express');
const {
  createPaymentIntent,
  getMyPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-intent', protect, createPaymentIntent);
router.get('/my-payments', protect, getMyPayments);

module.exports = router;
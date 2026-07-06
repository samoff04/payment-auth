const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

async function createPaymentIntent(req, res) {
  try {
    const { amount, currency = 'usd', description = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required' });
    }

    let user = await User.findById(req.user._id);

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: user.stripeCustomerId,
      description,
      automatic_payment_methods: { enabled: true }
    });

    await Payment.create({
      user: user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      description,
      status: 'pending'
    });

    res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: 'Payment intent creation failed', error: err.message });
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const intent = event.data.object;

  try {
    if (event.type === 'payment_intent.succeeded') {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'succeeded' }
      );
    } else if (event.type === 'payment_intent.payment_failed') {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'failed' }
      );
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: 'Webhook processing failed', error: err.message });
  }
}

async function getMyPayments(req, res) {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments', error: err.message });
  }
}

module.exports = { createPaymentIntent, handleWebhook, getMyPayments };
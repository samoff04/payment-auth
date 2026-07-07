# payment-auth

Payment authentication and processing module for a Payment based interface.

## Stack
- Node.js / Express
- MongoDB (Mongoose)
- JWT authentication
- Stripe payments

## Setup
1. npm install
2. Copy .env.example to .env and fill in real values
3. npm run dev

## Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/payments/create-intent
- GET /api/payments/my-payments
- POST /api/payments/webhook
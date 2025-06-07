import Stripe from 'stripe';

// Ensure that STRIPE_SECRET_KEY is set.
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version at the time of writing
  typescript: true,
});

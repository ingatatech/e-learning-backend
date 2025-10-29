import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/db";
import { Payment } from "../database/models/PaymentModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"]!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body required by Stripe
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const paymentRepo = AppDataSource.getRepository(Payment);

  switch (event.type) {
    case "payment_intent.succeeded":
      const pi = event.data.object as Stripe.PaymentIntent;
      await paymentRepo.update(
        { paymentIntentId: pi.id },
        { status: "succeeded" }
      );
      break;
    case "payment_intent.payment_failed":
      const failedPi = event.data.object as Stripe.PaymentIntent;
      await paymentRepo.update(
        { paymentIntentId: failedPi.id },
        { status: "failed" }
      );
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

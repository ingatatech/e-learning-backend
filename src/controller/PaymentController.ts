import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/db";
import { Payment } from "../database/models/PaymentModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount, currency, courseId, userId, metadata } = req.body;

  if (!amount || !courseId || !userId)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: currency || "usd",
      payment_method_types: ["card"],
      metadata: {
        courseId,
        userId,
        ...metadata,
      },
    });

    // Save payment record in DB
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = paymentRepo.create({
      paymentIntentId: paymentIntent.id,
      courseId,
      userId,
      amount,
      currency: currency || "usd",
      status: "pending",
      method: "card",
      metadata,
    });

    await paymentRepo.save(payment);

    return res.status(201).json({ clientSecret: paymentIntent.client_secret, payment });
  } catch (err) {
    console.error("Stripe createPaymentIntent error:", err);
    return res.status(500).json({ message: "Failed to create payment intent" });
  }
};


export const confirmPayment = async (req: Request, res: Response) => {
  const { paymentIntentId, courseId, userId, transactionId } = req.body;

  if (!paymentIntentId || !courseId || !userId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({ where: { paymentIntentId } });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Update status based on Stripe response
    const newStatus = paymentIntent.status === "succeeded" ? "succeeded" : paymentIntent.status;
    payment.status = newStatus;
    await paymentRepo.save(payment);

    // Optional: trigger course enrollment or activation if succeeded
    if (newStatus === "succeeded") {
      // TODO: call your enrollment activation logic here
    }

    return res.json({ message: "Payment confirmed", payment });
  } catch (err) {
    console.error("Payment confirmation error:", err);
    return res.status(500).json({ message: "Failed to confirm payment" });
  }
};


export const getPaymentStatus = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const paymentRepo = AppDataSource.getRepository(Payment);
  const payment = await paymentRepo.findOne({ where: { id: paymentId } });
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  return res.json(payment);
};
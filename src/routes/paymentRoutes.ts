import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { confirmPayment, createPaymentIntent, getPaymentStatus } from "../controller/PaymentController";

const router = Router();

router.post("/create-payment-intent", authenticateToken, createPaymentIntent);
router.post("/confirm", authenticateToken, confirmPayment);
router.get("/get-payment-status", authenticateToken, getPaymentStatus);

export default router;
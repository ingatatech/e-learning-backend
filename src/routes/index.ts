import { Router } from "express";

import activitiesRouter from "./activitiesRoutes";
import authRouter from "./authRoutes";
import organizationRoutes from './organizationRoutes'
import courseRoutes from './courseRoutes'
import enrollmentRoutes from './enrollmentRoutes'
import progressRoutes from './progressRoutes'
import answerRoutes from './answerRoutes'
import analyticsRoutes from './analyticsRoutes'
import documentRoutes from "./documentRoutes";
import certificateRoutes from "./certificateRoutes";
import paymentRoutes from "./paymentRoutes";
import reviewsRoutes from "./reviewsRoutes";
import categoryRoutes from "./categoryRoutes"

const router = Router();

router.use("/logs", activitiesRouter);
router.use("/auth", authRouter);
router.use("/organizations", organizationRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/progress", progressRoutes)
router.use("/answers", answerRoutes)
router.use("/stats", analyticsRoutes)
router.use("/docs", documentRoutes)
router.use("/certificates", certificateRoutes)
router.use("/payments", paymentRoutes)
router.use("/reviews", reviewsRoutes)
router.use("/categories", categoryRoutes)

export default router;
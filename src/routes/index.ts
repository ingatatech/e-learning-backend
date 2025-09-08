import { Router } from "express";

import activitiesRouter from "./activitiesRoutes";
import authRouter from "./authRoutes";
import organizationRoutes from './organizationRoutes'

const router = Router();

router.use("/logs", activitiesRouter);
router.use("/auth", authRouter);
router.use("/organizations", organizationRoutes);

export default router;
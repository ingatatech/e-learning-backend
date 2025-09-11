import { Router } from "express";

import activitiesRouter from "./activitiesRoutes";
import authRouter from "./authRoutes";
import organizationRoutes from './organizationRoutes'
import courseRoutes from './courseRoutes'

const router = Router();

router.use("/logs", activitiesRouter);
router.use("/auth", authRouter);
router.use("/organizations", organizationRoutes);
router.use("/courses", courseRoutes);

export default router;
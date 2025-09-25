import e, { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { getAdminStats, getOrgAdminStats } from "../controller/AnalyticsController";

const router = Router();

router.get("/", authenticateToken, getAdminStats);
router.get("/sysadmin/:orgId", authenticateToken, getOrgAdminStats);


export default router;

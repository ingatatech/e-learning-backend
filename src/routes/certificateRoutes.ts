import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { checkCertificate, issueCertificate } from "../controller/CertificateController";

const router = Router();

router.post("/", authenticateToken, issueCertificate);
router.get("/checkExists/user/:userId/course/:courseId", authenticateToken, checkCertificate);

export default router;
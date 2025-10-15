import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { checkCertificate, issueCertificate, verifyCertificate } from "../controller/CertificateController";

const router = Router();

router.post("/", authenticateToken, issueCertificate);
router.get("/checkExists/user/:userId/course/:courseId", authenticateToken, checkCertificate);
router.get("/verify/:code", verifyCertificate);

export default router;
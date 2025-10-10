
import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { changeDocumentStatus, createDocument, deleteDocument, getDocument, getInstructorDocuments, getSubmittedDocuments, submitDocument, updateDocument } from "../controller/DocumentController";

const router = Router();

router.post("/", authenticateToken, createDocument);
router.get("/instructor/:instructorId", authenticateToken, getInstructorDocuments);
router.get("/submitted", authenticateToken, getSubmittedDocuments);
router.get("/:docId", authenticateToken, getDocument);
router.put("/:docId", authenticateToken, updateDocument);
router.delete("/:docId", authenticateToken, deleteDocument);
router.post("/submit/:docId", authenticateToken, submitDocument);
router.post("/change-status/:docId", authenticateToken, changeDocumentStatus);


export default router;

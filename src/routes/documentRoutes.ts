
import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { changeDocumentStatus, createDocument, deleteDocument, downloadFile, getDocument, getInstructorDocuments, getSubmittedDocuments, submitDocument, updateDocument, uploadDocumentFile } from "../controller/DocumentController";
import { upload } from "../middleware/multer";

const router = Router();

router.post("/", authenticateToken, createDocument);
router.get("/instructor/:instructorId", authenticateToken, getInstructorDocuments);
router.get("/submitted", authenticateToken, getSubmittedDocuments);
router.get("/:docId", authenticateToken, getDocument);
router.put("/:docId", authenticateToken, updateDocument);
router.delete("/:docId", authenticateToken, deleteDocument);
router.post("/submit/:docId", authenticateToken, submitDocument);
router.post("/change-status/:docId", authenticateToken, changeDocumentStatus);
router.post("/upload-doc", upload.single("file"), uploadDocumentFile);
router.get("/download-doc/:id", authenticateToken, downloadFile);

/**
 * @swagger
 * /docs/upload-doc:
 *   post:
 *     summary: Upload document
 *     description: Upload a document (PDF or Word), extract content, and save it with instructor info.
 *     tags:
 *       - Doc
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - instructorId
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (PDF or DOCX)
 *               instructorId:
 *                 type: integer
 *                 example: 5
 *                 description: ID of the instructor uploading the document
 *               title:
 *                 type: string
 *                 example: "Introduction to Graphic Design"
 *                 description: Title of the document
 *     responses:
 *       200:
 *         description: Document uploaded and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Document uploaded successfully
 *                 documentUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/your-cloud/upload/v123456/course-doc.pdf
 *                 extractedContent:
 *                   type: string
 *                   example: "This course introduces the fundamentals of graphic design..."
 *       400:
 *         description: No file uploaded or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No file provided or invalid format
 *       403:
 *         description: User is not authorized to upload this document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       500:
 *         description: Internal server error while processing upload
 */




export default router;

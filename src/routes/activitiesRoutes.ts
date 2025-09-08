
import e, { Router } from "express";
import { hasRole } from "../middleware/RoleMiddleware";
import { authenticateToken } from "../middleware/JwtParsing";
import { getAllLogs, getLogsForFile, getLogsForFolder, getLogsForUser } from "../controller/ActivityController";

const router = Router();

router.get("/", authenticateToken, getAllLogs);
router.get("/file/:fileId", authenticateToken, getLogsForFile);
router.get("/folder/:folderId", authenticateToken, getLogsForFolder);
router.get("/user/:userId", authenticateToken, getLogsForUser);


/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Get all system activity logs (filtered by user permissions)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of logs per page (optional)
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       targetType:
 *                         type: string
 *                       targetId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       403:
 *         description: Forbidden - Invalid access
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /logs/file/{fileId}:
 *   get:
 *     summary: Get activity logs for a specific file
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the file
 *     responses:
 *       200:
 *         description: File logs retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /logs/folder/{folderId}:
 *   get:
 *     summary: Get activity logs for a specific folder
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the folder
 *     responses:
 *       200:
 *         description: Folder logs retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /logs/user/{userId}:
 *   get:
 *     summary: Get activity logs for a specific user
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User logs retrieved successfully
 *       500:
 *         description: Internal server error
 */

export default router;
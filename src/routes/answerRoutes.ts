import e, { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { getSubmissionsByInstructor, getUserAssessmentAnswers, gradeAssessmentManually, submitAnswer } from "../controller/AnswerController";
const router = Router();

/**
 * @swagger
 * /answers/submit:
 *   post:
 *     summary: Submit an answer for an assessment question
 *     description: Saves a user's answer for a given assessment question and calculates correctness + points.
 *     tags:
 *       - Answers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - assessmentId
 *               - questionId
 *               - answer
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "123"
 *               assessmentId:
 *                 type: string
 *                 example: "assessment-456"
 *               questionId:
 *                 type: string
 *                 example: "question-789"
 *               answer:
 *                 type: string
 *                 example: "B"
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 answer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "answer-001"
 *                     isCorrect:
 *                       type: boolean
 *                       example: true
 *                     pointsEarned:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User, assessment, or question not found
 *       500:
 *         description: Failed to submit answer
 */
router.post("/submit", authenticateToken, submitAnswer);

/**
 * @swagger
 * /answers/{assessmentId}/user/{userId}:
 *   get:
 *     summary: Get all answers for a specific assessment and user
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assessment
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: List of answers submitted by the user for this assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 answers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "answer-123"
 *                       questionId:
 *                         type: string
 *                         example: "question-456"
 *                       answer:
 *                         type: string
 *                         example: "B"
 *                       isCorrect:
 *                         type: boolean
 *                         example: true
 *                       pointsEarned:
 *                         type: number
 *                         example: 5
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: No answers found for the given user and assessment
 *       500:
 *         description: Server error
 */
router.get("/:assessmentId/user/:userId", authenticateToken, getUserAssessmentAnswers);


router.get("/:instructorId/submissions", authenticateToken, getSubmissionsByInstructor);

router.post("/grade-manually", authenticateToken, gradeAssessmentManually);




export default router;

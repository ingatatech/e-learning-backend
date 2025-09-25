// routes/enrollmentRoutes.ts
import { Router } from "express";
import { enrollInCourse, enrollMultipleStudents, getUserEnrollments, removeStudentsFromCourse } from "../controller/EnrollmentController";

const router = Router();

/**
 * @swagger
 * /enrollments/enroll:
 *   post:
 *     summary: Enroll a user in a course
 *     description: Adds a user to the enrollment table for a specific course and updates the course's enrollment count.
 *     tags:
 *       - Enrollment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - courseId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 12
 *               courseId:
 *                 type: integer
 *                 example: 34
 *     responses:
 *       201:
 *         description: User enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User enrolled successfully
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: active
 *                     progress:
 *                       type: number
 *                       example: 0
 *                     enrolledAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-12T08:00:00.000Z"
 *                 enrollmentCount:
 *                   type: integer
 *                   example: 25
 *       400:
 *         description: User already enrolled or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already enrolled in this course
 *       404:
 *         description: User or course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course not found
 *       500:
 *         description: Failed to enroll user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to enroll user
 */
router.post("/enroll", enrollInCourse);

router.post("/enrollMultiple", enrollMultipleStudents);


router.post("/remove", removeStudentsFromCourse);


/**
 * @swagger
 * /enrollments/user-enrollments:
 *   post:
 *     summary: Get all courses a user is enrolled in
 *     tags: [Enrollment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of courses the user is enrolled in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User enrollments fetched successfully
 *                 enrollments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseId:
 *                         type: integer
 *                       courseTitle:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       status:
 *                         type: string
 *                         description: Enrollment status, e.g., active, completed
 *                       progress:
 *                         type: number
 *                         description: Progress in percentage
 *       404:
 *         description: No enrollments found
 *       500:
 *         description: Failed to fetch enrollments
 */
router.post("/user-enrollments", getUserEnrollments);




export default router;

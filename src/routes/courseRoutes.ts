
import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { createCourse, deleteCourse, getCourseById, getCoursesByInstructor, getCoursesByOrganization, getCoursesWithEnrollmentStatus, getStudentsByCourse, getStudentsByInstructor, updateCourse, uploadCourseThumbnail, uploadLessonImage } from "../controller/CourseController";
import { hasRole } from "../middleware/RoleMiddleware";
const router = Router();
import { upload } from "../middleware/multer";



/**
 * @swagger
 * /courses/create:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Intro to TypeScript"
 *               description:
 *                 type: string
 *                 example: "Learn TypeScript from scratch"
 *               thumbnail:
 *                 type: string
 *                 nullable: true
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "beginner"
 *               price:
 *                 type: number
 *                 example: 50
 *               isPublished:
 *                 type: boolean
 *                 example: false
 *               duration:
 *                 type: number
 *                 example: 120
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["typescript","programming"]
 *               instructorId:
 *                 type: string
 *                 example: "1"
 *               organizationId:
 *                 type: string
 *                 nullable: true
 *                 example: "1"
 *               certificateIncluded:
 *                 type: boolean
 *                 example: true
 *               language:
 *                 type: string
 *                 example: "English"
 *               about:
 *                 type: string
 *                 example: "This course covers the fundamentals of TypeScript..."
 *               whatYouWillLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Understand TypeScript basics", "Work with interfaces", "Use generics effectively"]
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Basic JavaScript knowledge", "Node.js installed"]
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Module 1"
 *                     description:
 *                       type: string
 *                       example: "Basics"
 *                     order:
 *                       type: number
 *                       example: 1
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Lesson 1"
 *                           content:
 *                             type: string
 *                             example: "Introduction to TypeScript"
 *                           videoUrl:
 *                             type: string
 *                             nullable: true
 *                           duration:
 *                             type: number
 *                             example: 30
 *                           order:
 *                             type: number
 *                             example: 1
 *                           isProject:
 *                             type: boolean
 *                             example: false
 *                           isExercise:
 *                             type: boolean
 *                             example: false
 *                           resources:
 *                             type: array
 *                             description: "Array of resource objects for the lesson"
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   description: "Title of the resource"
 *                                   example: "TypeScript Handbook"
 *                                 url:
 *                                   type: string
 *                                   description: "URL to access the resource"
 *                                   example: "https://example.com/typescript-handbook.pdf"
 *                                 description:
 *                                   type: string
 *                                   description: "Description of the resource"
 *                                   example: "Official TypeScript documentation and handbook"
 *                           assessments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: "Quiz 1"
 *                                 description:
 *                                   type: string
 *                                   example: "Basic concepts quiz"
 *                                 type:
 *                                   type: string
 *                                   enum: [quiz, assignment, project]
 *                                   example: "quiz"
 *                                 questions:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       question:
 *                                         type: string
 *                                         example: "What is TypeScript?"
 *                                       type:
 *                                         type: string
 *                                         enum: [multiple_choice, true_false, short_answer, essay]
 *                                         example: "multiple_choice"
 *                                       options:
 *                                         type: array
 *                                         items:
 *                                           type: string
 *                                         example: ["JS superset", "Library", "Framework"]
 *                                       correctAnswer:
 *                                         type: string
 *                                         example: "JS superset"
 *                                       points:
 *                                         type: number
 *                                         example: 10
 *                                 passingScore:
 *                                   type: number
 *                                   example: 70
 *                                 timeLimit:
 *                                   type: number
 *                                   nullable: true
 *                                   example: 30
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course created successfully"
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid input
 */
router.post("/create", authenticateToken, hasRole(['admin', 'sysadmin', 'instructor']), createCourse);


/**
 * @swagger
 * /courses/upload-thumbnail:
 *   post:
 *     summary: Upload a course thumbnail image
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (jpg, png, webp)
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Thumbnail uploaded"
 *                 thumbnailUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/abcd.jpg"
 *       400:
 *         description: Bad request, e.g., no file or wrong format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Internal server error
 */
router.post("/upload-thumbnail", upload.single("thumbnail"), uploadCourseThumbnail);


router.post("/upload-lesson-img", upload.single("lessonImg"), uploadLessonImage);

/**
 * @swagger
 * /courses/get/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course fetched successfully
 *                 course:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     thumbnail:
 *                       type: string
 *                       nullable: true
 *                     level:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced]
 *                     price:
 *                       type: number
 *                     isPublished:
 *                       type: boolean
 *                     duration:
 *                       type: number
 *                     enrollmentCount:
 *                       type: number
 *                     rating:
 *                       type: number
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     instructorId:
 *                       type: string
 *                     organizationId:
 *                       type: string
 *                       nullable: true
 *                     modules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           order:
 *                             type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Course not found
 */
router.get("/get/:id", authenticateToken, getCourseById);


router.get("/get/:courseId/students", authenticateToken, getStudentsByCourse);


router.get("/instructor/:instructorId/students/", authenticateToken, getStudentsByInstructor);


/**
 * @swagger
 * /courses/instructor/{instructorId}/courses:
 *   get:
 *     summary: Get all courses for a specific instructor
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the instructor
 *     responses:
 *       200:
 *         description: List of courses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Courses fetched successfully
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       level:
 *                         type: string
 *                       price:
 *                         type: number
 *                       isPublished:
 *                         type: boolean
 *                       duration:
 *                         type: number
 *                       enrollmentCount:
 *                         type: number
 *                       rating:
 *                         type: number
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       instructor:
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
 *                           role:
 *                             type: string
 *                       organization:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       modules:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             description:
 *                               type: string
 *                             order:
 *                               type: number
 *                             lessons:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   content:
 *                                     type: string
 *                                   videoUrl:
 *                                     type: string
 *                                   duration:
 *                                     type: number
 *                                   order:
 *                                     type: number
 *                                   assessments:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: string
 *                                         title:
 *                                           type: string
 *                                         description:
 *                                           type: string
 *                                         type:
 *                                           type: string
 *                                         passingScore:
 *                                           type: number
 *                                         timeLimit:
 *                                           type: number
 *                                         questions:
 *                                           type: array
 *                                           items:
 *                                             type: object
 *                                             properties:
 *                                               id:
 *                                                 type: string
 *                                               question:
 *                                                 type: string
 *                                               type:
 *                                                 type: string
 *                                               options:
 *                                                 type: array
 *                                                 items:
 *                                                   type: string
 *                                               correctAnswer:
 *                                                 type: string
 *                                               points:
 *                                                 type: number
 *       404:
 *         description: No courses found for the given instructor
 *       500:
 *         description: Failed to fetch courses
 */
router.get("/instructor/:instructorId/courses", authenticateToken, getCoursesByInstructor);


/**
 * @swagger
 * /courses/organization/{orgId}/courses:
 *   get:
 *     summary: Get all courses for a specific organization
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the organization
 *     responses:
 *       200:
 *         description: List of courses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Courses fetched successfully
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       level:
 *                         type: string
 *                       price:
 *                         type: number
 *                       isPublished:
 *                         type: boolean
 *                       duration:
 *                         type: number
 *                       enrollmentCount:
 *                         type: number
 *                       rating:
 *                         type: number
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       instructor:
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
 *                           role:
 *                             type: string
 *                       organization:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       modules:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             description:
 *                               type: string
 *                             order:
 *                               type: number
 *                             lessons:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   content:
 *                                     type: string
 *                                   videoUrl:
 *                                     type: string
 *                                   duration:
 *                                     type: number
 *                                   order:
 *                                     type: number
 *                                   assessments:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: string
 *                                         title:
 *                                           type: string
 *                                         description:
 *                                           type: string
 *                                         type:
 *                                           type: string
 *                                         passingScore:
 *                                           type: number
 *                                         timeLimit:
 *                                           type: number
 *                                         questions:
 *                                           type: array
 *                                           items:
 *                                             type: object
 *                                             properties:
 *                                               id:
 *                                                 type: string
 *                                               question:
 *                                                 type: string
 *                                               type:
 *                                                 type: string
 *                                               options:
 *                                                 type: array
 *                                                 items:
 *                                                   type: string
 *                                               correctAnswer:
 *                                                 type: string
 *                                               points:
 *                                                 type: number
 *       404:
 *         description: No courses found for the given instructor
 *       500:
 *         description: Failed to fetch courses
 */
router.get("/organization/:orgId/courses", authenticateToken, getCoursesByOrganization);


/**
 * @swagger
 * /courses/update/{id}:
 *   put:
 *     summary: Update a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 description: URL of the course thumbnail
 *               level:
 *                 type: integer
 *               price:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *               duration:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructorId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           videoUrl:
 *                             type: string
 *                           duration:
 *                             type: number
 *                           order:
 *                             type: integer
 *                           assessments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                   enum: [quiz, assignment, project]
 *                                 passingScore:
 *                                   type: number
 *                                 timeLimit:
 *                                   type: number
 *                                 questions:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       question:
 *                                         type: string
 *                                       type:
 *                                         type: string
 *                                         enum: [multiple_choice, true_false, short_answer, essay]
 *                                       options:
 *                                         type: array
 *                                         items:
 *                                           type: string
 *                                       correctAnswer:
 *                                         type: string
 *                                       points:
 *                                         type: number
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course updated successfully
 *       400:
 *         description: Invalid input / Instructor or Organization not found
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put("/update/:id", authenticateToken, updateCourse);


/**
 * @swagger
 * /courses/delete/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course deleted successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete("/delete/:id", authenticateToken, deleteCourse);


/**
 * @swagger
 * /courses/enrollment-status:
 *   post:
 *     summary: Get all courses with enrollment status for a specific user
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to check enrollments
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of courses with enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Courses fetched successfully
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       instructor:
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
 *                       isEnrolled:
 *                         type: boolean
 *                         description: Whether the user is enrolled in the course
 *       401:
 *         description: Unauthorized, userId not provided
 *       500:
 *         description: Failed to fetch courses
 */
router.post("/enrollment-status", getCoursesWithEnrollmentStatus);


export default router;
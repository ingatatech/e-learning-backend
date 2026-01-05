
import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { createCourse, deleteAssessment, deleteCourse, deleteLesson, deleteModule, getCourseById, getCoursesByInstructor, getCoursesByOrganization, getCoursesByOrganizationOuter, getCoursesWithEnrollmentStatus, getDraftCoursesByOrganization, getInstructorAssessments, getLiveCoursesByInstructor, getPopularCourses, getStudentsByCourse, getStudentsByInstructor, publishCourse, updateCourse, updateCourseModules, uploadCourseThumbnail, uploadLessonImage, uploadLessonVideo } from "../controller/CourseController";
import { hasRole } from "../middleware/RoleMiddleware";
const router = Router();
import { upload } from "../middleware/multer";



router.post("/create", authenticateToken, hasRole(['admin', 'sysadmin', 'instructor']), createCourse);

router.get("/popular", authenticateToken, getPopularCourses);

router.post("/:courseId/publish", authenticateToken, publishCourse);

router.post("/upload-thumbnail", upload.single("thumbnail"), uploadCourseThumbnail);


router.post("/upload-lesson-img", upload.single("lessonImg"), uploadLessonImage);

router.post("/upload-lesson-vid", upload.single("lessonVid"), uploadLessonVideo);

router.get("/get/:id", authenticateToken, getCourseById);

router.get("/get/:courseId/students", authenticateToken, getStudentsByCourse);


router.get("/instructor/:instructorId/students/", authenticateToken, getStudentsByInstructor);

router.get("/instructor/:instructorId/courses", authenticateToken, getCoursesByInstructor);

router.get("/instructor/:instructorId/live/courses", authenticateToken, getLiveCoursesByInstructor);

router.get("/organization/:orgId/courses", authenticateToken, getCoursesByOrganization);

router.get("/organization-outer/:orgId/courses", getCoursesByOrganizationOuter);

router.get("/organization/:orgId/draft/courses", authenticateToken, getDraftCoursesByOrganization);

router.put("/update/:id", authenticateToken, updateCourse);

router.put("/update-modules/:id", authenticateToken, updateCourseModules);

router.delete("/delete/:id", authenticateToken, deleteCourse);

router.post("/enrollment-status", getCoursesWithEnrollmentStatus);


router.delete("/lesson/:id", authenticateToken, deleteLesson);
router.delete("/assessment/:id", authenticateToken, deleteAssessment);
router.delete("/module/:id", authenticateToken, deleteModule);

export default router;
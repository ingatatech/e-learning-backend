import { Router } from "express";
import { authenticateToken } from "../middleware/JwtParsing";
import { createOrUpdateReview, deleteReview, getCourseReviews, getUserReviewForCourse, getUserReviews } from "../controller/ReviewController";

const router = Router();

router.post("/", authenticateToken, createOrUpdateReview);
router.get("/course/:courseId", authenticateToken, getCourseReviews);
router.get("/user/:userId", authenticateToken, getUserReviews);
router.delete("/:review", authenticateToken, deleteReview);
router.delete("/course/:courseId/user/:userId", authenticateToken, getUserReviewForCourse);

export default router;
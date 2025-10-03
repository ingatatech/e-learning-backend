import { Router } from "express"
import { getUserProgress, completeStep, updateCurrentStep, markStepPending, retakeAssessment } from "../controller/ProgressController"

const router = Router()

// GET progress of a user in a course
router.get("/course/:courseId/user/:userId/", getUserProgress)

// COMPLETE step
router.post("/complete-step", completeStep)

// PENDING step
router.post("/pending-step", markStepPending)

// UPDATE progress
router.put("/update-current-step", updateCurrentStep)

// RETAKE assessment
router.put("/retake-assessment", retakeAssessment)

export default router

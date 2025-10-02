import { Router } from "express"
import { getUserProgress, completeStep, updateCurrentStep, markStepPending } from "../controller/ProgressController"

const router = Router()

// GET progress of a user in a course
router.get("/course/:courseId/user/:userId/", getUserProgress)

// COMPLETE step
router.post("/complete-step", completeStep)

// PENDING step
router.post("/pending-step", markStepPending)

// UPDATE progress
router.put("/update-current-step", updateCurrentStep)

export default router

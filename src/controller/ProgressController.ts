import { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Progress } from "../database/models/ProgressModel"
import { Users } from "../database/models/UserModel"
import { Course } from "../database/models/CourseModel"
import { Assessment } from "../database/models/AssessmentModel"
import { Lesson } from "../database/models/LessonModel"
import { excludePassword } from "../utils/excludePassword"
import { Enrollment } from "../database/models/EnrollmentModel"

const progressRepo = AppDataSource.getRepository(Progress)
const userRepo = AppDataSource.getRepository(Users)
const courseRepo = AppDataSource.getRepository(Course)

// Get user progress for a course
export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.params

    // Fetch all progress rows for this user and course
    const progressRows = await progressRepo.find({
      where: { user: { id: Number(userId) }, course: { id: courseId } },
      relations: ["lesson", "assessment", "user", "course"],
      order: { completedAt: "ASC" }, 
    })

    // Map to completedSteps
    const completedSteps = progressRows.map((row) => ({
      dbId: row.id,
      lessonId: row.lessonId || null,
      assessmentId: row.assessmentId || null,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt,
      score: row.score,
    }))

    // If no progress exists, initialize empty array
    const response = {
      courseId: Number(courseId),
      userId: Number(userId),
      completedSteps,
      overallProgress: 0, // can be calculated in frontend
      currentStepId: "",   // optional, can track separately
      lastAccessedAt: progressRows.length > 0 ? progressRows[progressRows.length - 1].lastAccessedAt : new Date().toISOString(),
    }

    res.json({ progress: response })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch progress" })
  }
}


export const completeStep = async (req: Request, res: Response) => {
  try {
    const { courseId, userId, lessonId, assessmentId, score, status, isCompleted=true } = req.body

    const progressRepo = AppDataSource.getRepository(Progress)
    const enrollmentRepo = AppDataSource.getRepository(Enrollment)

    let progress = await progressRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
        ...(lessonId ? { lesson: { id: lessonId } } : {}),
        ...(assessmentId ? { assessment: { id: assessmentId } } : {}),
      },
      relations: ["lesson", "assessment"],
    })

    if (!progress) {
      progress = progressRepo.create({
        user: { id: userId } as Users,
        course: { id: courseId } as Course,
        lesson: lessonId ? ({ id: lessonId } as Lesson) : undefined,
        assessment: assessmentId ? ({ id: assessmentId } as Assessment) : undefined,
        isCompleted: isCompleted,
        score,
      })
    } else {
      if (req.body.ready) progress.isCompleted = true
      if (score !== undefined) progress.score = score
    }

    await progressRepo.save(progress)

    // Update enrollment status to "in_progress" if it's still "not_started"
    const enrollment = await enrollmentRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
    })

    if (enrollment && enrollment.status !== "in_progress" && enrollment.status !== "completed") {
      enrollment.status = status || "in_progress"
      await enrollmentRepo.save(enrollment)
    }

    return res.json({ success: true, progress })
  } catch (err) {
    console.error("Error completing step:", err)
    return res.status(500).json({ error: "Failed to complete step" })
  }
}


export const updateCurrentStep = async (req: Request, res: Response) => {
  try {
    const { courseId, userId, lessonId, assessmentId } = req.body

    let progress = await progressRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
        ...(lessonId ? { lesson: { id: lessonId } } : {}),
        ...(assessmentId ? { assessment: { id: assessmentId } } : {}),
      },
      relations: ["lesson", "assessment"],
    })

    if (!progress) {
      // If no progress exists, create a new "bookmark"
      progress = progressRepo.create({
        user: { id: userId } as Users,
        course: { id: courseId } as Course,
        lesson: lessonId ? ({ id: lessonId } as Lesson) : undefined,
        assessment: assessmentId ? ({ id: assessmentId } as Assessment) : undefined,
        isCompleted: false, // bookmark, not finished
      })
    }

    progress.lastAccessedAt = new Date() // update timestamp

    await progressRepo.save(progress)

    return res.json({ success: true, progress })
  } catch (err) {
    console.error("Error updating current step:", err)
    return res.status(500).json({ error: "Failed to update current step" })
  }
}


// controllers/enrollmentController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Enrollment } from "../database/models/EnrollmentModel";
import { Users } from "../database/models/UserModel";
import { Course } from "../database/models/CourseModel";
import { excludePassword } from "../utils/excludePassword";

export const enrollInCourse = async (req: Request, res: Response) => {
  const { userId, courseId } = req.body;

  try {
    const userRepo = AppDataSource.getRepository(Users);
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    const user = await userRepo.findOne({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const course = await courseRepo.findOne({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if already enrolled
    const existing = await enrollmentRepo.findOne({
      where: { user: { id: user.id }, course: { id: course.id } },
    });
    if (existing) return res.status(400).json({ message: "User already enrolled in this course" });

    // Create enrollment
    const enrollment = enrollmentRepo.create({
      user,
      course,
      status: "active",
      progress: 0,
    });

    await enrollmentRepo.save(enrollment);

    // Update enrollment count on course
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await courseRepo.save(course);

    return res.status(201).json({
      message: "User enrolled successfully",
      enrollment,
      enrollmentCount: course.enrollmentCount,
    });
  } catch (err) {
    console.error("Enrollment error:", err);
    return res.status(500).json({ message: "Failed to enroll user" });
  }
};

export const getUserEnrollments = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const enrollmentRepo = AppDataSource.getRepository(Enrollment);

  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const enrollments = await enrollmentRepo.find({
      where: { user: { id: Number(userId) } },
      relations: ["course", "course.instructor", "course.organization"],
      order: { enrolledAt: "DESC" },
    });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No enrollments found for this user" });
    }

    // sanitize instructor info
    const sanitized = enrollments.map((enrollment) => ({
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      thumbnail: enrollment.course.thumbnail,
      status: enrollment.status,
      progress: enrollment.progress,
      instructor: excludePassword(enrollment.course.instructor),
    }));

    res.status(200).json({ message: "User enrollments fetched successfully", enrollments: sanitized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user enrollments" });
  }
};



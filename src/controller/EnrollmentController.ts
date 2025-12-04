// controllers/enrollmentController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Enrollment } from "../database/models/EnrollmentModel";
import { Users } from "../database/models/UserModel";
import { Course } from "../database/models/CourseModel";
import { excludePassword } from "../utils/excludePassword";
import { getOrCreateUser } from "../utils/createUser";
import { sendEnrollmentEmail } from "../services/SessionOtp";

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

    const existing = await enrollmentRepo.findOne({
      where: { user: { id: user.id }, course: { id: course.id } },
    });
    if (existing)
      return res.status(400).json({ message: "User already enrolled in this course" });

    const enrolledAt = new Date();
    let completedAt: Date | null = null;

    // if course has duration (in hours)
    if (course.duration && course.duration > 0) {
      completedAt = new Date(enrolledAt.getTime() + course.duration * 60 * 60 * 1000);
    }

    const enrollment = enrollmentRepo.create({
      course,
      user,
      status: "not_started",
      progress: 0,
      enrolledAt,
      completedAt,
    });

    await enrollmentRepo.save(enrollment);

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



export const enrollMultipleStudents = async (req: Request, res: Response) => {
  const { students, courseId } = req.body; 

  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const userRepo = AppDataSource.getRepository(Users);

    const course = await courseRepo.findOne({ where: { id: courseId }, relations: ["instructor"] });
    if (!course) return res.status(404).json({ message: "Course not found" });

    let enrollments: Enrollment[] = [];
    let createdUsers: Users[] = [];
    let skipped: string[] = [];

    for (const student of students) {
      let user = await userRepo.findOne({ where: { email: student.email } });

      if (!user) {
        // Create new user
        user = await getOrCreateUser({
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          role: student.role || "student",
          organizationId: student.organizationId,
          req,
        });
        await userRepo.save(user);
        createdUsers.push(user);

      }

      // Check if already enrolled
      const existing = await enrollmentRepo.findOne({
        where: { user: { id: user.id }, course: { id: course.id } },
      });
      if (existing) {
        skipped.push(user.email);
        continue;
      }

      // Create enrollment
      const enrollment = enrollmentRepo.create({
        user,
        course,
        status: "not_started",
        progress: 0,
      });
      await enrollmentRepo.save(enrollment);
      enrollments.push(enrollment);

      // Send enrollment notification
      await sendEnrollmentEmail(
        user.email,
        user.lastName,
        user.firstName,
        [{ title: course.title, instructorName: `${course.instructor?.firstName || ""} ${course.instructor?.lastName || ""}`, startUrl: `${process.env.FRONTEND_URL}/courses/${course.id}/learn` }],
        req
      );
    }

    // Update enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + enrollments.length;
    await courseRepo.save(course);

    return res.status(201).json({
      message: "Batch enrollment complete",
      totalAdded: enrollments.length,
      totalCreatedUsers: createdUsers.length,
      skippedAlreadyEnrolled: skipped,
      enrollmentCount: course.enrollmentCount,
    });
  } catch (err) {
    console.error("Batch enrollment error:", err);
    return res.status(500).json({ message: "Failed to enroll students" });
  }
};



export const getUserEnrollments = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const enrollmentRepo = AppDataSource.getRepository(Enrollment);

  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const enrollments = await enrollmentRepo.find({
      where: { user: { id: Number(userId) } },
      relations: ["course", "course.instructor", "course.organization", "course.reviews"],
      order: { enrolledAt: "DESC" },
    });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No enrollments found for this user" });
    }

    // sanitize instructor info
    const sanitized = enrollments.map((enrollment) => {
    const { instructor, organization, ...courseData } = enrollment.course;

    return {
      status: enrollment.status,
      progress: enrollment.progress,
      student: excludePassword(enrollment.user),
      enrolledAt: enrollment.enrolledAt,
      deadline: enrollment.completedAt,
      updatedAt: enrollment.updatedAt,
      course: courseData,
      instructor: {
        id: instructor?.id,
        firstName: instructor?.firstName,
        lastName: instructor?.lastName,
        email: instructor?.email,
      },
    };
  });

    res.status(200).json({ message: "User enrollments fetched successfully", enrollments: sanitized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user enrollments" });
  }
};



export const removeStudentsFromCourse = async (req: Request, res: Response) => {
  const { studentIds, courseId } = req.body; 

  if (!courseId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: "courseId and studentIds are required" });
  }

  try {
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const courseRepo = AppDataSource.getRepository(Course);

    const course = await courseRepo.findOne({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Remove enrollments
    const result = await enrollmentRepo
      .createQueryBuilder()
      .delete()
      .where("courseId = :courseId", { courseId: course.id })
      .andWhere("userId IN (:...studentIds)", { studentIds })
      .execute();

    // Update course enrollment count
    course.enrollmentCount = Math.max((course.enrollmentCount || 0) - studentIds.length, 0);
    await courseRepo.save(course);

    return res.status(200).json({
      message: "Students removed from course successfully",
      removedCount: result.affected || 0,
      enrollmentCount: course.enrollmentCount,
    });
  } catch (err) {
    console.error("Error removing students:", err);
    return res.status(500).json({ message: "Failed to remove students" });
  }
};



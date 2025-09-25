import { Between, MoreThanOrEqual } from "typeorm";
import { startOfMonth, endOfMonth } from "date-fns";
import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Course } from "../database/models/CourseModel";
import { Enrollment } from "../database/models/EnrollmentModel";
import { Organization } from "../database/models/OrganizationModel";
import { Users } from "../database/models/UserModel";
import { Not } from "typeorm";

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(Users);
    const courseRepo = AppDataSource.getRepository(Course);
    const orgRepo = AppDataSource.getRepository(Organization);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    // Users (exclude admins)
    const totalUsers = await userRepo.count({ where: { role: Not("admin") } });
    const newUsersThisMonth = await userRepo.count({
      where: { role: Not("admin"), createdAt: Between(start, end) },
    });

    // Courses
    const totalCourses = await courseRepo.count();
    const coursesPublishedThisMonth = await courseRepo.count({
      where: { createdAt: Between(start, end) },
    });

    // Orgs
    const totalOrganizations = await orgRepo.count();
    const organizationsThisMonth = await orgRepo.count({
      where: { createdAt: Between(start, end) },
    });

    // Revenue (this month + total)
    const enrollments = await enrollmentRepo.find({
      relations: ["course"],
    });

    const toNumber = (value: any) => Number(value) || 0;

    const totalRevenue = enrollments.reduce(
      (sum, e) => sum + toNumber(e.course?.price),
      0
    );

    const revenueThisMonth = enrollments
  .filter((e) => e.enrolledAt >= start && e.enrolledAt <= end)
  .reduce((sum, e) => sum + toNumber(e.course?.price), 0);

    return res.json({
      sucess: true,
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalCourses,
        coursesPublishedThisMonth,
        totalOrganizations,
        organizationsThisMonth,
        totalRevenue: Math.round(totalRevenue),
        revenueThisMonth: Math.round(revenueThisMonth),
      }
    });
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    return res.status(500).json({ error: "Failed to fetch admin stats" });
  }
};


export const getOrgAdminStats = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params; 

    const userRepo = AppDataSource.getRepository(Users);
    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    const start = startOfMonth(new Date());

    // Users (students + instructors) in this org, excluding admins
    const totalUsers = await userRepo.count({
      where: { organization: { id: Number(orgId) }, role: Not("admin") },
    });

    const newUsersThisMonth = await userRepo.count({
      where: {
        organization: { id: Number(orgId) },
        role: Not("admin"),
        createdAt: MoreThanOrEqual(start),
      },
    });

    // Courses under this org
    const totalCourses = await courseRepo.count({
      where: { organization: { id: Number(orgId) } },
    });

    const coursesPublishedThisMonth = await courseRepo.count({
      where: {
        organization: { id: Number(orgId) },
        createdAt: MoreThanOrEqual(start),
      },
    });

    // Enrollments in org’s courses
    const enrollments = await enrollmentRepo.find({
      where: { course: { organization: { id: Number(orgId) } } },
      relations: ["course"],
    });

    const toNumber = (v: any) => Number(v) || 0;

    const totalRevenue = enrollments.reduce(
      (sum, e) => sum + toNumber(e.course?.price),
      0
    );

    const revenueThisMonth = enrollments
      .filter((e) => e.enrolledAt >= start)
      .reduce((sum, e) => sum + toNumber(e.course?.price), 0);

    return res.json({
      totalUsers,
      newUsersThisMonth,
      totalCourses,
      coursesPublishedThisMonth,
      totalRevenue: Math.round(totalRevenue),
      revenueThisMonth: Math.round(revenueThisMonth),
      totalEnrollments: enrollments.length,
      enrollmentsThisMonth: enrollments.filter(
        (e) => e.enrolledAt >= start
      ).length,
    });
  } catch (err) {
    console.error("Failed to fetch org admin stats:", err);
    return res.status(500).json({ error: "Failed to fetch org admin stats" });
  }
};


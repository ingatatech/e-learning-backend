import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Certificate } from "../database/models/CertificateModel";
import { Users } from "../database/models/UserModel";
import { Course } from "../database/models/CourseModel";
import { randomUUID } from "crypto"; 

export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, courseName, score } = req.body;

    if (!userId || !courseId || !courseName || score === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRepo = AppDataSource.getRepository(Users);
    const courseRepo = AppDataSource.getRepository(Course);
    const certRepo = AppDataSource.getRepository(Certificate);

    const user = await userRepo.findOneBy({ id: userId });
    const course = await courseRepo.findOneBy({ id: courseId });

    if (!user || !course) {
      return res.status(404).json({ error: "User or course not found" });
    }

    // prevent duplicate certificate
    const existing = await certRepo.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });
    if (existing) {
      return res.status(400).json({ error: "Certificate already issued for this user/course" });
    }

    const code = randomUUID();

    const certificate = certRepo.create({
      user,
      course,
      score,
      code,
    });

    await certRepo.save(certificate);

    return res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (err) {
    console.error("Error issuing certificate:", err);
    res.status(500).json({ error: "Failed to issue certificate" });
  }
};


export const checkCertificate = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.params;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing userId or courseId" });
    }

    const certificateRepo = AppDataSource.getRepository(Certificate);

    const certificate = await certificateRepo.findOne({
      where: {
        user: { id: Number(userId) },
        course: { id: courseId },
      },
      relations: ["user", "course"],
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    return res.json({
      issuedAt: certificate.issuedAt,
      code: certificate.code,
    });
  } catch (err) {
    console.error("Error checking certificate:", err);
    return res.status(500).json({ error: "Failed to check certificate" });
  }
};


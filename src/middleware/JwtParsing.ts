import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

import { AppDataSource } from "../config/db";
import { Users } from "../database/models/UserModel";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

interface CustomRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  let authHeader = req.header("Authorization");
  const tokenFromCookie = req.cookies?.accessToken; // Token from cookies

  // Sanitize Authorization Header
  if (authHeader?.startsWith("Bearer Bearer ")) {
    authHeader = authHeader.replace("Bearer Bearer ", "Bearer ");
  }

  // Extract Token
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : tokenFromCookie;

  if (!token) {
     res.status(401).json({ message: "Unauthorized: No token provided." });
     return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    const userRepo = AppDataSource.getRepository(Users);
    const user = await userRepo.findOne({
      where: { id: decoded.id },
      relations: ['organization'], 
    });

    if (!user) {
      res.status(401).json({ message: "Users not found" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      preferredLanguage: user.preferredLanguage,
      theme: user.theme,
      totalPoints: user.totalPoints,
      level: user.level,
      streakDays: user.streakDays,
      organizationId: user.organization?.id,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
       res.status(403).json({ message: "Unauthorized: Invalid or malformed token." });
       return;
    }
    if (error instanceof Error) {
    } else {
    }
     res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

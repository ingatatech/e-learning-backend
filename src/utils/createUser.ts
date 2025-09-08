
import { sendCreds } from "../services/SessionOtp";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generateStrongPassword";
import { AppDataSource } from "../config/db";
import { Users } from "../database/models/UserModel";
import { Request } from "express";
import { Organization } from "../database/models/OrganizationModel";


interface OrgAdminData {
  email: string;
  firstName: string;
  lastName: string;
  req: Request;
  organizationId?: number;
  role?: string;
}

const userRepo = AppDataSource.getRepository(Users);


export const getOrCreateUser = async ({ email, firstName, lastName, req, organizationId, role }: OrgAdminData) => {
  let user = await userRepo.findOne({ where: { email }, relations: ['organization'] });
  const tempPassword = generateStrongPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  if (!user) {
    user = userRepo.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      isActive: true,
      isEmailVerified: false,
      preferredLanguage: "en",
      theme: "light",
      totalPoints: 0,
      level: 1,
      streakDays: 0,
    });
  }

  if (organizationId) {
    const org = await AppDataSource.getRepository(Organization).findOneBy({ id: organizationId });
    if (org) user.organization = org;
  }

  user = await userRepo.save(user);


  if (!user.password || user.password === hashedPassword) {
    await sendCreds(email, lastName, firstName, req, tempPassword);
  }

  return user;
};


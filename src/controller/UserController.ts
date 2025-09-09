import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Users } from "../database/models/UserModel";
import { AppDataSource } from "../config/db";
import bcrypt, { compare, hash } from "bcryptjs";import { generateOtp } from "../services/SessionOtp";
import { sendOtpEmail } from "../services/SessionOtp";
import { Otp } from "../database/models/OtpModel";
import { MoreThan } from "typeorm";
import { OAuth2Client } from "google-auth-library";


dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";
const COOKIE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const userRepository = AppDataSource.getRepository(Users);
    const otpRepository = AppDataSource.getRepository(Otp);

    const user = await userRepository.findOne({
      where: { email } });

    if (!user) {
      res.status(400).json({ message: "Invalid email." });
      return;
    }

    if (user.disabled) {
      res.status(403).json({ message: "User account is disabled. Contact admin." });
      return;
    }

    // Check password
    if (!user.password) {
      res.status(400).json({ message: "Password not set for this user." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid password.",isPasswordValid });
      return;
    }

   const otp = generateOtp(); 
   const expiry = new Date(Date.now() + 10 * 60 * 1000);
     
   // Save OTP to DB
    const otpRecord = otpRepository.create({
      userId: user.id,
      otpCode: otp,
      expiresAt: expiry,
    });

    await otpRepository.save(otpRecord);
   
    await sendOtpEmail(user.email, user.lastName, user.firstName, otp);



    res.status(200).json({
      message: "OTP sent. Please verify to complete login."
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};


export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    const userRepository = AppDataSource.getRepository(Users);
    const otpRepository = AppDataSource.getRepository(Otp);

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newOtp = otpRepository.create({
      userId: user.id,
      otpCode,
      expiresAt,
    });

    await otpRepository.save(newOtp);
    await sendOtpEmail(user.email, user.lastName, user.firstName, otpCode);

    res.status(200).json({ message: "OTP resent. Check your email." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp, email } = req.body; 

    if (!otp || !email) {
      res.status(400).json({ message: "OTP and email are required" });
      return;
    }

    const otpRepository = AppDataSource.getRepository(Otp);
    const userRepository = AppDataSource.getRepository(Users);

    // Find OTP record by user email and OTP code, still valid
    const user = await userRepository.findOne({ where: { email }, relations: ["organization"] });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otpRecord = await otpRepository.findOne({
      where: {
        userId: user.id,
        otpCode: otp,
        expiresAt: MoreThan(new Date()),
        used: false,
      },
    });

    if (!otpRecord) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Mark OTP as used in DB
    otpRecord.used = true;
    await otpRepository.save(otpRecord);

    // Create token
    const token = jwt.sign(
      {
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
        organizationId: user.organization,
        profilePicture: user.profilePicUrl
      },
      SECRET_KEY,
      { expiresIn: "30d" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: COOKIE_EXPIRATION,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      message: "OTP verified. Login successful.",
      token,
      user: {
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
        organizationId: user.organization,
        profilePicture: user.profilePicUrl
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error during logout" });
  }
}


  export const  googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ message: "Google token is required." });
        return;
      }

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(400).json({ message: "Invalid Google token." });
        return;
      }

      const email = payload.email;

      // Check if user exists in DB
      const userRepo = AppDataSource.getRepository(Users);
      const user = await userRepo.findOne({ where: { email } });

      if (!user) {
        res.status(401).json({ message: "No account found for this email. Contact admin." });
        return;
      }

      // Create JWT
      const accessToken = jwt.sign(
        {
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
          organizationId: user.organization,
          profilePicture: user.profilePicUrl
        },
        SECRET_KEY,
        { expiresIn: "30d" }
      );


      res.status(200).json({
        message: "Login successful.",
        token,
        user: {
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
          organizationId: user.organization,
          profilePicture: user.profilePicUrl
        }
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({ message: "Google login failed.", error });
    }
  }





// ======================================================================
import { sendResetPasswordEmail } from "../services/SessionOtp";
import { logActivity } from "../middleware/ActivityLog";
import crypto from 'crypto';
import { uploadToCloudinary } from "../services/cloudinary";
import { getOrCreateUser } from "../utils/createUser";
import { Organization } from "../database/models/OrganizationModel";


interface CustomRequest extends Request {
  user?: { id: number, roleName?: string };
}



export class UserClassController {

static async addUser(req: Request, res: Response): Promise<void> {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      organizationId,
    } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ message: "firstName, lastName and email are required." });
      return;
    }

    // check if organization exists
    if (organizationId && role !== "admin") {
      const organizationRepository = AppDataSource.getRepository(Organization);
      const organization = await organizationRepository.findOne({ where: { id: organizationId } });
      if (!organization) {
        res.status(404).json({ message: "Organization not found." });
        return;
      }
    }

    const userRepository = AppDataSource.getRepository(Users);

    // Check for duplicate user
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: `Users with email ${email} already exists.` });
      return;
    }

    // Create user using helper
    const newUser = await getOrCreateUser({
      firstName,
      lastName,
      email,
      req,
      organizationId,
      role,
    });

    await userRepository.save(newUser);

    // Log activity
    const actor = (req as CustomRequest).user;
    if (actor) {
      await logActivity({
        userId: actor.id,
        action: "Created user",
        targetId: newUser.id.toString(),
        targetType: "Users",
        details: `Created user ${firstName} ${lastName} (${email}) with role ${role}`,
      });
    }

    res.status(201).json({
      message: "Users created successfully.",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding user.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


static async getUsers(req: CustomRequest, res: Response): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(Users);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [users, total] = await userRepository.findAndCount({
      relations: ["organization"],
      skip: offset,
      take: limit,
    });

    const userDtos = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organization: user.organization,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: user.role || null,
    }));

    res.status(200).json({
      message: "Users fetched successfully",
      page,
      limit,
      total,
      users: userDtos,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}



static async getUserById(req: Request, res: Response): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
      relations: ["organization"],
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profilePicUrl: user.profilePicUrl || null,
        organization: user.organization ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

  static async updateUser(req: CustomRequest, res: Response): Promise<void> {
    try {
        const userRepository = AppDataSource.getRepository(Users);

        const userId = Number(req.params.id);
        const { firstName, lastName, email, isActive, organizationId } = req.body;

        // Find existing user
        const user = await userRepository.findOne({
            where: { id: userId } });

        if (!user) {
            res.status(404).json({ message: "Users not found" });
            return;
        }

        // Update other fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (isActive !== undefined) user.isActive = isActive;

        // Update organization if provided
        if (organizationId !== undefined) {
            const organization = await AppDataSource.getRepository(Organization).findOneBy({ id: organizationId });
            if (organization) user.organization = organization;
        }

        // Save updated user
        await userRepository.save(user);

        // Log it
        const actor = (req as CustomRequest).user;
        if (actor) {
        await logActivity({
            userId: actor.id,
            action: "Updated user",
            targetId: user.id.toString(),
            targetType: "Users",
            details: `Updated user ${user.firstName} ${user.lastName} (${user.email})`,
        });
        }

        res.status(200).json({
            message: "Users updated successfully",
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isActive: user.isActive,
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error updating user", 
            error: error instanceof Error ? error.message : String(error)
        });
    }
  }

  static async toggleUserDisabled(req: CustomRequest, res: Response): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(Users);
    const userId = Number(req.params.id);

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Flip the disabled status
    user.disabled = !user.disabled;

    await userRepository.save(user);

    // Log action
    const actor = (req as CustomRequest).user;
    if (actor) {
      await logActivity({
        userId: actor.id,
        action: user.disabled ? "Disabled user" : "Enabled user",
        targetId: user.id.toString(),
        targetType: "Users",
        details: `${user.disabled ? "Disabled" : "Enabled"} user ${user.firstName} ${user.lastName} (${user.email})`,
      });
    }

    res.status(200).json({
      message: `User ${user.disabled ? "disabled" : "enabled"} successfully`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        disabled: user.disabled,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error toggling user disabled status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


 static async deleteUser(req: CustomRequest, res: Response): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(Users);
    const userId = Number(req.params.id);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "Users not found" });
      return;
    }


    // Log activity
    const actor = (req as CustomRequest).user;
    if (actor) {
      await logActivity({
        userId: actor.id,
        action: "Deleted user",
        targetId: user.id.toString(),
        targetType: "Users",
        details: `Deleted user ${user.firstName} ${user.lastName} (${user.email})`,
      });
    }

    await userRepository.remove(user);

    res.status(200).json({
      message: "Users deleted successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


    static async changePassword(req: Request, res: Response): Promise<void> {
      const userId = Number(req.params.id);
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword || newPassword.length < 6) {
        res.status(400).json({ message: "Old and new passwords are required. New must be at least 6 chars." });
        return;
      }

      try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOneBy({ id: userId });

        if (!user) {
          res.status(404).json({ message: "Users not found." });
          return;
        }

        const isMatch = await compare(oldPassword, user.password!);
        if (!isMatch) {
          res.status(401).json({ message: "Old password is incorrect." });
          return;
        }

        user.password = await hash(newPassword, 10);
        user.firstLogin = false;
        await userRepo.save(user);

        await logActivity({
            userId,
            action: 'Changed password',
            targetId: userId.toString(),
            targetType: 'Users',
            details: `Users changed their password.`,
        });

        res.status(200).json({ message: "Password changed successfully." });
      } catch (err) {
        res.status(500).json({ message: "Error updating password", error: err instanceof Error ? err.message : String(err) });
      }
    }

    static async toggleFirstLogin(req: Request, res: Response): Promise<void> {
      const userId = Number(req.params.id);
      const { firstLogin } = req.body;

      if (typeof firstLogin !== "boolean") {
        res.status(400).json({ message: "'firstLogin' must be a boolean." });
        return;
      }

      try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOneBy({ id: userId });

        if (!user) {
          res.status(404).json({ message: "User not found." });
          return;
        }

        user.firstLogin = firstLogin;
        await userRepo.save(user);

        await logActivity({
          userId,
          action: 'Toggled firstLogin',
          targetId: userId.toString(),
          targetType: 'Users',
          details: `Set firstLogin to ${firstLogin}`,
        });

        res.status(200).json({ message: `firstLogin set to ${firstLogin}` });
      } catch (err) {
        res.status(500).json({ message: "Error updating firstLogin", error: err instanceof Error ? err.message : String(err) });
      }
    }



    static async forgotPassword(req: Request, res: Response): Promise<void> {
      const { email, frontendBaseUrl } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required." });
        return;
      }

      try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOneBy({ email });

        if (!user) {
          // Don't reveal if email exists, just say "if email found"
          res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
          return;
        }

        // Generate token & expiry (e.g. 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = Date.now() + 3600 * 1000; // hour from now

        // Save hashed token and expiry to user (add these columns to Users model)
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(resetExpires);
        await userRepo.save(user);

        // Send email with link
        await sendResetPasswordEmail(email, resetToken, frontendBaseUrl);

        res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
      } catch (err) {
        res.status(500).json({ message: "Error processing forgot password", error: err instanceof Error ? err.message : String(err) });
      }
    }


    static async resetPassword(req: Request, res: Response): Promise<void> {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword || newPassword.length < 6) {
        res.status(400).json({ message: "Email, token, and new password (6+ chars) are required." });
        return;
      }

      try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOneBy({ email });

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
          res.status(400).json({ message: "Invalid or expired token." });
          return;
        }

        // Hash incoming token & compare
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        if (tokenHash !== user.resetPasswordToken || user.resetPasswordExpires < new Date()) {
          res.status(400).json({ message: "Invalid or expired token." });
          return;
        }

        // All good, update password
        user.password = await hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await userRepo.save(user);

        await logActivity({
          userId: user.id,
          action: 'Reset password',
          targetId: user.id.toString(),
          targetType: 'Users',
          details: 'Users reset their password using reset token.',
        });

        res.status(200).json({ message: "Password reset successfully." });
      } catch (err) {
        res.status(500).json({ message: "Error resetting password", error: err instanceof Error ? err.message : String(err) });
      }
    }


    static async uploadProfilePic(req: CustomRequest, res: Response): Promise<void> {
      const userId = Number(req.params.id);
      const file = req.file;

      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      try {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          res.status(400).json({ message: "Only image files are allowed (jpg, png, webp)" });
          return;
        }
        const result = await uploadToCloudinary(file.path);

        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOne({ where: { id: userId } });

        if (!user) {
          res.status(404).json({ message: "Users not found" });
          return;
        }

        user.profilePicUrl = result.secure_url;
        await userRepo.save(user);

        res.status(200).json({ message: "Profile picture updated", profilePicUrl: user.profilePicUrl });
      } catch (err) {
        res.status(500).json({ error: err });
      }
    }


}




// =============================================================================






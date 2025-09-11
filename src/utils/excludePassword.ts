import { Users } from "../database/models/UserModel";


export const excludePassword = (user: Users | null) => {
  if (!user) return null;
  const { password, resetPasswordExpires, resetPasswordToken, firstLogin, isEmailVerified, preferredLanguage, theme, notificationSettings, disabled, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
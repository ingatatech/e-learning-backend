import { Users } from "../database/models/UserModel";


export const excludePassword = (user: Users | null) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
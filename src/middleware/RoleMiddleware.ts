import { Request, Response, NextFunction } from "express";


interface CustomRequest extends Request {
  user?: {
    id?: number;
    email?: string;
    role?: string;
  };
}

export const hasRole = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user?.id || !user.role) {
        res.status(401).json({ message: "Unauthorized: User not found or role missing." });
        return;
      }

      const role = user.role.toLowerCase();

      if (!roles.map(r => r.toLowerCase()).includes(role)) {
        res.status(403).json({ message: "Forbidden: Insufficient role." });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ message: "Internal server error." });
    }
  };
};



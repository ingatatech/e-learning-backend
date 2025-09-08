
import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { ActivityLog } from '../database/models/ActivitiesModel';
import { excludePassword } from "../utils/excludePassword";

interface CustomRequest extends Request {
  user?: { id: number; roleName: string; organizationId: number };
  file?: Express.Multer.File;

}

export const getAllLogs = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const logRepo = AppDataSource.getRepository(ActivityLog);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let logs: ActivityLog[] = [];
    let total = 0;
    
    if (user!.roleName === "admin") {
      [logs, total] = await logRepo.findAndCount({
        relations: ["user"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });
    } else if (user!.roleName === "orgadmin") {
      const qb = logRepo
        .createQueryBuilder("log")
        .leftJoinAndSelect("log.user", "user")
        .where("user.organizationId = :orgId", { orgId: user!.organizationId })
        .orderBy("log.createdAt", "DESC")
        .skip(offset)
        .take(limit);

      logs = await qb.getMany();
      total = await qb.getCount();
    } else {
      [logs, total] = await logRepo.findAndCount({
        where: { user: { id: user!.id } },
        relations: ["user"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });
    }

    const sanitizedLogs = logs.map((log) => ({
      ...log,
      user: excludePassword(log.user),
    }));

    res.status(200).json({ page, limit, total, data: sanitizedLogs });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve logs", error: err instanceof Error ? err.message : String(err) });
  }
};


export const getLogsForFile = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const logRepo = AppDataSource.getRepository(ActivityLog);

    const logs = await logRepo.find({
      where: { targetType: "File", targetId: fileId },
      relations: ["user"],
      order: { createdAt: "DESC" }
    });

    const sanitizedLogs = logs.map((log) => ({
      ...log,
      user: excludePassword(log.user),
    }));

    res.status(200).json({ sanitizedLogs });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving file logs", error: err instanceof Error ? err.message : String(err) });
  }
};


export const getLogsForFolder = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    const logRepo = AppDataSource.getRepository(ActivityLog);

    const logs = await logRepo.find({
      where: { targetType: "Folder", targetId: folderId },
      relations: ["user"],
      order: { createdAt: "DESC" }
    });

    const sanitizedLogs = logs.map((log) => ({
      ...log,
      user: excludePassword(log.user),
    }));

    res.status(200).json({ sanitizedLogs });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving folder logs", error: err instanceof Error ? err.message : String(err) });
  }
};


export const getLogsForUser = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const logRepo = AppDataSource.getRepository(ActivityLog);

    const logs = await logRepo.find({
      where: { user: { id: +userId } },
      relations: ["user"],
      order: { createdAt: "DESC" }
    });

    const sanitizedLogs = logs.map((log) => ({
      ...log,
      user: excludePassword(log.user),
    }));

    res.status(200).json({ sanitizedLogs });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving user logs", error: err instanceof Error ? err.message : String(err) });
  }
};

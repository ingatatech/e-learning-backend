import { AppDataSource } from "../config/db";
import { Notification } from "../database/models/NotificationsModel";
import { Users } from "../database/models/UserModel";
import { io } from "../index";

export const createNotification = async ({
  userId,
  message,
  type,
  link, // <--- add this
}: {
  userId: number;
  message: string;
  type?: string;
  link?: string;
}) => {
  const notificationRepo = AppDataSource.getRepository(Notification);
  const userRepo = AppDataSource.getRepository(Users);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return;

  const notification = notificationRepo.create({
    user,
    message,
    type,
    link, 
  });
  await notificationRepo.save(notification);

  io.to(`user-${userId}`).emit("new_notification", {
    id: notification.id,
    message: notification.message,
    isRead: false,
    createdAt: notification.createdAt,
    type: notification.type,
    link: notification.link,
  });
};


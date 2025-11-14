import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "uploads",
    resource_type: "raw",
    public_id: file.originalname.split('.')[0].trim().replace(/[^\w\-_.]/g, "_"),
  }),
});

export { cloudinary };

export const uploadToCloudinary = (filePath: string): Promise<any> => {
  return cloudinary.uploader.upload(filePath, { folder: 'profile_pics' });
};

export const uploadToCloud = (filePath: string): Promise<any> => {
  return cloudinary.uploader.upload(filePath, { folder: 'thumbnails' });
};

export const uploadLessonImageToCloud = (filePath: string): Promise<any> => {
  return cloudinary.uploader.upload(filePath, { folder: 'lessons', resource_type: 'image' });
};

export const uploadLessonVideoToCloud = (filePath: string): Promise<any> => {
  return cloudinary.uploader.upload(filePath, { folder: 'lessons', resource_type: 'video' });
};

export const uploadDoc = (filePath: string): Promise<any> => {
  return cloudinary.uploader.upload(filePath, { folder: 'docs', resource_type: 'raw' });
};

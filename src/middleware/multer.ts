import multer from 'multer';
import { storage } from '../services/cloudinary';

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const originalName = file.originalname.trim();

    // Ends with space (even after trimming = bad)
    if (/\s$/.test(file.originalname)) {
      return cb(new Error("Filename must not end with whitespace"));
    }

    // Empty file
    if (file.size === 0) {
      return cb(new Error("File is empty"));
    }
    
    cb(null, true);
}

});

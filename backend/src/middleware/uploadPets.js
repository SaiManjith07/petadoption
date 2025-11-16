import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { validateImageFile } from '../utils/petValidation.js';

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/pets';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for pet photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitized = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    cb(null, `pet-${timestamp}-${random}-${sanitized}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const validation = validateImageFile(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 8, // Max 8 files
  },
});

export const uploadPetPhotos = upload.array('photos', 8);

export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 8MB limit',
        error: err.message,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload more than 8 photos',
        error: err.message,
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: err.message,
    });
  }
  next();
};

export default uploadPetPhotos;
